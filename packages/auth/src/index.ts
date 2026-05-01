import {
  createDatabase,
  users,
  userSessions,
  emailVerifications,
  passwordResets,
  userPreferences,
  privacySettings,
  notificationPreferences,
} from '@rolldump/db';
import { and, eq, isNull, or } from 'drizzle-orm';

// PBKDF2 password hashing - works on Cloudflare Workers and Node 20+ (Web Crypto)
async function pbkdf2Hash(password: string, saltHex?: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = saltHex
    ? hexToBuf(saltHex)
    : crypto.getRandomValues(new Uint8Array(16));
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    baseKey,
    256,
  );
  return `pbkdf2$${bufToHex(salt)}$${bufToHex(new Uint8Array(bits))}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!stored.startsWith('pbkdf2$')) {
    // Legacy SHA-256 fallback (so existing seed users still work)
    const enc = new TextEncoder();
    const data = await crypto.subtle.digest('SHA-256', enc.encode(password));
    const hex = bufToHex(new Uint8Array(data));
    return hex === stored;
  }
  const [, saltHex, expected] = stored.split('$');
  const fresh = await pbkdf2Hash(password, saltHex);
  return fresh.split('$')[2] === expected;
}

function bufToHex(buf: Uint8Array): string {
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
function hexToBuf(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

function randomToken(bytes = 32): string {
  const b = crypto.getRandomValues(new Uint8Array(bytes));
  return bufToHex(b);
}
async function sha256(input: string): Promise<string> {
  const enc = new TextEncoder();
  const data = await crypto.subtle.digest('SHA-256', enc.encode(input));
  return bufToHex(new Uint8Array(data));
}

export class AuthService {
  public db: ReturnType<typeof createDatabase>;

  constructor(databaseUrl: string) {
    this.db = createDatabase(databaseUrl);
  }

  async register(data: {
    email: string;
    username: string;
    password: string;
    fullName?: string;
    role?: string;
    status?: string;
  }) {
    const hashed = await pbkdf2Hash(data.password);
    const [user] = await this.db
      .insert(users)
      .values({
        email: data.email.toLowerCase(),
        username: data.username,
        password: hashed,
        fullName: data.fullName || data.username,
        role: data.role || 'user',
        status: data.status || 'pending',
      })
      .returning();
    // initialize related rows
    await this.db.insert(userPreferences).values({ userId: user.id }).onConflictDoNothing();
    await this.db.insert(privacySettings).values({ userId: user.id }).onConflictDoNothing();
    await this.db.insert(notificationPreferences).values({ userId: user.id }).onConflictDoNothing();
    return user;
  }

  async login(identifier: string, password: string) {
    const id = identifier.toLowerCase();
    const [user] = await this.db
      .select()
      .from(users)
      .where(or(eq(users.email, id), eq(users.username, identifier)));
    if (!user) throw new Error('User not found');
    if (!(await verifyPassword(password, user.password))) {
      throw new Error('Invalid password');
    }
    return user;
  }

  async createSession(userId: string, ctx?: { userAgent?: string; ip?: string }) {
    const refreshToken = randomToken(32);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const [session] = await this.db
      .insert(userSessions)
      .values({
        userId,
        refreshToken,
        userAgent: ctx?.userAgent,
        ip: ctx?.ip,
        expiresAt,
      })
      .returning();
    return session;
  }

  async revokeSession(refreshToken: string) {
    await this.db
      .update(userSessions)
      .set({ revokedAt: new Date() })
      .where(eq(userSessions.refreshToken, refreshToken));
  }

  async revokeAllSessions(userId: string) {
    await this.db
      .update(userSessions)
      .set({ revokedAt: new Date() })
      .where(eq(userSessions.userId, userId));
  }

  async listSessions(userId: string) {
    return this.db
      .select()
      .from(userSessions)
      .where(and(eq(userSessions.userId, userId), isNull(userSessions.revokedAt)));
  }

  async validateRefreshToken(token: string) {
    const [session] = await this.db
      .select()
      .from(userSessions)
      .where(eq(userSessions.refreshToken, token));
    if (!session) return null;
    if (session.revokedAt) return null;
    if (new Date() > session.expiresAt) return null;
    const [user] = await this.db.select().from(users).where(eq(users.id, session.userId));
    return { session, user };
  }

  async createEmailVerification(userId: string) {
    const raw = randomToken(32);
    const tokenHash = await sha256(raw);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.db.insert(emailVerifications).values({ userId, tokenHash, expiresAt });
    return raw;
  }

  async consumeEmailVerification(rawToken: string) {
    const tokenHash = await sha256(rawToken);
    const [row] = await this.db
      .select()
      .from(emailVerifications)
      .where(eq(emailVerifications.tokenHash, tokenHash));
    if (!row) return null;
    if (row.usedAt) return null;
    if (new Date() > row.expiresAt) return null;
    await this.db
      .update(emailVerifications)
      .set({ usedAt: new Date() })
      .where(eq(emailVerifications.id, row.id));
    await this.db
      .update(users)
      .set({ status: 'active', emailVerifiedAt: new Date() })
      .where(eq(users.id, row.userId));
    return row.userId;
  }

  async createPasswordReset(email: string) {
    const [user] = await this.db.select().from(users).where(eq(users.email, email.toLowerCase()));
    if (!user) return null; // anti-enumeration handled by caller
    const raw = randomToken(32);
    const tokenHash = await sha256(raw);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h
    await this.db.insert(passwordResets).values({ userId: user.id, tokenHash, expiresAt });
    return raw;
  }

  async consumePasswordReset(rawToken: string, newPassword: string) {
    const tokenHash = await sha256(rawToken);
    const [row] = await this.db
      .select()
      .from(passwordResets)
      .where(eq(passwordResets.tokenHash, tokenHash));
    if (!row) return false;
    if (row.usedAt) return false;
    if (new Date() > row.expiresAt) return false;
    const hashed = await pbkdf2Hash(newPassword);
    await this.db.update(users).set({ password: hashed }).where(eq(users.id, row.userId));
    await this.db
      .update(passwordResets)
      .set({ usedAt: new Date() })
      .where(eq(passwordResets.id, row.id));
    // revoke sessions to force re-login
    await this.revokeAllSessions(row.userId);
    return true;
  }

  async updatePassword(userId: string, newPassword: string) {
    const hashed = await pbkdf2Hash(newPassword);
    await this.db.update(users).set({ password: hashed }).where(eq(users.id, userId));
  }
}

export { pbkdf2Hash, verifyPassword, randomToken, sha256 };
