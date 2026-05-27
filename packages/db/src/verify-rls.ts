/**
 * Quick read-only check that the security-rls migration took effect.
 * Run after `migrate-security-rls.ts`.
 */
import { createDatabase } from './index';
import { sql } from 'drizzle-orm';

async function check() {
  const dbUrl =
    process.env.DATABASE_URL ||
    'postgresql://postgres.bmgqijrdlzuubcpmjewa:rollfilmaja2247@aws-1-ap-south-1.pooler.supabase.com:5432/postgres';
  const db = createDatabase(dbUrl);

  // 1) How many public tables have RLS enabled?
  const rlsRows: any = await db.execute(sql`
    SELECT COUNT(*) FILTER (WHERE rowsecurity)  AS enabled,
           COUNT(*) FILTER (WHERE NOT rowsecurity) AS disabled,
           COUNT(*) AS total
    FROM pg_tables
    WHERE schemaname = 'public';
  `);
  console.log('RLS status (public schema):', rlsRows[0]);

  // 2) Any tables still WITHOUT RLS?
  const stillOpen: any = await db.execute(sql`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND rowsecurity = false
    ORDER BY tablename;
  `);
  if (stillOpen.length) {
    console.warn('⚠️  Tables still without RLS:', stillOpen.map((r: any) => r.tablename));
  } else {
    console.log('✅ All public tables have RLS enabled');
  }

  // 3) Sensitive table policies
  const pols: any = await db.execute(sql`
    SELECT tablename, policyname, permissive, cmd
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('users', 'user_sessions', 'email_verifications', 'password_resets')
    ORDER BY tablename;
  `);
  console.log('Sensitive-table policies:', pols);

  // 4) anon / authenticated grants left on any public table?
  const grants: any = await db.execute(sql`
    SELECT grantee, table_name, privilege_type
    FROM information_schema.role_table_grants
    WHERE table_schema = 'public'
      AND grantee IN ('anon', 'authenticated')
    LIMIT 20;
  `);
  if (grants.length) {
    console.warn('⚠️  Lingering Data API grants:', grants);
  } else {
    console.log('✅ anon / authenticated have NO grants on public tables');
  }

  process.exit(0);
}

check().catch((e) => {
  console.error(e);
  process.exit(1);
});
