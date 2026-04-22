import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { AuthService } from '@propen/auth';

type Bindings = {
  DATABASE_URL: string;
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

// Auth Middleware
export const authMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.split(' ')[1];
  const authService = c.get('authService');
  
  const result = await authService.validateToken(token);
  if (!result) {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }

  c.set('user', result.user);
  c.set('session', result.session);
  await next();
};

const authApp = new Hono<{ Bindings: Bindings; Variables: Variables }>();

authApp.post('/register', async (c) => {
  try {
    const body = await c.req.json();
    const authService = c.get('authService');
    
    const user = await authService.register({
      email: body.email,
      password: body.password,
      fullName: body.fullName,
      role: body.role || 'user',
    });

    const session = await authService.createSession(user.id);

    return c.json({ user, token: session.token });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

authApp.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const authService = c.get('authService');
    
    const user = await authService.login(body.email, body.password);
    const session = await authService.createSession(user.id);

    return c.json({ user, token: session.token });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

app.route('/auth', authApp);

// Protected route example
app.get('/me', authMiddleware, (c) => {
  const user = c.get('user');
  return c.json({ user });
});

export default app;
