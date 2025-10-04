import type { Server } from 'socket.io';
import type { PrismaClient } from '@prisma/client';
import { applyGameResultElo } from '../services/rating-update';
import { Chess } from 'chess.js';
import { verifyJwt } from '../utils/jwt';

// In-memory presence and game state cache; in production, use Redis or Socket.io adapter
const gameClients = new Map<string, Set<string>>(); // gameId -> socketIds
const socketToGame = new Map<string, string>();
const tickerByGame = new Map<string, NodeJS.Timeout>();

export function registerWs(io: Server, prisma: PrismaClient) {
  io.engine.use((req: any, res: any, next: any) => {
    const token = (req._query && req._query.token) || (req.headers?.authorization?.replace('Bearer ', ''));
    if (!token) return next();
    const payload = verifyJwt(token);
    (req as any).user = payload || null;
    next();
  });

  io.on('connection', (socket) => {
    // Attach user to socket if provided
    const token = (socket.handshake.query as any).token as string | undefined;
    const payload = token ? verifyJwt(token) : null;
    (socket.data as any).user = payload;
    socket.on('join_game', async ({ gameId }: { gameId: string }) => {
      const game = await prisma.game.findUnique({ where: { id: gameId } });
      if (!game) return socket.emit('error', { message: 'Game not found' });

      socket.join(gameId);
      socketToGame.set(socket.id, gameId);
      if (!gameClients.has(gameId)) gameClients.set(gameId, new Set());
      gameClients.get(gameId)!.add(socket.id);

      socket.emit('state', { fen: game.fenPosition, pgn: game.pgn, timers: {
        whiteMs: game.whiteTimeRemaining,
        blackMs: game.blackTimeRemaining,
      }});
      socket.to(gameId).emit('presence', { type: 'join', socketId: socket.id });

      // Start a periodic timer broadcast if not running
      if (!tickerByGame.has(gameId)) {
        const interval = setInterval(async () => {
          const g = await prisma.game.findUnique({ where: { id: gameId } });
          if (!g || g.status !== 'active') return;
          const now = Date.now();
          const elapsed = Math.max(0, now - new Date(g.timerLastStamp as any).getTime());
          let whiteMs = g.whiteTimeRemaining;
          let blackMs = g.blackTimeRemaining;
          if (g.activeColor === 'white') whiteMs = Math.max(0, whiteMs - elapsed); else blackMs = Math.max(0, blackMs - elapsed);

          io.to(gameId).emit('timers', { whiteMs, blackMs, active: g.activeColor });

          if (whiteMs === 0 || blackMs === 0) {
            const result = whiteMs === 0 ? 'black_wins' : 'white_wins';
            await prisma.game.update({ where: { id: gameId }, data: {
              status: 'completed', result, endReason: 'timeout', completedAt: new Date(),
            }});
            await applyGameResultElo(prisma, gameId);
            io.to(gameId).emit('game_over', { result, reason: 'timeout' });
            clearInterval(interval);
            tickerByGame.delete(gameId);
          }
        }, 1000);
        tickerByGame.set(gameId, interval);
      }
    });

    socket.on('move', async ({ gameId, from, to, promotion }: { gameId: string; from: string; to: string; promotion?: string }) => {
      const game = await prisma.game.findUnique({ where: { id: gameId } });
      if (!game) return socket.emit('error', { message: 'Game not found' });
      if (game.status !== 'active') return socket.emit('error', { message: 'Game not active' });
      // Enforce turn and player ownership
      const userId = (socket.data as any).user?.sub as string | undefined;
      if (!userId) return socket.emit('error', { message: 'Unauthorized' });
      const isWhite = game.whitePlayerId === userId;
      const myTurnIsWhite = new Chess(game.fenPosition).turn() === 'w';
      if ((isWhite && !myTurnIsWhite) || (!isWhite && myTurnIsWhite)) return socket.emit('error', { message: 'Not your turn' });

      try {
        const chess = new Chess(game.fenPosition);
        const move = chess.move({ from, to, promotion: promotion as any });
        if (!move) return socket.emit('error', { message: 'Illegal move' });

        const now = Date.now();
        let whiteMs = game.whiteTimeRemaining;
        let blackMs = game.blackTimeRemaining;
        const elapsed = Math.max(0, now - new Date(game.timerLastStamp as any).getTime());
        if (game.activeColor === 'white') whiteMs = Math.max(0, whiteMs - elapsed); else blackMs = Math.max(0, blackMs - elapsed);
        if (game.incrementSeconds > 0) {
          if (game.activeColor === 'white') whiteMs += game.incrementSeconds * 1000; else blackMs += game.incrementSeconds * 1000;
        }
        const nextTurn = chess.turn() === 'w' ? 'white' : 'black';
        await prisma.game.update({ where: { id: gameId }, data: { 
          fenPosition: chess.fen(), pgn: chess.pgn(),
          whiteTimeRemaining: whiteMs, blackTimeRemaining: blackMs,
          activeColor: nextTurn, timerLastStamp: new Date(now) 
        } });
        io.to(gameId).emit('moved', { from, to, san: move.san, fen: chess.fen(), pgn: chess.pgn(), timers: { whiteMs, blackMs } });
      } catch (e: any) {
        return socket.emit('error', { message: e.message ?? 'Invalid move' });
      }
    });

    socket.on('chat', ({ gameId, message }: { gameId: string; message: string }) => {
      io.to(gameId).emit('chat', { socketId: socket.id, message });
    });

    socket.on('offer_draw', ({ gameId }: { gameId: string }) => {
      socket.to(gameId).emit('draw_offered');
    });

    socket.on('respond_draw', async ({ gameId, accept }: { gameId: string; accept: boolean }) => {
      if (!accept) return io.to(gameId).emit('draw_declined');
      await prisma.game.update({ where: { id: gameId }, data: {
        status: 'completed', result: 'draw', endReason: 'draw_agreement', completedAt: new Date(),
      }});
      io.to(gameId).emit('game_over', { result: 'draw', reason: 'draw_agreement' });
    });

    socket.on('resign', async ({ gameId, color }: { gameId: string; color: 'white' | 'black' }) => {
      const game = await prisma.game.findUnique({ where: { id: gameId } });
      if (!game) return;
      const result = color === 'white' ? 'black_wins' : 'white_wins';
      await prisma.game.update({ where: { id: gameId }, data: {
        status: 'completed', result, endReason: 'resignation', completedAt: new Date(),
      }});
      await applyGameResultElo(prisma, gameId);
      io.to(gameId).emit('game_over', { result, reason: 'resignation' });
    });

    socket.on('disconnect', () => {
      const gameId = socketToGame.get(socket.id);
      if (gameId) {
        gameClients.get(gameId)?.delete(socket.id);
        socket.to(gameId).emit('presence', { type: 'leave', socketId: socket.id });
        if (gameClients.get(gameId)?.size === 0) gameClients.delete(gameId);
        socketToGame.delete(socket.id);
        if (!gameClients.get(gameId) || gameClients.get(gameId)!.size === 0) {
          const t = tickerByGame.get(gameId);
          if (t) {
            clearInterval(t);
            tickerByGame.delete(gameId);
          }
        }
      }
    });
  });
}
