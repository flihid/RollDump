/**
 * Create a demo admin account so you can log into the moderation queue.
 *   pnpm dlx tsx apps/api/promote-admin-cli.ts
 *
 * Idempotent — re-running just resets the password + ensures admin role.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { eq } from 'drizzle-orm';
import { AuthService } from '@rolldump/auth';
import { createDatabase, users } from '@rolldump/db';

const ADMIN_EMAIL = 'admin@rolldump.id';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'AdminRollDump2026!';

function loadDevVars(): Record<string, string> {
  const text = readFileSync(resolve(import.meta.dirname, '.dev.vars'), 'utf8');
  const env: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[m[1]] = v;
  }
  return env;
}

async function main() {
  const env = loadDevVars();
  if (!env.DATABASE_URL) throw new Error('DATABASE_URL missing in .dev.vars');

  const db = createDatabase(env.DATABASE_URL);
  const authService = new AuthService(env.DATABASE_URL);

  // If already exists (by email OR username), just reset password + ensure admin role
  const [byEmail] = await db.select().from(users).where(eq(users.email, ADMIN_EMAIL));
  const [byUsername] = await db.select().from(users).where(eq(users.username, ADMIN_USERNAME));
  const existing = byEmail || byUsername;
  if (existing) {
    console.log('▶ Admin already exists, resetting password + ensuring role…');
    await authService.updatePassword(existing.id, ADMIN_PASSWORD);
    await db
      .update(users)
      .set({ role: 'admin', status: 'active', emailVerifiedAt: new Date() })
      .where(eq(users.id, existing.id));
    console.log('✓ Admin updated:');
  } else {
    console.log('▶ Creating new admin account…');
    const user = await authService.register({
      email: ADMIN_EMAIL,
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD,
      fullName: 'RollDump Admin',
      role: 'admin',
      status: 'active',
    });
    await db
      .update(users)
      .set({ emailVerifiedAt: new Date() })
      .where(eq(users.id, user.id));
    console.log('✓ Admin created:');
  }
  console.log('  Email:    ', ADMIN_EMAIL);
  console.log('  Username: ', ADMIN_USERNAME);
  console.log('  Password: ', ADMIN_PASSWORD);
  console.log('  Login URL:', '/login');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
