import { createDatabase, users, user_sessions } from '@rolldump/db';
import { eq, or } from 'drizzle-orm';

export class AuthService {
  private db: ReturnType<typeof createDatabase>;

  constructor(databaseUrl: string) {
    this.db = createDatabase(databaseUrl);
  }

  private async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private generateToken(): string {
    return crypto.randomUUID() + crypto.randomUUID();
  }

  async register(data: typeof users.$inferInsert) {
    const hashedPassword = await this.hashPassword(data.password);
    
    const [user] = await this.db.insert(users).values({
      ...data,
      password: hashedPassword,
    }).returning();
    
    return user;
  }

  async login(identifier: string, password: string) {
    // identifier can be email or username
    const [user] = await this.db.select().from(users).where(
      or(eq(users.email, identifier), eq(users.username, identifier))
    );
    
    if (!user) {
      throw new Error('User not found');
    }

    const hashedPassword = await this.hashPassword(password);
    if (user.password !== hashedPassword) {
      throw new Error('Invalid password');
    }

    return user;
  }

  async createSession(userId: string) {
    const refreshToken = this.generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    const [session] = await this.db.insert(user_sessions).values({
      userId,
      refreshToken,
      expiresAt,
    }).returning();

    return session;
  }

  async validateRefreshToken(token: string) {
    const [session] = await this.db.select().from(user_sessions).where(eq(user_sessions.refreshToken, token));
    
    if (!session) {
      return null;
    }

    if (new Date() > session.expiresAt) {
      await this.db.delete(user_sessions).where(eq(user_sessions.id, session.id));
      return null;
    }

    const [user] = await this.db.select().from(users).where(eq(users.id, session.userId));
    return { session, user };
  }
}
