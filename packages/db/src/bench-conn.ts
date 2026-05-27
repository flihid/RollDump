/**
 * Quick benchmark: shows the singleton + tuned config win.
 * Runs 10 sequential `SELECT 1` queries through createDatabase().
 * With caching: only the FIRST query pays the handshake cost.
 * Without caching: every query would re-handshake.
 */
import { createDatabase } from './index';
import { sql } from 'drizzle-orm';

async function bench() {
  const dbUrl =
    process.env.DATABASE_URL ||
    'postgresql://postgres.bmgqijrdlzuubcpmjewa:rollfilmaja2247@aws-1-ap-south-1.pooler.supabase.com:5432/postgres';

  // Each createDatabase() call returns the SAME pooled instance now.
  const db = createDatabase(dbUrl);

  console.log('Running 10 sequential SELECT 1 …\n');
  const times: number[] = [];
  for (let i = 0; i < 10; i++) {
    const t0 = Date.now();
    await db.execute(sql`SELECT 1`);
    const dt = Date.now() - t0;
    times.push(dt);
    console.log(`  query ${i + 1}: ${dt}ms`);
  }

  console.log(`\nFirst query  : ${times[0]}ms  (pays connection handshake)`);
  console.log(
    `Subsequent   : avg ${Math.round(times.slice(1).reduce((a, b) => a + b) / 9)}ms (pooled, warm)`,
  );
  console.log(`Total        : ${times.reduce((a, b) => a + b)}ms`);
  process.exit(0);
}

bench().catch((e) => {
  console.error(e);
  process.exit(1);
});
