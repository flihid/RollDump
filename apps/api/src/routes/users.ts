import { and, desc, eq, sql } from 'drizzle-orm';
import {
  users,
  follows,
  userBlocks,
  userPreferences,
  privacySettings,
  notificationPreferences,
  reviews,
  photos,
  userLists,
} from '@rolldump/db';
import { authMiddleware, createApp, optionalAuth } from '../lib/context';

const r = createApp();

r.get('/me', authMiddleware, async (c) => {
  const db = c.get('db');
  const [u] = await db.select().from(users).where(eq(users.id, c.get('user')!.id));
  if (!u) return c.json({ error: 'User tidak ditemukan' }, 404);
  const { password, ...safe } = u as any;
  return c.json({ user: safe });
});

r.put('/me/profile', authMiddleware, async (c) => {
  const body = await c.req.json();
  const allowed = [
    'fullName',
    'bio',
    'avatarUrl',
    'bannerUrl',
    'location',
    'websiteUrl',
    'instagramHandle',
  ];
  const upd: any = {};
  for (const k of allowed) if (k in body) upd[k] = body[k];
  upd.updatedAt = new Date();
  await c.get('db').update(users).set(upd).where(eq(users.id, c.get('user')!.id));
  return c.json({ ok: true });
});

r.get('/me/preferences', authMiddleware, async (c) => {
  const [p] = await c
    .get('db')
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, c.get('user')!.id));
  return c.json({ preferences: p || {} });
});

r.put('/me/preferences', authMiddleware, async (c) => {
  const body = await c.req.json();
  const userId = c.get('user')!.id;
  await c
    .get('db')
    .insert(userPreferences)
    .values({ userId, ...body, updatedAt: new Date() })
    .onConflictDoUpdate({ target: userPreferences.userId, set: { ...body, updatedAt: new Date() } });
  return c.json({ ok: true });
});

r.get('/me/privacy', authMiddleware, async (c) => {
  const [p] = await c
    .get('db')
    .select()
    .from(privacySettings)
    .where(eq(privacySettings.userId, c.get('user')!.id));
  return c.json({ privacy: p || {} });
});

r.put('/me/privacy', authMiddleware, async (c) => {
  const body = await c.req.json();
  const userId = c.get('user')!.id;
  await c
    .get('db')
    .insert(privacySettings)
    .values({ userId, ...body })
    .onConflictDoUpdate({ target: privacySettings.userId, set: body });
  return c.json({ ok: true });
});

r.get('/me/notification-preferences', authMiddleware, async (c) => {
  const [p] = await c
    .get('db')
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, c.get('user')!.id));
  return c.json({ preferences: p || {} });
});

r.put('/me/notification-preferences', authMiddleware, async (c) => {
  const body = await c.req.json();
  const userId = c.get('user')!.id;
  await c
    .get('db')
    .insert(notificationPreferences)
    .values({ userId, ...body })
    .onConflictDoUpdate({ target: notificationPreferences.userId, set: body });
  return c.json({ ok: true });
});

r.put('/me/password', authMiddleware, async (c) => {
  const { current_password, new_password } = await c.req.json();
  const authService = c.get('authService');
  const [u] = await c.get('db').select().from(users).where(eq(users.id, c.get('user')!.id));
  if (!u) return c.json({ error: 'User tidak ditemukan' }, 404);
  try {
    await authService.login(u.email, current_password);
  } catch {
    return c.json({ error: 'Password lama salah' }, 401);
  }
  await authService.updatePassword(u.id, new_password);
  return c.json({ ok: true });
});

r.delete('/me', authMiddleware, async (c) => {
  const userId = c.get('user')!.id;
  await c
    .get('db')
    .update(users)
    .set({
      status: 'deleted',
      deletedAt: new Date(),
      email: `deleted-${userId}@rolldump.local`,
      fullName: 'Pengguna Dihapus',
      avatarUrl: null,
    })
    .where(eq(users.id, userId));
  await c.get('authService').revokeAllSessions(userId);
  return c.json({ ok: true });
});

