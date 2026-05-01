import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { AuthService } from '@rolldump/auth';
import { createDatabase } from '@rolldump/db';
import { AppEnv, optionalAuth } from './lib/context';
import auth from './routes/auth';
import users from './routes/users';
import films from './routes/films';
import brands from './routes/brands';
import reviews from './routes/reviews';
import photos from './routes/photos';
import tips from './routes/tips';
import lists from './routes/lists';
import social from './routes/social';
import equipment from './routes/equipment';
import search from './routes/search';
import admin from './routes/admin';
import { seed } from './seed';

const app = new Hono<AppEnv>();

app.use('*', cors());

app.use('*', async (c, next) => {
  const authService = new AuthService(c.env.DATABASE_URL);
  c.set('authService', authService);
  c.set('db', authService.db);
  await next();
});

app.use('*', optionalAuth);

app.get('/', (c) => c.json({ name: 'RollDump API', version: '1.0.0' }));

const v1 = new Hono<AppEnv>();
v1.route('/auth', auth);
v1.route('/users', users);
v1.route('/films', films);
v1.route('/brands', brands);
v1.route('/reviews', reviews);
v1.route('/photos', photos);
v1.route('/tips', tips);
v1.route('/lists', lists);
v1.route('/equipment', equipment);
v1.route('/search', search);
v1.route('/admin', admin);
v1.route('/', social); // /likes /comments /reports /feed /notifications

app.route('/api/v1', v1);

app.post('/api/v1/seed', async (c) => {
  const result = await seed(c.get('db'));
  return c.json({ ok: true, ...result });
});

export default app;
