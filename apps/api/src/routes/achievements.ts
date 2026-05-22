import { and, eq, sql } from 'drizzle-orm';
import {
  achievements,
  userAchievements,
  users,
  photos,
  reviews,
  rolls,
  userLists,
  filmTips,
} from '@rolldump/db';
import { authMiddleware, createApp, optionalAuth } from '../lib/context';

const r = createApp();

/** Default catalog of achievements seeded into the table on first request. */
const CATALOG = [
  { key: 'first_roll',        name: 'First Roll',         description: 'Log your first roll album.', criteria: { type: 'rolls',    threshold: 1 },   points: 5,  icon: '🎞️' },
  { key: 'century_club',      name: 'Century Club',       description: 'Upload 100 photos.',          criteria: { type: 'photos',   threshold: 100 }, points: 25, icon: '📸' },
  { key: 'tastemaker',        name: 'Tastemaker',         description: 'Publish 50 reviews.',         criteria: { type: 'reviews',  threshold: 50 },  points: 30, icon: '⭐' },
  { key: 'hot_streak',        name: 'Hot Streak',         description: 'Shoot for 7 days straight.',  criteria: { type: 'streak',   threshold: 7 },   points: 20, icon: '🔥' },
  { key: 'colorist',          name: 'Colorist',           description: 'Shoot 10 color rolls.',       criteria: { type: 'rolls_color', threshold: 10 }, points: 15, icon: '🎨' },
  { key: 'monochrome_master', name: 'Monochrome Master',  description: 'Shoot 25 B&W rolls.',         criteria: { type: 'rolls_bw', threshold: 25 },  points: 25, icon: '⚫' },
  { key: 'large_format_legend', name: 'Large Format Legend', description: 'Shoot 5 large-format rolls.', criteria: { type: 'rolls_lf', threshold: 5 }, points: 40, icon: '🏔️' },
  { key: 'mentor',            name: 'Mentor',             description: 'Write 10 tips with positive net votes.', criteria: { type: 'tips_positive', threshold: 10 }, points: 30, icon: '🎓' },
  { key: 'curator',           name: 'Curator',            description: 'Create 5 public lists.',      criteria: { type: 'lists', threshold: 5 },     points: 20, icon: '📚' },
  { key: 'fotd_featured',     name: 'FOTD Featured',      description: 'Get featured as Film of the Day.', criteria: { type: 'fotd', threshold: 1 }, points: 50, icon: '🏆' },
  { key: 'wedding_pro',       name: 'Wedding Pro',        description: 'Log 3 wedding-tagged rolls.',  criteria: { type: 'rolls_wedding', threshold: 3 }, points: 35, icon: '💍' },
  { key: 'globetrotter',      name: 'Globetrotter',       description: 'Shoot in 5 different cities.', criteria: { type: 'locations', threshold: 5 }, points: 30, icon: '✈️' },
];

/** Ensure the achievement catalog rows exist in the DB; idempotent. */
async function ensureCatalog(db: any) {
  for (const a of CATALOG) {
    await db
      .insert(achievements)
      .values({
        key: a.key,
        name: a.name,
        description: a.description,
        criteria: a.criteria,
        points: a.points,
      })
      .onConflictDoNothing();
  }
}

/** Public list of all achievements + icon. */
r.get('/', optionalAuth, async (c) => {
  const db = c.get('db');
  await ensureCatalog(db);
  const rows = await db.select().from(achievements);
  return c.json({
    items: rows.map((row: any) => ({
      ...row,
      icon: CATALOG.find((x) => x.key === row.key)?.icon ?? '🏅',
    })),
  });
});

/**
 * Achievements unlocked by a specific user. Adds `unlocked: true` flag so the
 * frontend can render locked + unlocked side-by-side using the catalog.
 */
r.get('/users/:userId', optionalAuth, async (c) => {
  const db = c.get('db');
  await ensureCatalog(db);
  const userId = c.req.param('userId');
  const unlocked = await db
    .select({
      id: achievements.id,
      key: achievements.key,
      name: achievements.name,
      description: achievements.description,
      criteria: achievements.criteria,
      points: achievements.points,
      unlockedAt: userAchievements.unlockedAt,
    })
    .from(userAchievements)
    .innerJoin(achievements, eq(achievements.id, userAchievements.achievementId))
    .where(eq(userAchievements.userId, userId));
  return c.json({
    items: unlocked.map((a: any) => ({
      ...a,
      icon: CATALOG.find((x) => x.key === a.key)?.icon ?? '🏅',
    })),
  });
});

