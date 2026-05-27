/**
 * Smoke test: confirm the API connection (postgres superuser) can still
 * read every table after security hardening. If this fails, RLS broke
 * production traffic.
 */
import { createDatabase } from './index';
import { sql } from 'drizzle-orm';

async function smoke() {
  const dbUrl =
    process.env.DATABASE_URL ||
    'postgresql://postgres.bmgqijrdlzuubcpmjewa:rollfilmaja2247@aws-1-ap-south-1.pooler.supabase.com:5432/postgres';
  const db = createDatabase(dbUrl);

  const counts: any = await db.execute(sql`
    SELECT
      (SELECT COUNT(*) FROM users)               AS users,
      (SELECT COUNT(*) FROM user_sessions)       AS sessions,
      (SELECT COUNT(*) FROM films)               AS films,
      (SELECT COUNT(*) FROM photos)              AS photos,
      (SELECT COUNT(*) FROM reviews)             AS reviews,
      (SELECT COUNT(*) FROM password_resets)     AS resets,
      (SELECT COUNT(*) FROM email_verifications) AS verifications;
  `);
  console.log('✅ Counts reachable as postgres superuser:', counts[0]);
  process.exit(0);
}

smoke().catch((e) => {
  console.error('💥 App connection BROKE — RLS migration is too strict:', e.message);
  process.exit(1);
});
