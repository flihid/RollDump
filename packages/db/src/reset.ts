import { createDatabase, users, user_sessions, password_reset_tokens } from './index';

async function main() {
  const dbUrl = 'postgresql://postgres.bmgqijrdlzuubcpmjewa:rollfilmaja2247@aws-1-ap-south-1.pooler.supabase.com:5432/postgres';
  const db = createDatabase(dbUrl);
  
  console.log('Menghapus seluruh isi tabel database...');
  try {
    await db.delete(password_reset_tokens);
    await db.delete(user_sessions);
    await db.delete(users);
    console.log('✅ Semua data di database berhasil direset.');
  } catch (error) {
    console.error('❌ Gagal mereset:', error);
  }
  process.exit(0);
}

main();
