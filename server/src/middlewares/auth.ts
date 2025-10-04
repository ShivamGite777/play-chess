import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyJwt } from '../utils/jwt';

export function authGuard() {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return reply.unauthorized('Missing bearer token');
    }
    const token = header.slice('Bearer '.length);
    const payload = verifyJwt(token);
    if (!payload) return reply.unauthorized('Invalid token');
    (req as any).user = payload;
  };
}

export type AuthedRequest = FastifyRequest & { user: { sub: string; username: string } };
