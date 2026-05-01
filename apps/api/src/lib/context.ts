import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import { AuthService } from '@rolldump/auth';
import { createDatabase } from '@rolldump/db';

export type Bindings = {
  DATABASE_URL: string;
  JWT_SECRET?: string;
  APP_URL?: string;
};

export type Variables = {
  user: { id: string; role?: string } | null;
  authService: AuthService;
  db: ReturnType<typeof createDatabase>;
};

export type AppEnv = { Bindings: Bindings; Variables: Variables };

export function createApp() {
  return new Hono<AppEnv>();
}

export const getJwtSecret = (c: any) =>
  c.env.JWT_SECRET || 'super-secret-key-for-dev-only-change-in-prod';

export const authMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload: any = await verify(token, getJwtSecret(c), 'HS256');
    c.set('user', { id: payload.sub, role: payload.role });
    await next();
  } catch {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
};

export const optionalAuth = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const payload: any = await verify(token, getJwtSecret(c), 'HS256');
      c.set('user', { id: payload.sub, role: payload.role });
    } catch {
      c.set('user', null);
    }
  } else {
    c.set('user', null);
  }
  await next();
};

export const requireRole = (...roles: string[]) => async (c: any, next: any) => {
  const u = c.get('user');
  if (!u) return c.json({ error: 'Unauthorized' }, 401);
  if (!roles.includes(u.role || 'user')) return c.json({ error: 'Forbidden' }, 403);
  await next();
};

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')
    .slice(0, 80);
}

export function cuidLike(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
