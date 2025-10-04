import { PrismaClient } from '@prisma/client';
import { updateEloRatings } from '../utils/ratings';

export async function applyGameResultElo(prisma: PrismaClient, gameId: string) {
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game || game.status !== 'completed' || !game.whitePlayerId || !game.blackPlayerId) return;

  const [white, black] = await Promise.all([
    prisma.user.findUnique({ where: { id: game.whitePlayerId } }),
    prisma.user.findUnique({ where: { id: game.blackPlayerId } }),
  ]);
  if (!white || !black) return;

  let resultA: 0 | 0.5 | 1 = 0.5;
  if (game.result === 'white_wins') resultA = 1;
  else if (game.result === 'black_wins') resultA = 0;

  const { newA, newB } = updateEloRatings(white.eloRating, black.eloRating, resultA);

  await prisma.$transaction([
    prisma.user.update({ where: { id: white.id }, data: {
      eloRating: newA,
      gamesPlayed: { increment: 1 },
      gamesWon: { increment: game.result === 'white_wins' ? 1 : 0 },
      gamesLost: { increment: game.result === 'black_wins' ? 1 : 0 },
      gamesDrawn: { increment: game.result === 'draw' ? 1 : 0 },
    }}),
    prisma.user.update({ where: { id: black.id }, data: {
      eloRating: newB,
      gamesPlayed: { increment: 1 },
      gamesWon: { increment: game.result === 'black_wins' ? 1 : 0 },
      gamesLost: { increment: game.result === 'white_wins' ? 1 : 0 },
      gamesDrawn: { increment: game.result === 'draw' ? 1 : 0 },
    }}),
  ]);
}