// Public profile
r.get('/by-username/:username', optionalAuth, async (c) => {
  const db = c.get('db');
  const [u] = await db.select().from(users).where(eq(users.username, c.req.param('username')));
  if (!u) return c.json({ error: 'User tidak ditemukan' }, 404);
  const { password, totpSecret, email, lastLoginIp, ...safe } = u as any;
  const photoCount = await db
    .select({ c: sql<number>`count(*)` })
    .from(photos)
    .where(eq(photos.userId, u.id));
  const reviewCount = await db
    .select({ c: sql<number>`count(*)` })
    .from(reviews)
    .where(eq(reviews.userId, u.id));
  const listCount = await db
    .select({ c: sql<number>`count(*)` })
    .from(userLists)
    .where(eq(userLists.userId, u.id));
  return c.json({
    user: {
      ...safe,
      stats: {
        photoCount: Number(photoCount[0]?.c || 0),
        reviewCount: Number(reviewCount[0]?.c || 0),
        listCount: Number(listCount[0]?.c || 0),
        followersCount: u.followersCount,
        followingCount: u.followingCount,
      },
    },
  });
});

r.post('/by-username/:username/follow', authMiddleware, async (c) => {
  const db = c.get('db');
  const me = c.get('user')!.id;
  const [target] = await db.select().from(users).where(eq(users.username, c.req.param('username')));
  if (!target) return c.json({ error: 'User tidak ditemukan' }, 404);
  if (target.id === me) return c.json({ error: 'Tidak bisa follow diri sendiri' }, 400);
  const existing = await db
    .select()
    .from(follows)
    .where(and(eq(follows.followerId, me), eq(follows.followingId, target.id)));
  if (existing.length) {
    await db
      .delete(follows)
      .where(and(eq(follows.followerId, me), eq(follows.followingId, target.id)));
    await db
      .update(users)
      .set({ followersCount: sql`${users.followersCount} - 1` })
      .where(eq(users.id, target.id));
    await db
      .update(users)
      .set({ followingCount: sql`${users.followingCount} - 1` })
      .where(eq(users.id, me));
    return c.json({ following: false });
  } else {
    await db.insert(follows).values({ followerId: me, followingId: target.id });
    await db
      .update(users)
      .set({ followersCount: sql`${users.followersCount} + 1` })
      .where(eq(users.id, target.id));
    await db
      .update(users)
      .set({ followingCount: sql`${users.followingCount} + 1` })
      .where(eq(users.id, me));
    return c.json({ following: true });
  }
});

r.post('/by-username/:username/block', authMiddleware, async (c) => {
  const db = c.get('db');
  const me = c.get('user')!.id;
  const [target] = await db.select().from(users).where(eq(users.username, c.req.param('username')));
  if (!target) return c.json({ error: 'User tidak ditemukan' }, 404);
  if (target.id === me) return c.json({ error: 'Tidak bisa blokir diri sendiri' }, 400);
  const existing = await db
    .select()
    .from(userBlocks)
    .where(and(eq(userBlocks.blockerId, me), eq(userBlocks.blockedId, target.id)));
  if (existing.length) {
    await db
      .delete(userBlocks)
      .where(and(eq(userBlocks.blockerId, me), eq(userBlocks.blockedId, target.id)));
    return c.json({ blocked: false });
  } else {
    await db.insert(userBlocks).values({ blockerId: me, blockedId: target.id });
    // also drop follow relations
    await db
      .delete(follows)
      .where(and(eq(follows.followerId, me), eq(follows.followingId, target.id)));
    await db
      .delete(follows)
      .where(and(eq(follows.followerId, target.id), eq(follows.followingId, me)));
    return c.json({ blocked: true });
  }
});

r.get('/me/blocked', authMiddleware, async (c) => {
  const db = c.get('db');
  const list = await db
    .select({
      id: users.id,
      username: users.username,
      avatarUrl: users.avatarUrl,
      fullName: users.fullName,
    })
    .from(userBlocks)
    .innerJoin(users, eq(users.id, userBlocks.blockedId))
    .where(eq(userBlocks.blockerId, c.get('user')!.id));
  return c.json({ items: list });
});

r.get('/suggested', optionalAuth, async (c) => {
  const db = c.get('db');
  const me = c.get('user')?.id;
  const list = await db
    .select({
      id: users.id,
      username: users.username,
      avatarUrl: users.avatarUrl,
      fullName: users.fullName,
      bio: users.bio,
      followersCount: users.followersCount,
    })
    .from(users)
    .where(eq(users.status, 'active'))
    .orderBy(desc(users.followersCount))
    .limit(8);
  return c.json({ items: list.filter((u) => u.id !== me) });
});

export default r;
