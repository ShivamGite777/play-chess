import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prismaPlugin } from '../plugins/prisma';
import { authGuard } from '../middlewares/auth';
import { createInitialClock, onMoveComplete } from '../services/time-control';
import { validateAndApplyMove } from '../services/chess';
import { Chess } from 'chess.js';
import Redis from 'ioredis';
import { applyGameResultElo } from '../services/rating-update';

const createGameSchema = z.object({
  gameMode: z.enum(['bullet', 'blitz', 'rapid', 'classical']),
  minutes: z.number().int().positive(),
  incrementSeconds: z.number().int().nonnegative().optional(),
  delaySeconds: z.number().int().nonnegative().optional(),
  delayMode: z.enum(['none', 'fischer', 'bronstein', 'simple']).optional(),
  colorPreference: z.enum(['white', 'black', 'random']).default('random'),
  opponentId: z.string().uuid().optional(),
});

export const registerGameRoutes: FastifyPluginAsync<{ prisma: any }> = async (app, opts) => {
  await app.register(prismaPlugin, { prisma: opts.prisma });
  const requireAuth = authGuard();
  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

  app.get('/', async (_req, _reply) => {
    const cacheKey = 'active_games_v1';
    const cached = await redis.get(cacheKey);
    if (cached) return { games: JSON.parse(cached) };
    const games = await app.prisma.game.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, gameMode: true, timeControl: true, incrementSeconds: true, status: true },
    });
    await redis.set(cacheKey, JSON.stringify(games), 'EX', 5);
    return { games };
  });

  app.post('/create', { preHandler: requireAuth }, async (req, reply) => {
    const body = createGameSchema.parse(req.body);

    const clock = createInitialClock({
      mode: body.gameMode,
      minutes: body.minutes,
      incrementSeconds: body.incrementSeconds,
      delaySeconds: body.delaySeconds,
      delayMode: body.delayMode ?? 'none',
    });

    const chess = new Chess();
    const fen = chess.fen();

    const user = (req as any).user as { sub: string };

    const color = body.colorPreference === 'random'
      ? (Math.random() < 0.5 ? 'white' : 'black')
      : body.colorPreference;

    const data: any = {
      gameMode: body.gameMode,
      timeControl: body.minutes,
      incrementSeconds: body.incrementSeconds ?? 0,
      delaySeconds: body.delaySeconds ?? null,
      delayMode: body.delayMode ?? 'none',
      fenPosition: fen,
      pgn: '',
      whiteTimeRemaining: clock.whiteMs,
      blackTimeRemaining: clock.blackMs,
      activeColor: 'white',
      timerLastStamp: new Date(),
      status: 'active',
    };

    if (color === 'white') data.whitePlayerId = user.sub; else data.blackPlayerId = user.sub;
    if (body.opponentId) {
      if (color === 'white') data.blackPlayerId = body.opponentId; else data.whitePlayerId = body.opponentId;
    }

    const game = await app.prisma.game.create({ data, select: { id: true } });
    await redis.del('active_games_v1');
    return reply.code(201).send({ id: game.id });
  });

  app.post('/:id/join', { preHandler: requireAuth }, async (req, reply) => {
    const id = (req.params as any).id as string;
    const me = (req as any).user as { sub: string };
    const game = await app.prisma.game.findUnique({ where: { id } });
    if (!game) return reply.notFound('Game not found');
    if (game.status !== 'active') return reply.badRequest('Game not joinable');
    if (game.whitePlayerId && game.blackPlayerId) return reply.conflict('Game already has two players');
    if (game.whitePlayerId === me.sub || game.blackPlayerId === me.sub) return reply.badRequest('Already joined');

    const updated = await app.prisma.game.update({
      where: { id },
      data: { whitePlayerId: game.whitePlayerId ?? me.sub, blackPlayerId: game.blackPlayerId ?? me.sub },
      select: { id: true },
    });
    return { id: updated.id };
  });

  app.get('/:id', async (req, reply) => {
    const id = (req.params as any).id as string;
    const game = await app.prisma.game.findUnique({ where: { id } });
    if (!game) return reply.notFound('Game not found');
    return game;
  });

  const moveSchema = z.object({ from: z.string(), to: z.string(), promotion: z.string().optional() });

  app.post('/:id/move', { preHandler: requireAuth }, async (req, reply) => {
    const id = (req.params as any).id as string;
    const me = (req as any).user as { sub: string };
    const body = moveSchema.parse(req.body);

    const game = await app.prisma.game.findUnique({ where: { id } });
    if (!game) return reply.notFound('Game not found');
    if (game.status !== 'active') return reply.badRequest('Game not active');

    const isWhite = game.whitePlayerId === me.sub;
    const myTurnIsWhite = new Chess(game.fenPosition).turn() === 'w';
    if ((isWhite && !myTurnIsWhite) || (!isWhite && myTurnIsWhite)) return reply.badRequest('Not your turn');

    const res = validateAndApplyMove(game.fenPosition, body.from, body.to, body.promotion);
    if (!res.ok) return reply.badRequest(res.error);

    const moveNumber = (await app.prisma.move.count({ where: { gameId: game.id } })) + 1;

    // Update clock using server-side stamp and increment/delay
    const now = Date.now();
    let whiteMs = game.whiteTimeRemaining;
    let blackMs = game.blackTimeRemaining;
    const elapsed = Math.max(0, now - new Date(game.timerLastStamp as any).getTime());
    if (game.activeColor === 'white') whiteMs = Math.max(0, whiteMs - elapsed); else blackMs = Math.max(0, blackMs - elapsed);
    const nextTurn = res.game.turn() === 'w' ? 'white' : 'black';
    // Apply simple Fischer increment on the side that moved if configured
    if (game.incrementSeconds > 0) {
      if (game.activeColor === 'white') whiteMs += game.incrementSeconds * 1000; else blackMs += game.incrementSeconds * 1000;
    }

    const updated = await app.prisma.game.update({
      where: { id: game.id },
      data: {
        fenPosition: res.game.fen(),
        pgn: res.game.pgn(),
        whiteTimeRemaining: whiteMs,
        blackTimeRemaining: blackMs,
        activeColor: nextTurn,
        timerLastStamp: new Date(now),
      },
    });
    await redis.del('active_games_v1');

    await app.prisma.move.create({
      data: {
        gameId: game.id,
        moveNumber,
        playerColor: isWhite ? 'white' : 'black',
        fromSquare: body.from,
        toSquare: body.to,
        piece: '',
        notation: res.san,
        capturedPiece: res.captured ?? null,
        isCheck: res.isCheck,
        isCheckmate: res.isCheckmate,
        isCastling: res.isCastle,
        timeTaken: 0,
      },
    });

    if (res.isCheckmate) {
      const winnerId = isWhite ? game.whitePlayerId : game.blackPlayerId;
      const result = isWhite ? 'white_wins' : 'black_wins';
      await app.prisma.game.update({ where: { id: game.id }, data: {
        status: 'completed', result, winnerId: winnerId ?? null, endReason: 'checkmate', completedAt: new Date(),
      }});
      await applyGameResultElo(app.prisma, game.id);
    }

    return { id: updated.id, fen: updated.fenPosition, pgn: updated.pgn, turn: nextTurn };
  });

  app.post('/:id/resign', { preHandler: requireAuth }, async (req, reply) => {
    const id = (req.params as any).id as string;
    const me = (req as any).user as { sub: string };
    const game = await app.prisma.game.findUnique({ where: { id } });
    if (!game) return reply.notFound('Game not found');
    if (game.status !== 'active') return reply.badRequest('Game not active');

    const resignedIsWhite = game.whitePlayerId === me.sub;
    const winnerId = resignedIsWhite ? game.blackPlayerId : game.whitePlayerId;
    const result = resignedIsWhite ? 'black_wins' : 'white_wins';

    await app.prisma.game.update({
      where: { id },
      data: {
        status: 'completed',
        result,
        winnerId: winnerId ?? null,
        endReason: 'resignation',
        completedAt: new Date(),
      },
    });
    await applyGameResultElo(app.prisma, id);
    await redis.del('active_games_v1');

    return { ok: true };
  });

  app.post('/:id/draw-offer', { preHandler: requireAuth }, async (_req, reply) => {
    // WebSocket will coordinate offers; REST endpoint is a no-op placeholder
    return reply.send({ ok: true });
  });

  app.get('/:id/history', async (req, reply) => {
    const id = (req.params as any).id as string;
    const moves = await app.prisma.move.findMany({ where: { gameId: id }, orderBy: { moveNumber: 'asc' } });
    return { moves };
  });
};
