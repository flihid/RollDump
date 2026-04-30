import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export function createDatabase(databaseUrl: string) {
  const client = postgres(databaseUrl, {
    ssl: 'require',
    max: 1,
    prepare: false, 
    connect_timeout: 20, // Lebih sabar (20 detik)
    idle_timeout: 20,
  });
  
  return drizzle(client, { schema });
}

export * from './schema';
