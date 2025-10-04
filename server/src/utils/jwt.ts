import jwt, { Secret, SignOptions } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev_secret';

export type JwtPayload = {
  sub: string;
  username: string;
};

export function signJwt(payload: JwtPayload, expiresIn: string | number = '7d') {
  return jwt.sign(payload as any, JWT_SECRET as Secret, { expiresIn } as SignOptions);
}

export function verifyJwt<T extends object = JwtPayload>(token: string): T | null {
  try {
    return jwt.verify(token, JWT_SECRET as Secret) as T;
  } catch {
    return null;
  }
}
