import { sign } from 'hono/jwt';
import { eq } from 'drizzle-orm';
import { users, userSessions } from '@rolldump/db';
import { createApp, getJwtSecret, authMiddleware } from '../lib/context';

const auth = createApp();

auth.post('/register', async (c) => {
  try {
    const body = await c.req.json();
    const { email, username, password, fullName } = body || {};
    if (!email || !username || !password || password.length < 8) {
      return c.json(
        { error: 'Format tidak valid. Pastikan semua field terisi dan password minimal 8 karakter.' },
        400,
      );
    }
    const authService = c.get('authService');
    try {
      const user = await authService.register({
        email,
        username,
        password,
        fullName: fullName || username,
        role: 'user',
        status: 'active', // auto-active for demo so onboarding starts immediately
      });
      const verifyToken = await authService.createEmailVerification(user.id);

      // Auto-issue access token so the FE can land the user directly on
      // /onboarding without an extra login step. The verify token is still
      // returned so they can verify their email later.
      const session = await authService.createSession(user.id, {
        userAgent: c.req.header('User-Agent') || '',
        ip: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || '',
      });
      const accessToken = await sign(
        {
          sub: user.id,
          role: user.role,
          exp: Math.floor(Date.now() / 1000) + 60 * 60,
        },
        getJwtSecret(c),
      );
      return c.json(
        {
          message: 'Registration successful',
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            fullName: user.fullName,
            role: user.role,
          },
          verification_required: true,
          verify_token: verifyToken,
          access_token: accessToken,
          refresh_token: session.refreshToken,
        },
        201,
      );
    } catch (e: any) {
      if (e.message?.includes('duplicate key')) {
        return c.json({ error: 'Email atau username sudah terdaftar.' }, 409);
      }
      throw e;
    }
  } catch (e: any) {
    return c.json({ error: e.message }, 400);
  }
});

auth.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const identifier = body.identifier || body.email || body.username;
    if (!identifier || !body.password)
      return c.json({ error: 'Email/Username dan Password wajib diisi.' }, 400);
    const authService = c.get('authService');
    let user;
    try {
      user = await authService.login(identifier, body.password);
    } catch {
      return c.json({ error: 'Kredensial salah.' }, 401);
    }
    if (user.status === 'pending') {
      return c.json({ error: 'Akun belum diverifikasi. Cek email Anda.', code: 'VERIFY_REQUIRED' }, 403);
    }
    if (user.status === 'suspended' || user.status === 'banned') {
      return c.json({ error: 'Akun dibekukan/diblokir.' }, 403);
    }
    const session = await authService.createSession(user.id, {
      userAgent: c.req.header('User-Agent') || '',
      ip: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || '',
    });
    const accessToken = await sign(
      {
        sub: user.id,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + 60 * 60,
      },
      getJwtSecret(c),
    );
    await c
      .get('db')
      .update(users)
      .set({ lastLoginAt: new Date(), lastLoginIp: c.req.header('CF-Connecting-IP') || '' })
      .where(eq(users.id, user.id));
    return c.json({
      access_token: accessToken,
      refresh_token: session.refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        fullName: user.fullName,
      },
    });
  } catch (e: any) {
    return c.json({ error: e.message }, 400);
  }
});

auth.post('/refresh', async (c) => {
  const { refresh_token } = await c.req.json();
  const authService = c.get('authService');
  const result = await authService.validateRefreshToken(refresh_token);
  if (!result) return c.json({ error: 'Invalid refresh token' }, 401);
  const accessToken = await sign(
    {
      sub: result.user.id,
      role: result.user.role,
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    },
    getJwtSecret(c),
  );
  return c.json({ access_token: accessToken });
});

auth.post('/logout', authMiddleware, async (c) => {
  const { refresh_token } = await c.req.json();
  if (refresh_token) await c.get('authService').revokeSession(refresh_token);
  return c.body(null, 204);
});

auth.post('/logout-all', authMiddleware, async (c) => {
  await c.get('authService').revokeAllSessions(c.get('user')!.id);
  return c.body(null, 204);
});

auth.get('/sessions', authMiddleware, async (c) => {
  const sessions = await c.get('authService').listSessions(c.get('user')!.id);
  return c.json({ sessions });
});

auth.delete('/sessions/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  await c
    .get('db')
    .update(userSessions)
    .set({ revokedAt: new Date() })
    .where(eq(userSessions.id, id));
  return c.body(null, 204);
});

auth.post('/send-verification', authMiddleware, async (c) => {
  const userId = c.get('user')!.id;
  const token = await c.get('authService').createEmailVerification(userId);
  return c.json({ message: 'Email verifikasi dikirim', verify_token: token });
});

auth.get('/verify', async (c) => {
  const token = c.req.query('token');
  if (!token) return c.json({ error: 'Token diperlukan' }, 400);
  const userId = await c.get('authService').consumeEmailVerification(token);
  if (!userId) return c.json({ error: 'Token tidak valid atau kedaluwarsa' }, 410);
  return c.json({ message: 'Akun terverifikasi', userId });
});

auth.post('/forgot-password', async (c) => {
  const { email } = await c.req.json();
  const token = await c.get('authService').createPasswordReset(email || '');
  // Anti-enumeration: always 200 with same message; expose token in dev
  return c.json({
    message: 'Jika email terdaftar, tautan reset telah dikirim.',
    reset_token: token,
  });
});

auth.post('/reset-password', async (c) => {
  const { token, new_password } = await c.req.json();
  if (!token || !new_password || new_password.length < 8)
    return c.json({ error: 'Token dan password baru (min 8) wajib diisi' }, 400);
  const ok = await c.get('authService').consumePasswordReset(token, new_password);
  if (!ok) return c.json({ error: 'Token tidak valid atau kedaluwarsa' }, 410);
  return c.json({ message: 'Password berhasil diubah' });
});

export default auth;
