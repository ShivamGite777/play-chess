import { Chess } from 'chess.js';

export type ChessValidationResult = {
  ok: true;
  game: Chess;
  san: string;
  isCheck: boolean;
  isCheckmate: boolean;
  isCastle: boolean;
  captured?: string;
} | {
  ok: false;
  error: string;
};

export function validateAndApplyMove(fen: string, from: string, to: string, promotion?: string): ChessValidationResult {
  try {
    const game = new Chess(fen);
    const move = game.move({ from, to, promotion: promotion as any });
    if (!move) return { ok: false, error: 'Illegal move' };
    return {
      ok: true,
      game,
      san: move.san,
      isCheck: !!game.inCheck?.() || !!(game as any).in_check?.() || !!game.isCheck?.(),
      isCheckmate: typeof (game as any).isCheckmate === 'function' ? (game as any).isCheckmate() : !!(game as any).in_checkmate?.(),
      isCastle: move.flags.includes('k') || move.flags.includes('q'),
      captured: move.captured,
    } as any;
  } catch (e: any) {
    return { ok: false, error: e.message ?? 'Invalid position' };
  }
}
