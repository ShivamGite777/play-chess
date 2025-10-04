import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { signJwt } from '../utils/jwt';
import { prismaPlugin } from '../plugins/prisma';

const registerSchema = z.object({
  username: z.string().min(3).max(24).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

const loginSchema = z.object({
  usernameOrEmail: z.string(),
  password: z.string(),
});

export const registerAuthRoutes: FastifyPluginAsync<{ prisma: any }> = async (app, opts) => {
  await app.register(prismaPlugin, { prisma: opts.prisma });

  app.post('/register', async (req, reply) => {
    const body = registerSchema.parse(req.body);
    const hashed = await bcrypt.hash(body.password, 10);
    try {
      const user = await app.prisma.user.create({
        data: {
          username: body.username,
          email: body.email,
          passwordHash: hashed,
        },
        select: { id: true, username: true },
      });
      const token = signJwt({ sub: user.id, username: user.username });
      return reply.send({ token, user });
    } catch (e: any) {
      if (e.code === 'P2002') return reply.conflict('Username or email already exists');
      throw e;
    }
  });

  app.post('/login', async (req, reply) => {
    const body = loginSchema.parse(req.body);
    const user = await app.prisma.user.findFirst({
      where: {
        OR: [{ username: body.usernameOrEmail }, { email: body.usernameOrEmail }],
      },
    });
    if (!user) return reply.unauthorized('Invalid credentials');
    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) return reply.unauthorized('Invalid credentials');
    const token = signJwt({ sub: user.id, username: user.username });
    return reply.send({ token, user: { id: user.id, username: user.username } });
  });

  app.post('/logout', async (_req, reply) => {
    return reply.send({ ok: true });
  });

  app.get('/me', async (req, reply) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return reply.unauthorized();
    const token = auth.slice('Bearer '.length);
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
      return reply.send({ token, user: { id: payload.sub, username: payload.username } });
    } catch {
      return reply.unauthorized();
    }
  });
};
