import { createDatabase, reviews, review_upvotes, films, film_variants, users } from '@rolldump/db';
import { eq, and, desc, sql, isNull } from 'drizzle-orm';

export class ReviewService {
  private db: ReturnType<typeof createDatabase>;

  constructor(databaseUrl: string) {
    this.db = createDatabase(databaseUrl);
  }

  // ── 1. Buat Ulasan ──
  async createReview(data: {
    userId: string;
    filmId: string;
    filmVariantId: string;
    rating: number;
    content: string;
    cameraUsed?: string;
  }) {
    const [review] = await this.db.insert(reviews).values({
      userId: data.userId,
      filmId: data.filmId,
      filmVariantId: data.filmVariantId,
      rating: data.rating,
      content: data.content,
      cameraUsed: data.cameraUsed || null,
    }).returning();

    // Update avg_rating on films table
    await this.updateFilmAvgRating(data.filmId);

    return review;
  }

  // ── 2. Edit Ulasan ──
  async updateReview(reviewId: string, userId: string, data: {
    rating?: number;
    content?: string;
    cameraUsed?: string;
  }) {
    // Check ownership
    const [existing] = await this.db.select().from(reviews).where(eq(reviews.id, reviewId));
    if (!existing) throw new Error('NOT_FOUND');
    if (existing.userId !== userId) throw new Error('FORBIDDEN');
    if (existing.deletedAt) throw new Error('NOT_FOUND');

    const updateData: any = { editedAt: new Date() };
    if (data.rating !== undefined) updateData.rating = data.rating;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.cameraUsed !== undefined) updateData.cameraUsed = data.cameraUsed;

    const [updated] = await this.db.update(reviews)
      .set(updateData)
      .where(eq(reviews.id, reviewId))
      .returning();

    // Update avg rating if rating changed
    if (data.rating !== undefined) {
      await this.updateFilmAvgRating(existing.filmId);
    }

    return updated;
  }

  // ── 3. Get Reviews for Film (with format filter) ──
  async getFilmReviews(filmId: string, format?: string) {
    let query;

    if (format) {
      // Join with film_variants to filter by format
      query = this.db
        .select({
          id: reviews.id,
          userId: reviews.userId,
          filmId: reviews.filmId,
          filmVariantId: reviews.filmVariantId,
          rating: reviews.rating,
          content: reviews.content,
          cameraUsed: reviews.cameraUsed,
          editedAt: reviews.editedAt,
          createdAt: reviews.createdAt,
          format: film_variants.format,
          username: users.username,
          avatarUrl: users.avatarUrl,
        })
        .from(reviews)
        .leftJoin(film_variants, eq(reviews.filmVariantId, film_variants.id))
        .innerJoin(users, eq(reviews.userId, users.id))
        .where(and(
          eq(reviews.filmId, filmId),
          isNull(reviews.deletedAt),
          eq(film_variants.format, format)
        ))
        .orderBy(desc(reviews.createdAt));
    } else {
      query = this.db
        .select({
          id: reviews.id,
          userId: reviews.userId,
          filmId: reviews.filmId,
          filmVariantId: reviews.filmVariantId,
          rating: reviews.rating,
          content: reviews.content,
          cameraUsed: reviews.cameraUsed,
          editedAt: reviews.editedAt,
          createdAt: reviews.createdAt,
          format: film_variants.format,
          username: users.username,
          avatarUrl: users.avatarUrl,
        })
        .from(reviews)
        .leftJoin(film_variants, eq(reviews.filmVariantId, film_variants.id))
        .innerJoin(users, eq(reviews.userId, users.id))
        .where(and(
          eq(reviews.filmId, filmId),
          isNull(reviews.deletedAt)
        ))
        .orderBy(desc(reviews.createdAt));
    }

    const results = await query;

    // Get upvote counts and user's own upvotes
    const reviewIds = results.map(r => r.id);
    let upvoteCounts: Record<string, number> = {};

    if (reviewIds.length > 0) {
      const counts = await this.db
        .select({
          reviewId: review_upvotes.reviewId,
          count: sql<number>`count(*)::int`.as('count'),
        })
        .from(review_upvotes)
        .where(sql`${review_upvotes.reviewId} IN ${reviewIds}`)
        .groupBy(review_upvotes.reviewId);

      for (const c of counts) {
        upvoteCounts[c.reviewId] = c.count;
      }
    }

    return results.map(r => ({
      ...r,
      upvoteCount: upvoteCounts[r.id] || 0,
    }));
  }

  // Helper: get which reviews a user has upvoted
  async getUserUpvotedReviewIds(userId: string, reviewIds: string[]): Promise<string[]> {
    if (reviewIds.length === 0) return [];
    const upvoted = await this.db
      .select({ reviewId: review_upvotes.reviewId })
      .from(review_upvotes)
      .where(and(
        eq(review_upvotes.userId, userId),
        sql`${review_upvotes.reviewId} IN ${reviewIds}`
      ));
    return upvoted.map(u => u.reviewId);
  }

  // ── 4. Soft Delete Ulasan ──
  async softDeleteReview(reviewId: string, userId: string, isAdmin: boolean = false) {
    const [existing] = await this.db.select().from(reviews).where(eq(reviews.id, reviewId));
    if (!existing) throw new Error('NOT_FOUND');
    if (!isAdmin && existing.userId !== userId) throw new Error('FORBIDDEN');

    await this.db.update(reviews)
      .set({ deletedAt: new Date() })
      .where(eq(reviews.id, reviewId));

    // Recalculate avg rating
    await this.updateFilmAvgRating(existing.filmId);

    return true;
  }

  // ── 5. Toggle Upvote ──
  async toggleUpvote(reviewId: string, userId: string): Promise<{ upvoted: boolean }> {
    // Check if already upvoted
    const [existing] = await this.db
      .select()
      .from(review_upvotes)
      .where(and(
        eq(review_upvotes.reviewId, reviewId),
        eq(review_upvotes.userId, userId)
      ));

    if (existing) {
      // Remove upvote
      await this.db.delete(review_upvotes).where(eq(review_upvotes.id, existing.id));
      return { upvoted: false };
    } else {
      // Add upvote
      await this.db.insert(review_upvotes).values({ reviewId, userId });
      return { upvoted: true };
    }
  }

  // ── Helper: Update average rating cache on films ──
  private async updateFilmAvgRating(filmId: string) {
    const [result] = await this.db
      .select({
        avg: sql<string>`ROUND(AVG(${reviews.rating})::numeric, 2)`.as('avg'),
      })
      .from(reviews)
      .where(and(
        eq(reviews.filmId, filmId),
        isNull(reviews.deletedAt)
      ));

    const avg = result?.avg || null;
    await this.db.update(films).set({ avgRating: avg }).where(eq(films.id, filmId));
  }

  // Get film ID from slug (helper for API)
  async getFilmIdBySlug(slug: string): Promise<string | null> {
    const [film] = await this.db.select({ id: films.id }).from(films).where(eq(films.slug, slug));
    return film?.id || null;
  }
}
