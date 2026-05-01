import { createDatabase, users } from './index';
import { eq } from 'drizzle-orm';
import crypto from 'node:crypto';

async function fixAdmin() {
  const dbUrl = 'postgresql://postgres.bmgqijrdlzuubcpmjewa:rollfilmaja2247@aws-1-ap-south-1.pooler.supabase.com:5432/postgres';
  const db = createDatabase(dbUrl);

  const password = 'admin123';
  
  // Node.js compatible SHA-256 (matches AuthService result)
  const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

  console.log('🔧 Fixing admin password hash...');

  try {
    // Check if exists, if not create, if exists update
    const [existing] = await db.select().from(users).where(eq(users.username, 'admin'));
    
    if (existing) {
      await db.update(users).set({ password: hashedPassword, role: 'admin' }).where(eq(users.id, existing.id));
      console.log('✅ Admin password updated!');
    } else {
      await db.insert(users).values({
        email: 'admin@rolldump.com',
        username: 'admin',
        password: hashedPassword,
        fullName: 'Super Admin',
        role: 'admin',
      });
      console.log('✅ Admin created with correct hash!');
    }
    
    console.log('📧 Email: admin@rolldump.com');
    console.log('🔑 Password: admin123');
  } catch (err: any) {
    console.error('❌ Failed to fix admin:', err);
  }

  process.exit(0);
}

fixAdmin();
