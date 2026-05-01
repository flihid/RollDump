import { createDatabase } from './index';
import { sql } from 'drizzle-orm';

async function migrate() {
  const dbUrl = 'postgresql://postgres.bmgqijrdlzuubcpmjewa:rollfilmaja2247@aws-1-ap-south-1.pooler.supabase.com:5432/postgres';
  const db = createDatabase(dbUrl);

  console.log('🚀 Migrating EPIC06 (Using Drizzle sql helper)...');

  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "user_lists" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "title" varchar(60) NOT NULL,
        "slug" varchar(255) NOT NULL UNIQUE,
        "description" text,
        "is_public" integer NOT NULL DEFAULT 1,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp
      );
    `);
    console.log('✅ Table user_lists ready');

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "list_items" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "list_id" uuid NOT NULL REFERENCES "user_lists"("id") ON DELETE CASCADE,
        "film_variant_id" uuid NOT NULL REFERENCES "film_variants"("id") ON DELETE CASCADE,
        "personal_note" text,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp
      );
    `);
    console.log('✅ Table list_items ready');

    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS "unique_list_variant" ON "list_items" ("list_id", "film_variant_id");
    `);
    console.log('✅ Index unique_list_variant ready');

    console.log('🎉 EPIC06 migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }

  process.exit(0);
}

migrate();
