import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * Cached postgres-js client + drizzle wrapper, keyed by connection URL.
 * The API server calls createDatabase() on every request; without this
 * cache each call would open a fresh TCP+TLS+auth handshake to Supabase
 * (~200-400ms of overhead from Indonesia → Singapore). With the cache,
 * the second + every subsequent call returns the same pooled instance
 * and queries hit the network immediately.
 *
 * Safe in long-running Node servers. For one-shot CLI scripts (migrate-*,
 * verify-*, smoke-test-*) it doesn't matter — the script exits before
 * the connection becomes stale.
 */
const cache = new Map<string, ReturnType<typeof drizzle>>();

export function createDatabase(databaseUrl: string) {
  const hit = cache.get(databaseUrl);
  if (hit) return hit;

  const client = postgres(databaseUrl, {
    ssl: 'require',
    // Pool a few connections so paralel queries in the same request
    // (Home loads 6+ endpoints simultaneously) don't queue behind each other.
    max: 10,
    // Prepared statements are cached on the server side — same query shape
    // doesn't re-parse/re-plan. Big win for hot paths like /feed, /users/me.
    prepare: true,
    connect_timeout: 20,
    // Keep connections warm longer so subsequent requests skip the handshake.
    idle_timeout: 60,
    max_lifetime: 60 * 30, // recycle after 30 min so we don't keep stale conns forever
  });

  const db = drizzle(client, { schema });
  cache.set(databaseUrl, db);
  return db;
}

export * from './schema';
