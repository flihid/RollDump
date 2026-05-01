import { createDatabase } from './index';

async function test() {
  const dbUrl = 'postgresql://postgres.bmgqijrdlzuubcpmjewa:rollfilmaja2247@aws-1-ap-south-1.pooler.supabase.com:5432/postgres';
  const db = createDatabase(dbUrl);

  try {
    const res = await db.execute('SELECT 1');
    console.log('✅ Connection OK:', res);
  } catch (err) {
    console.error('❌ Connection Failed:', err);
  }
  process.exit(0);
}

test();
