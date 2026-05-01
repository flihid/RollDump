import { ilike, or } from 'drizzle-orm';
import { films, users, userLists, brands, cameras } from '@rolldump/db';
import { createApp } from '../lib/context';

const r = createApp();

r.get('/autocomplete', async (c) => {
  const q = (c.req.query('q') || '').trim();
  if (!q) return c.json({ films: [], users: [], lists: [], brands: [] });
  const db = c.get('db');
  const [filmsR, usersR, listsR, brandsR, camerasR] = await Promise.all([
    db
      .select()
      .from(films)
      .where(ilike(films.name, `%${q}%`))
      .limit(5),
    db
      .select({ id: users.id, username: users.username, avatarUrl: users.avatarUrl, fullName: users.fullName })
      .from(users)
      .where(or(ilike(users.username, `%${q}%`), ilike(users.fullName, `%${q}%`)))
      .limit(5),
    db
      .select()
      .from(userLists)
      .where(ilike(userLists.title, `%${q}%`))
      .limit(5),
    db.select().from(brands).where(ilike(brands.name, `%${q}%`)).limit(5),
    db
      .select()
      .from(cameras)
      .where(or(ilike(cameras.brand, `%${q}%`), ilike(cameras.model, `%${q}%`)))
      .limit(5),
  ]);
  return c.json({ films: filmsR, users: usersR, lists: listsR, brands: brandsR, cameras: camerasR });
});

export default r;
