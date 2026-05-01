import postgres from 'postgres';

async function migrate() {
  const sql = postgres('postgresql://postgres.bmgqijrdlzuubcpmjewa:rollfilmaja2247@aws-1-ap-south-1.pooler.supabase.com:5432/postgres', {
    ssl: 'require',
    max: 1,
  });

  console.log('🔄 Running EPIC04 migration...');

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS photos (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        film_variant_id UUID NOT NULL REFERENCES film_variants(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        caption TEXT,
        camera_used VARCHAR(100),
        lens_used VARCHAR(100),
        deleted_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    console.log('✅ Created photos table');

    console.log('🎉 EPIC04 migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }

  await sql.end();
  process.exit(0);
}

migrate();
