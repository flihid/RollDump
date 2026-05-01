import { createDatabase, film_tips, tip_votes, reports, users, films } from '@rolldump/db';
import { eq, and, desc, sql as drizzleSql, gte, count } from 'drizzle-orm';

export class TipService {
  private db: ReturnType<typeof createDatabase>;

  constructor(databaseUrl: string) {
    this.db = createDatabase(databaseUrl);
  }

  // 1. Create Tip with Anti-Spam (max 5/day)
  async createTip(data: {
    filmId: string;
    userId: string;
    title: string;
    content: string;
    targetFormat: string;
  }) {
    // Check spam
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [spamCheck] = await this.db
      .select({ count: count() })
      .from(film_tips)
      .where(and(eq(film_tips.userId, data.userId), gte(film_tips.createdAt, oneDayAgo)));

    if (Number(spamCheck.count) >= 5) {
      throw new Error('LIMIT_EXCEEDED');
    }

    const [tip] = await this.db.insert(film_tips).values({
      filmId: data.filmId,
      userId: data.userId,
      title: data.title,
      content: data.content,
      targetFormat: data.targetFormat,
    }).returning();

    return tip;
  }

  // 2. Get Film Tips
  async getFilmTips(filmSlug: string, query?: { format?: string; sort?: 'top' | 'new' }) {
    const [film] = await this.db.select({ id: films.id }).from(films).where(eq(films.slug, filmSlug));
    if (!film) throw new Error('NOT_FOUND');

    let conditions = [
      eq(film_tips.filmId, film.id),
      eq(film_tips.isHidden, 0)
    ];

    if (query?.format && query.format !== 'All') {
      conditions.push(eq(film_tips.targetFormat, query.format));
    }

    const sortOrder = query?.sort === 'new' ? desc(film_tips.createdAt) : desc(film_tips.netScore);

    const result = await this.db
      .select({
        id: film_tips.id,
        title: film_tips.title,
        content: film_tips.content,
        targetFormat: film_tips.targetFormat,
        netScore: film_tips.netScore,
        createdAt: film_tips.createdAt,
        userId: users.id,
        username: users.username,
        avatarUrl: users.avatarUrl,
      })
      .from(film_tips)
      .innerJoin(users, eq(film_tips.userId, users.id))
      .where(and(...conditions))
      .orderBy(sortOrder);

    return result;
  }

  // 3. Vote on Tip
  async voteTip(tipId: string, userId: string, voteType: number) {
    if (voteType !== 1 && voteType !== -1) throw new Error('INVALID_VOTE');

    return await this.db.transaction(async (tx) => {
      // Check existing vote
      const [existing] = await tx
        .select()
        .from(tip_votes)
        .where(and(eq(tip_votes.tipId, tipId), eq(tip_votes.userId, userId)));

      if (existing) {
        if (existing.voteType === voteType) {
          // Remove vote if same
          await tx.delete(tip_votes).where(eq(tip_votes.id, existing.id));
          await tx.update(film_tips)
            .set({ netScore: drizzleSql`${film_tips.netScore} - ${voteType}` })
            .where(eq(film_tips.id, tipId));
          return { voted: 0 };
        } else {
          // Switch vote
          await tx.update(tip_votes).set({ voteType }).where(eq(tip_votes.id, existing.id));
          await tx.update(film_tips)
            .set({ netScore: drizzleSql`${film_tips.netScore} + ${2 * voteType}` })
            .where(eq(film_tips.id, tipId));
          return { voted: voteType };
        }
      }

      // New vote
      await tx.insert(tip_votes).values({ tipId, userId, voteType });
      await tx.update(film_tips)
        .set({ netScore: drizzleSql`${film_tips.netScore} + ${voteType}` })
        .where(eq(film_tips.id, tipId));

      return { voted: voteType };
    });
  }

  // 4. Report Tip
  async reportTip(tipId: string, userId: string, data: { reason: string; description?: string }) {
    await this.db.insert(reports).values({
      tipId,
      userId,
      reason: data.reason,
      description: data.description,
    });

    // Check report count
    const [reportCount] = await this.db
      .select({ count: count() })
      .from(reports)
      .where(eq(reports.tipId, tipId));

    if (Number(reportCount.count) >= 10) {
      await this.db.update(film_tips).set({ isHidden: 1 }).where(eq(film_tips.id, tipId));
    }

    return true;
  }

  // 5. Admin: Update Datasheet
  async updateDatasheet(filmId: string, url: string) {
    await this.db.update(films).set({ datasheetUrl: url }).where(eq(films.id, filmId));
    return true;
  }

  // 6. Admin: Delete Tip
  async deleteTip(tipId: string) {
    await this.db.delete(film_tips).where(eq(film_tips.id, tipId));
    return true;
  }

  // 7. Admin: Get All Reports
  async getAllReports() {
    return await this.db
      .select({
        id: reports.id,
        reason: reports.reason,
        description: reports.description,
        status: reports.status,
        createdAt: reports.createdAt,
        tipId: film_tips.id,
        tipTitle: film_tips.title,
        tipContent: film_tips.content,
        reporterUsername: users.username,
      })
      .from(reports)
      .innerJoin(film_tips, eq(reports.tipId, film_tips.id))
      .innerJoin(users, eq(reports.userId, users.id))
      .orderBy(desc(reports.createdAt));
  }
}
