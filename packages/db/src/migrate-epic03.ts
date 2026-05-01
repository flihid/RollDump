import postgres from 'postgres';

async function migrate() {
  const sql = postgres('postgresql://postgres.bmgqijrdlzuubcpmjewa:rollfilmaja2247@aws-1-ap-south-1.pooler.supabase.com:5432/postgres', {
    ssl: 'require',
    max: 1,
  });

  console.log('🔄 Running EPIC03 migration...');

  try {
    // Add new columns to reviews table
    await sql`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS film_variant_id UUID REFERENCES film_variants(id) ON DELETE SET NULL`;
    console.log('✅ Added film_variant_id to reviews');

    await sql`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS content TEXT`;
    console.log('✅ Added content column to reviews');

    // Migrate data from comment to content if comment exists
    try {
      await sql`UPDATE reviews SET content = comment WHERE content IS NULL AND comment IS NOT NULL`;
      console.log('✅ Migrated comment -> content data');
    } catch { /* comment column might not exist */ }

    await sql`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS camera_used VARCHAR(100)`;
    console.log('✅ Added camera_used to reviews');

    await sql`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP`;
    console.log('✅ Added edited_at to reviews');

    await sql`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP`;
    console.log('✅ Added deleted_at to reviews');

    // Add avg_rating to films
    await sql`ALTER TABLE films ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(3,2)`;
    console.log('✅ Added avg_rating to films');

    // Create review_upvotes table
    await sql`
      CREATE TABLE IF NOT EXISTS review_upvotes (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    console.log('✅ Created review_upvotes table');

    // Create unique index
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS unique_review_user ON review_upvotes(review_id, user_id)`;
    console.log('✅ Created unique_review_user index');

    // Drop old comment column if it exists (cleanup)
    try {
      await sql`ALTER TABLE reviews DROP COLUMN IF EXISTS comment`;
      console.log('✅ Dropped old comment column');
    } catch { /* ignore */ }

    console.log('🎉 EPIC03 migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }

  await sql.end();
  process.exit(0);
}

migrate();
