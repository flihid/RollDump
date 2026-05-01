import postgres from 'postgres';

async function migrate() {
  const sql = postgres('postgresql://postgres.bmgqijrdlzuubcpmjewa:rollfilmaja2247@aws-1-ap-south-1.pooler.supabase.com:5432/postgres', {
    ssl: 'require',
    max: 1,
  });

  console.log('🔄 Running EPIC05 migration...');

  try {
    // Add datasheet_url to films
    await sql`ALTER TABLE films ADD COLUMN IF NOT EXISTS datasheet_url TEXT`;
    console.log('✅ Added datasheet_url to films');

    // Create film_tips table
    await sql`
      CREATE TABLE IF NOT EXISTS film_tips (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        film_id UUID NOT NULL REFERENCES films(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(100) NOT NULL,
        content TEXT NOT NULL,
        target_format VARCHAR(20) NOT NULL,
        net_score INTEGER DEFAULT 0 NOT NULL,
        is_hidden INTEGER DEFAULT 0 NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP
      )
    `;
    console.log('✅ Created film_tips table');

    // Create tip_votes table
    await sql`
      CREATE TABLE IF NOT EXISTS tip_votes (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        tip_id UUID NOT NULL REFERENCES film_tips(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        vote_type INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    console.log('✅ Created tip_votes table');

    // Add unique index for tip votes
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS unique_tip_user ON tip_votes(tip_id, user_id)`;
    console.log('✅ Created unique_tip_user index');

    // Create reports table
    await sql`
      CREATE TABLE IF NOT EXISTS reports (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        tip_id UUID NOT NULL REFERENCES film_tips(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reason VARCHAR(50) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'pending' NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    console.log('✅ Created reports table');

    console.log('🎉 EPIC05 migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }

  await sql.end();
  process.exit(0);
}

migrate();
