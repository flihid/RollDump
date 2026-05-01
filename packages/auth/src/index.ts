import { createDatabase, users, user_sessions, password_reset_tokens } from '@rolldump/db';
export { FilmService } from './film-service';
export { ReviewService } from './review-service';
export { PhotoService } from './photo-service';
export { TipService } from './tip-service';
export { DiscoveryService } from './discovery-service';
export { ListService } from './list-service';
export { SocialService } from './social-service';
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

  async getUserByUsername(username: string) {
    const [user] = await this.db.select({
      id: users.id,
      username: users.username,
      fullName: users.fullName,
      avatarUrl: users.avatarUrl,
      bio: users.bio,
      formatPreferences: users.formatPreferences,
    }).from(users).where(eq(users.username, username));
    return user;
  }

  async updateProfile(userId: string, data: { fullName?: string, bio?: string, avatarUrl?: string }) {
    const [updatedUser] = await this.db.update(users)
      .set(data)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        avatarUrl: users.avatarUrl,
        bio: users.bio,
      });
    return updatedUser;
  }

  async updatePreferences(userId: string, preferences: string[]) {
    const [updatedUser] = await this.db.update(users)
      .set({ formatPreferences: preferences })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        formatPreferences: users.formatPreferences,
      });
    return updatedUser;
  }

  async createPasswordResetToken(email: string) {
    const [user] = await this.db.select().from(users).where(eq(users.email, email));
    if (!user) {
      // Don't throw error to prevent email enumeration, just return null or dummy
      return null;
    }

    const token = this.generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiration

    await this.db.insert(password_reset_tokens).values({
      userId: user.id,
      token,
      expiresAt,
    });

    return token;
  }

  async resetPassword(token: string, newPassword: string) {
    const [resetToken] = await this.db.select().from(password_reset_tokens).where(eq(password_reset_tokens.token, token));
    
    if (!resetToken) {
      throw new Error('Invalid or expired token');
    }

    if (new Date() > resetToken.expiresAt) {
      await this.db.delete(password_reset_tokens).where(eq(password_reset_tokens.id, resetToken.id));
      throw new Error('Invalid or expired token');
    }

    const hashedPassword = await this.hashPassword(newPassword);
    
    await this.db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, resetToken.userId));
      
    await this.db.delete(password_reset_tokens).where(eq(password_reset_tokens.id, resetToken.id));
    
    return true;
  }

  async deleteAccount(userId: string) {
    // Delete user from DB. Depending on DB constraints, this might cascade or require deleting related data first.
    // Drizzle with onDelete: 'cascade' will handle user_sessions and password_reset_tokens automatically.
    await this.db.delete(users).where(eq(users.id, userId));
    return true;
  }
}
