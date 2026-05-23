import { and, desc, eq, sql } from 'drizzle-orm';
import {
  users,
  follows,
  userBlocks,
  userPreferences,
  privacySettings,
  notificationPreferences,
  notifications,
  reviews,
  photos,
  rolls,
  userLists,
  userAchievements,
} from '@rolldump/db';
import { authMiddleware, createApp, getHiddenUserIds, optionalAuth } from '../lib/context';
import { notInArray } from 'drizzle-orm';

/** Aggregate basic user stats used by /me + public profile. */
async function computeUserStats(db: any, userId: string) {
  const [photoC] = await db.select({ c: sql<number>`count(*)` }).from(photos).where(eq(photos.userId, userId));
  const [reviewC] = await db.select({ c: sql<number>`count(*)` }).from(reviews).where(eq(reviews.userId, userId));
  const [listC] = await db.select({ c: sql<number>`count(*)` }).from(userLists).where(eq(userLists.userId, userId));
  const [rollC] = await db.select({ c: sql<number>`count(*)` }).from(rolls).where(eq(rolls.userId, userId));
  const [achievementC] = await db.select({ c: sql<number>`count(*)` }).from(userAchievements).where(eq(userAchievements.userId, userId));
  const [avgRating] = await db
    .select({ avg: sql<number>`coalesce(avg(${reviews.ratingOverall}), 0)` })
    .from(reviews)
    .where(eq(reviews.userId, userId));
  return {
    photoCount: Number(photoC?.c || 0),
    reviewCount: Number(reviewC?.c || 0),
    listCount: Number(listC?.c || 0),
    rollCount: Number(rollC?.c || 0),
    achievementCount: Number(achievementC?.c || 0),
    avgRating: Number(avgRating?.avg || 0),
    streak: Math.min(30, Number(rollC?.c || 0)), // simple proxy until streak tracking exists
  };
}

const r = createApp();

