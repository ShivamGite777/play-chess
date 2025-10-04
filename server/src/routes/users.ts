import { FastifyPluginAsync } from 'fastify';
import { prismaPlugin } from '../plugins/prisma';
import { z } from 'zod';
import { authGuard } from '../middlewares/auth';

export const registerUserRoutes: FastifyPluginAsync<{ prisma: any }> = async (app, opts) => {
  await app.register(prismaPlugin, { prisma: opts.prisma });
  const requireAuth = authGuard();

  app.get('/:id/profile', async (req, reply) => {
    const id = (req.params as any).id as string;
    const user = await app.prisma.user.findUnique({ where: { id }, select: {
      id: true, username: true, avatarUrl: true, eloRating: true, createdAt: true,
    } });
    if (!user) return reply.notFound('User not found');
    return user;
  });

  app.get('/:id/stats', async (req, reply) => {
    const id = (req.params as any).id as string;
    const user = await app.prisma.user.findUnique({ where: { id }, select: {
      gamesPlayed: true, gamesWon: true, gamesLost: true, gamesDrawn: true, eloRating: true,
    } });
    if (!user) return reply.notFound('User not found');
    return user;
  });

  app.get('/:id/game-history', async (req, reply) => {
    const id = (req.params as any).id as string;
    const games = await app.prisma.game.findMany({
      where: { OR: [{ whitePlayerId: id }, { blackPlayerId: id }] },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, result: true, endReason: true, createdAt: true, completedAt: true },
    });
    return { games };
  });

  app.patch('/:id/settings', { preHandler: requireAuth }, async (req, reply) => {
    const id = (req.params as any).id as string;
    const me = (req as any).user as { sub: string };
    if (me.sub !== id) return reply.forbidden();
    const body = z.object({ avatarUrl: z.string().url().optional() }).parse(req.body);
    const updated = await app.prisma.user.update({ where: { id }, data: { avatarUrl: body.avatarUrl } });
    return { id: updated.id, avatarUrl: updated.avatarUrl };
  });
};
