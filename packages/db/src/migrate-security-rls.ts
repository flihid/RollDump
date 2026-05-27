/**
 * Security hardening migration — addresses Supabase advisor warnings:
 *   - rls_disabled_in_public  (RLS not enabled on public tables)
 *   - sensitive_columns_exposed (password/token columns reachable via Data API)
 *
 * What this does
 * --------------
 * 1. REVOKES all privileges from the PostgREST roles (`anon`, `authenticated`)
 *    on every existing public table — RollDump talks to Postgres directly
 *    through the Hono API using the `postgres` user, so we never want the
 *    Data API to read these tables.
 * 2. Sets ALTER DEFAULT PRIVILEGES so the same revoke applies automatically
 *    to any table we create in the future.
 * 3. Enables Row-Level Security on every public table (deny-by-default for
 *    any non-superuser role).
 * 4. For tables that hold secrets (password hashes, refresh tokens, password
 *    reset / email verification token hashes), also adds an explicit
 *    RESTRICTIVE "deny all" policy as belt-and-suspenders.
 *
 * Our API server connects as the `postgres` user (superuser → BYPASSRLS), so
 * none of this affects normal traffic. Only PostgREST clients are blocked.
 *
 * Run with:  pnpm -F @rolldump/db tsx src/migrate-security-rls.ts
 */
import { createDatabase } from './index';
import { sql } from 'drizzle-orm';

async function migrate() {
  const dbUrl =
    process.env.DATABASE_URL ||
    'postgresql://postgres.bmgqijrdlzuubcpmjewa:rollfilmaja2247@aws-1-ap-south-1.pooler.supabase.com:5432/postgres';
  const db = createDatabase(dbUrl);

  console.log('🔒 Hardening public schema…');

  // ───────────────────────────────────────────────────────────────
  // 1) Revoke PostgREST roles from all current + future public tables.
  //    `anon` = un-authenticated Data API key, `authenticated` = signed-in
  //    JWT. We use neither.
  // ───────────────────────────────────────────────────────────────
  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM anon;
        REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
        REVOKE ALL ON ALL ROUTINES  IN SCHEMA public FROM anon;
        REVOKE USAGE ON SCHEMA public FROM anon;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;
      END IF;
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM authenticated;
        REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated;
        REVOKE ALL ON ALL ROUTINES  IN SCHEMA public FROM authenticated;
        REVOKE USAGE ON SCHEMA public FROM authenticated;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM authenticated;
      END IF;
    END $$;
  `);
  console.log('✅ Revoked anon / authenticated from public schema');

  // ───────────────────────────────────────────────────────────────
  // 2) Enable RLS on every public table.
  //    No FORCE — that would block the table owner too, and we want the
  //    `postgres` user (which our API uses) to keep working unchanged.
  //    Without FORCE, only non-superuser roles need a policy to read.
  //    Superusers (postgres) always bypass RLS.
  // ───────────────────────────────────────────────────────────────
  await db.execute(sql`
    DO $$
    DECLARE r RECORD;
    BEGIN
      FOR r IN
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
      LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.tablename);
      END LOOP;
    END $$;
  `);
  console.log('✅ RLS enabled on every public table');

  // ───────────────────────────────────────────────────────────────
  // 3) Explicit deny-all policy on the most sensitive tables. With RLS
  //    enabled + zero policies, non-superuser roles can already see no
  //    rows — but adding a named RESTRICTIVE policy makes the intent
  //    visible in the Supabase advisor + any audit log.
  // ───────────────────────────────────────────────────────────────
  await db.execute(sql`
    DO $$
    DECLARE
      t TEXT;
      sensitive TEXT[] := ARRAY[
        'users',
        'user_sessions',
        'email_verifications',
        'password_resets'
      ];
    BEGIN
      FOREACH t IN ARRAY sensitive LOOP
        IF EXISTS (
          SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename=t
        ) THEN
          EXECUTE format('DROP POLICY IF EXISTS "deny_all_data_api" ON public.%I;', t);
          EXECUTE format(
            'CREATE POLICY "deny_all_data_api" ON public.%I AS RESTRICTIVE FOR ALL TO public USING (false) WITH CHECK (false);',
            t
          );
        END IF;
      END LOOP;
    END $$;
  `);
  console.log('✅ Deny-all policy applied to sensitive tables');

  console.log('\n🎉 Security hardening complete.');
  console.log('   • Supabase Data API (PostgREST) can no longer reach public tables.');
  console.log('   • RLS is enabled on every public table.');
  console.log('   • Sensitive tables (users, user_sessions, email_verifications,');
  console.log('     password_resets) have an explicit deny-all RESTRICTIVE policy.');
  console.log('   • RollDump API keeps working — it connects as `postgres` (BYPASSRLS).');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('💥 Migration failed:', err);
  process.exit(1);
});