/**
 * Recalculate which achievements the current user has earned, then insert any
 * newly-earned ones. Returns `{ earned: [...] }` of badge keys awarded this run.
 */
r.post('/recompute', authMiddleware, async (c) => {
  const db = c.get('db');
  await ensureCatalog(db);
  const me = c.get('user')!.id;
  const catalog = await db.select().from(achievements);
  const already = await db
    .select({ achievementId: userAchievements.achievementId })
    .from(userAchievements)
    .where(eq(userAchievements.userId, me));
  const alreadySet = new Set(already.map((a: any) => a.achievementId));

  const [pc] = await db.select({ c: sql<number>`count(*)` }).from(photos).where(eq(photos.userId, me));
  const [rc] = await db.select({ c: sql<number>`count(*)` }).from(reviews).where(eq(reviews.userId, me));
  const [rolC] = await db.select({ c: sql<number>`count(*)` }).from(rolls).where(eq(rolls.userId, me));
  const [lc] = await db.select({ c: sql<number>`count(*)` }).from(userLists).where(eq(userLists.userId, me));
  const [tc] = await db
    .select({ c: sql<number>`count(*)` })
    .from(filmTips)
    .where(and(eq(filmTips.userId, me), sql`${filmTips.netScore} > 0`));

  const earned: string[] = [];
  for (const a of catalog) {
    if (alreadySet.has(a.id)) continue;
    const criteria: any = a.criteria || {};
    let progress = 0;
    switch (criteria.type) {
      case 'photos':  progress = Number(pc?.c || 0); break;
      case 'reviews': progress = Number(rc?.c || 0); break;
      case 'rolls':   progress = Number(rolC?.c || 0); break;
      case 'lists':   progress = Number(lc?.c || 0); break;
      case 'tips_positive': progress = Number(tc?.c || 0); break;
      default: continue; // criteria we can't auto-check yet (streak, fotd, etc.)
    }
    if (progress >= (criteria.threshold || 1)) {
      await db.insert(userAchievements).values({ userId: me, achievementId: a.id }).onConflictDoNothing();
      earned.push(a.key);
    }
  }
  return c.json({ earned });
});

/** Get current progress for one achievement key (used by detail modal). */
r.get('/progress/:key', authMiddleware, async (c) => {
  const db = c.get('db');
  await ensureCatalog(db);
  const me = c.get('user')!.id;
  const [a] = await db.select().from(achievements).where(eq(achievements.key, c.req.param('key')));
  if (!a) return c.json({ error: 'Achievement not found' }, 404);
  const criteria: any = a.criteria || {};
  let progress = 0;
  switch (criteria.type) {
    case 'photos': {
      const [r0] = await db.select({ c: sql<number>`count(*)` }).from(photos).where(eq(photos.userId, me));
      progress = Number(r0?.c || 0);
      break;
    }
    case 'reviews': {
      const [r0] = await db.select({ c: sql<number>`count(*)` }).from(reviews).where(eq(reviews.userId, me));
      progress = Number(r0?.c || 0);
      break;
    }
    case 'rolls': {
      const [r0] = await db.select({ c: sql<number>`count(*)` }).from(rolls).where(eq(rolls.userId, me));
      progress = Number(r0?.c || 0);
      break;
    }
    case 'lists': {
      const [r0] = await db.select({ c: sql<number>`count(*)` }).from(userLists).where(eq(userLists.userId, me));
      progress = Number(r0?.c || 0);
      break;
    }
    case 'tips_positive': {
      const [r0] = await db
        .select({ c: sql<number>`count(*)` })
        .from(filmTips)
        .where(and(eq(filmTips.userId, me), sql`${filmTips.netScore} > 0`));
      progress = Number(r0?.c || 0);
      break;
    }
  }
  return c.json({
    progress,
    threshold: criteria.threshold || 1,
    type: criteria.type,
    achievement: a,
  });
});

// Silence unused
void users;

export default r;