r.get('/me', authMiddleware, async (c) => {
  const db = c.get('db');
  const [u] = await db.select().from(users).where(eq(users.id, c.get('user')!.id));
  if (!u) return c.json({ error: 'User not found' }, 404);
  const { password, ...safe } = u as any;
  const stats = await computeUserStats(db, u.id);
  return c.json({
    user: {
      ...safe,
      stats: {
        ...stats,
        followersCount: u.followersCount ?? 0,
        followingCount: u.followingCount ?? 0,
      },
    },
  });
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
  if (!u) return c.json({ error: 'User not found' }, 404);
  const { password, totpSecret, email, lastLoginIp, ...safe } = u as any;
  const stats = await computeUserStats(db, u.id);

  // Compute relationship flags for the viewer
  const me = c.get('user')?.id;
  let isBlocked = false;
  let isBlockedBy = false;
  let isFollowing = false;
  if (me && me !== u.id) {
    const b1 = await db
      .select()
      .from(userBlocks)
      .where(and(eq(userBlocks.blockerId, me), eq(userBlocks.blockedId, u.id)));
    isBlocked = b1.length > 0;
    const b2 = await db
      .select()
      .from(userBlocks)
      .where(and(eq(userBlocks.blockerId, u.id), eq(userBlocks.blockedId, me)));
    isBlockedBy = b2.length > 0;
    const f = await db
      .select()
      .from(follows)
      .where(and(eq(follows.followerId, me), eq(follows.followingId, u.id)));
    isFollowing = f.length > 0;
  }

  return c.json({
    user: {
      ...safe,
      stats: {
        ...stats,
        followersCount: u.followersCount ?? 0,
        followingCount: u.followingCount ?? 0,
      },
      isBlocked,
      isBlockedBy,
      isFollowing,
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
    // Notify the target that they have a new follower
    try {
      const [meUser] = await db.select({ username: users.username }).from(users).where(eq(users.id, me));
      await db.insert(notifications).values({
        recipientId: target.id,
        actorId: me,
        type: 'follow',
        notifiableType: 'user',
        notifiableId: me,
        payload: { message: `@${meUser?.username} started following you` },
        isRead: false,
      });
    } catch {}
    return c.json({ following: true });
  }
});

r.post('/by-username/:username/block', authMiddleware, async (c) => {
  const db = c.get('db');
  const me = c.get('user')!.id;
  const [target] = await db.select().from(users).where(eq(users.username, c.req.param('username')));
  if (!target) return c.json({ error: 'User not found' }, 404);
  if (target.id === me) return c.json({ error: "Can't block yourself" }, 400);

  const existing = await db
    .select()
    .from(userBlocks)
    .where(and(eq(userBlocks.blockerId, me), eq(userBlocks.blockedId, target.id)));

  if (existing.length) {
    // Unblock
    await db
      .delete(userBlocks)
      .where(and(eq(userBlocks.blockerId, me), eq(userBlocks.blockedId, target.id)));
    return c.json({ blocked: false });
  } else {
    await db.insert(userBlocks).values({ blockerId: me, blockedId: target.id });

    // If "me" was following "target", drop that follow AND decrement target's followers
    const meFollowingTarget = await db
      .select()
      .from(follows)
      .where(and(eq(follows.followerId, me), eq(follows.followingId, target.id)));
    if (meFollowingTarget.length) {
      await db
        .delete(follows)
        .where(and(eq(follows.followerId, me), eq(follows.followingId, target.id)));
      await db
        .update(users)
        .set({ followersCount: sql`greatest(${users.followersCount} - 1, 0)` })
        .where(eq(users.id, target.id));
      await db
        .update(users)
        .set({ followingCount: sql`greatest(${users.followingCount} - 1, 0)` })
        .where(eq(users.id, me));
    }
    // If "target" was following "me", drop that follow AND decrement my followers
    const targetFollowingMe = await db
      .select()
      .from(follows)
      .where(and(eq(follows.followerId, target.id), eq(follows.followingId, me)));
    if (targetFollowingMe.length) {
      await db
        .delete(follows)
        .where(and(eq(follows.followerId, target.id), eq(follows.followingId, me)));
      await db
        .update(users)
        .set({ followersCount: sql`greatest(${users.followersCount} - 1, 0)` })
        .where(eq(users.id, me));
      await db
        .update(users)
        .set({ followingCount: sql`greatest(${users.followingCount} - 1, 0)` })
        .where(eq(users.id, target.id));
    }
    return c.json({ blocked: true });
  }
});

// Followers + following lists (own profile uses /me/* shortcuts)
r.get('/by-username/:username/followers', optionalAuth, async (c) => {
  const db = c.get('db');
  const [u] = await db.select().from(users).where(eq(users.username, c.req.param('username')));
  if (!u) return c.json({ error: 'User not found' }, 404);
  const list = await db
    .select({
      id: users.id,
      username: users.username,
      avatarUrl: users.avatarUrl,
      fullName: users.fullName,
      bio: users.bio,
    })
    .from(follows)
    .innerJoin(users, eq(users.id, follows.followerId))
    .where(eq(follows.followingId, u.id));
  return c.json({ items: list });
});

r.get('/by-username/:username/following', optionalAuth, async (c) => {
  const db = c.get('db');
  const [u] = await db.select().from(users).where(eq(users.username, c.req.param('username')));
  if (!u) return c.json({ error: 'User not found' }, 404);
  const list = await db
    .select({
      id: users.id,
      username: users.username,
      avatarUrl: users.avatarUrl,
      fullName: users.fullName,
      bio: users.bio,
    })
    .from(follows)
    .innerJoin(users, eq(users.id, follows.followingId))
    .where(eq(follows.followerId, u.id));
  return c.json({ items: list });
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
  const hidden = await getHiddenUserIds(c);
  const conds: any[] = [eq(users.status, 'active')];
  if (hidden.length) conds.push(notInArray(users.id, hidden));
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
    .where(and(...conds))
    .orderBy(desc(users.followersCount))
    .limit(8);
  return c.json({ items: list.filter((u) => u.id !== me) });
});

export default r;
