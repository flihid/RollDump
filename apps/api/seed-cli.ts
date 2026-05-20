/**
 * Standalone seed runner. Reads DATABASE_URL from .dev.vars and
 * invokes the same seed function the API endpoint uses.
 *
 *   npx tsx apps/api/seed-cli.ts
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createDatabase } from '@rolldump/db';
import { seed } from './src/seed';

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
  if (!env.DATABASE_URL) throw new Error('DATABASE_URL missing in apps/api/.dev.vars');
  console.log('▶ Seeding…');
  const db = createDatabase(env.DATABASE_URL);
  const result = await seed(db);
  console.log('✓ Done:', result);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
