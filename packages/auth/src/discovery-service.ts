import { createDatabase, films, users, user_lists, film_variants, reviews } from '@rolldump/db';
import { eq, ilike, or, sql, desc, and } from 'drizzle-orm';

export class DiscoveryService {
  private db: ReturnType<typeof createDatabase>;

  constructor(databaseUrl: string) {
    this.db = createDatabase(databaseUrl);
  }

  // 1. Global Auto-Suggest Search (Omnibar)
  async autocomplete(q: string) {
    if (!q || q.length < 2) return { films: [], users: [], lists: [] };

    const [filmResults, userResults, listResults] = await Promise.all([
      // Search Films
      this.db
        .select({ id: films.id, name: films.name, slug: films.slug, brand: films.brand, imageUrl: films.imageUrl })
        .from(films)
        .where(or(ilike(films.name, `%${q}%`), ilike(films.brand, `%${q}%`)))
        .limit(3),
      
      // Search Users
      this.db
        .select({ id: users.id, username: users.username, fullName: users.fullName, avatarUrl: users.avatarUrl })
        .from(users)
        .where(or(ilike(users.username, `%${q}%`), ilike(users.fullName, `%${q}%`)))
        .limit(3),

      // Search Lists (Public only)
      this.db
        .select({ id: user_lists.id, title: user_lists.title, slug: user_lists.slug, userId: user_lists.userId })
        .from(user_lists)
        .where(and(ilike(user_lists.title, `%${q}%`), eq(user_lists.isPublic, 1)))
        .limit(2)
    ]);

    return {
      films: filmResults,
      users: userResults,
      lists: listResults,
    };
  }

  // 2. Brands Index
  async getBrands() {
    const results = await this.db
      .select({
        brand: films.brand,
        totalFilms: sql<number>`count(${films.id})::int`,
      })
      .from(films)
      .groupBy(films.brand)
      .orderBy(desc(sql`count(${films.id})`));

    return results;
  }

  // 3. Film of the Day (Seeded by Date)
  async getDailyFeatured() {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Simple deterministic random based on date string
    // In production with large data, we'd use a more robust seeding or a separate table
    const allFilms = await this.db.select({ id: films.id }).from(films);
    if (allFilms.length === 0) return null;

    // Seeded random
    let seed = 0;
    for (let i = 0; i < today.length; i++) {
        seed += today.charCodeAt(i);
    }
    const index = seed % allFilms.length;
    const featuredId = allFilms[index].id;

    // Get full detail with one top review and one photo
    const [film] = await this.db
      .select()
      .from(films)
      .where(eq(films.id, featuredId));

    if (!film) return null;

    // Get one top review
    const [topReview] = await this.db
      .select({
        content: reviews.content,
        rating: reviews.rating,
        username: users.username
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.userId, users.id))
      .where(eq(reviews.filmId, film.id))
      .orderBy(desc(reviews.rating))
      .limit(1);

    return {
      ...film,
      topReview: topReview || null
    };
  }
}
