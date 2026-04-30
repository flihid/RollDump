import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { AuthService } from '@rolldump/auth';
import { sign, verify } from 'hono/jwt';

type Bindings = {
  DATABASE_URL: string;
  JWT_SECRET?: string;
};

type Variables = {
  user: any;
  session: any;
  authService: AuthService;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use('*', cors());

// Middleware to inject AuthService
app.use('*', async (c, next) => {
  const authService = new AuthService(c.env.DATABASE_URL);
  c.set('authService', authService);
  await next();
});

const getJwtSecret = (c: any) => c.env.JWT_SECRET || 'super-secret-key-for-dev-only-change-in-prod';

// Auth Middleware
export const authMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = await verify(token, getJwtSecret(c));
    c.set('user', { id: payload.sub });
    await next();
  } catch (err) {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
};

const apiV1 = new Hono<{ Bindings: Bindings; Variables: Variables }>();

apiV1.post('/register', async (c) => {
  console.log('--- Mulai Registrasi ---');
  
  // TES KONEKSI INTERNET SEDERHANA
  try {
    console.log('Mengetes koneksi internet (ke google.com)...');
    const testFetch = await fetch('https://www.google.com', { method: 'HEAD' });
    console.log('Koneksi internet OK, status:', testFetch.status);
  } catch (e: any) {
    console.error('Koneksi internet GAGAL:', e.message);
  }

  try {
    const body = await c.req.json();
    const { email, username, password } = body;
    console.log('Request body diterima:', { email, username });

    if (!email || !username || !password || password.length < 8) {
      console.log('Validasi gagal');
      return c.json({ error: 'Format tidak valid. Pastikan semua field terisi dan password minimal 8 karakter.' }, 400);
    }

    const authService = c.get('authService');
    
    try {
      console.log('Mencoba menyimpan ke database...');
      const user = await authService.register({
        email,
        username,
        password,
        fullName: body.fullName || username,
        role: 'user',
        status: 'active'
      });
      console.log('Registrasi database sukses:', user.id);
      return c.json({ message: 'Registrasi berhasil', user }, 201);
    } catch (dbError: any) {
      console.error('Database Error:', dbError.message);
      // Drizzle/pg throws errors with 'duplicate key value violates unique constraint'
      if (dbError.message && dbError.message.includes('duplicate key')) {
        return c.json({ error: 'Email atau username sudah terdaftar.' }, 409);
      }
      throw dbError;
    }
  } catch (error: any) {
    console.error('General Error:', error.message);
    return c.json({ error: error.message }, 400);
  }
});

apiV1.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const authService = c.get('authService');
    const identifier = body.email || body.username; // Accept email or username
    
    if (!identifier || !body.password) {
      return c.json({ error: 'Email/Username dan Password wajib diisi.' }, 400);
    }

    let user;
    try {
      user = await authService.login(identifier, body.password);
    } catch (e: any) {
      return c.json({ error: 'Kredensial salah.' }, 401);
    }

    const session = await authService.createSession(user.id);

    // Generate access token (1h)
    const payload = {
      sub: user.id,
      exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
      role: user.role
    };
    const accessToken = await sign(payload, getJwtSecret(c));

    return c.json({ 
      access_token: accessToken,
      refresh_token: session.refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    }, 200);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

app.route('/api/v1', apiV1);

// Protected route example
app.get('/api/v1/me', authMiddleware, (c) => {
  const user = c.get('user');
  return c.json({ user });
});

export default app;
