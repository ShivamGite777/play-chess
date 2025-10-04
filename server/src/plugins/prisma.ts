import { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';

export const prismaPlugin: FastifyPluginAsync<{ prisma: PrismaClient }> = async (app, opts) => {
  app.decorate('prisma', opts.prisma);
  app.addHook('onClose', async () => {
    await opts.prisma.$disconnect();
  });
};
