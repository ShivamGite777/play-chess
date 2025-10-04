import 'dotenv/config';
import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import Redis from 'ioredis';
import fastifySensible from '@fastify/sensible';
import { Server as IOServer } from 'socket.io';
import pino from 'pino';
import pinoPretty from 'pino-pretty';
import * as Sentry from '@sentry/node';
import { PrismaClient } from '@prisma/client';

import { registerAuthRoutes } from './routes/auth';
import { registerGameRoutes } from './routes/games';
import { registerUserRoutes } from './routes/users';
import { registerWs } from './ws/server';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const logger = pino(
  process.env.NODE_ENV === 'production'
    ? { level: 'info' }
    : pinoPretty({ colorize: true, translateTime: 'SYS:standard' }) as any
);
const prisma = new PrismaClient();

async function buildServer() {
  const app = Fastify({ logger: { level: logger.level } });

  // Sentry init
  if (process.env.SENTRY_DSN) {
    Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1 });
  }

  await app.register(fastifySensible);
  await app.register(fastifyHelmet);
  await app.register(fastifyCors, {
    origin: process.env.CLIENT_ORIGIN ?? true,
    credentials: true,
  });
  await app.register(fastifyRateLimit, {
    max: 200,
    timeWindow: '1 minute',
    allowList: [],
    redis: new Redis(process.env.REDIS_URL || 'redis://localhost:6379'),
  });

  // Serve sounds for frontend use (optional)
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  await app.register(fastifyStatic, {
    root: join(__dirname, '../public'),
    prefix: '/public/',
  });

  // Health
  app.get('/health', async () => ({ status: 'ok' }));

  // Routes
  await app.register(registerAuthRoutes, { prefix: '/api/auth', prisma });
  await app.register(registerGameRoutes, { prefix: '/api/games', prisma });
  await app.register(registerUserRoutes, { prefix: '/api/users', prisma });

  // Attach Socket.io to Fastify's underlying HTTP server
  const io = new IOServer(app.server, {
    cors: { origin: process.env.CLIENT_ORIGIN ?? true, credentials: true },
    transports: ['websocket', 'polling'],
  });
  registerWs(io, prisma);

  const port = Number(process.env.PORT ?? 4000);
  await app.listen({ port, host: '0.0.0.0' });
  logger.info({ port }, 'Server listening');
}

buildServer().catch((err) => {
  logger.error(err, 'Fatal error');
  process.exit(1);
});
