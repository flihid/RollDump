import { createDatabase, films, film_variants, reviews, wishlists } from '@rolldump/db';
import { eq, desc, sql, and, gt, asc, between, inArray, ilike, gte, lte } from 'drizzle-orm';

export class FilmService {
  private db: ReturnType<typeof createDatabase>;

  constructor(databaseUrl: string) {
    this.db = createDatabase(databaseUrl);
  }

  // ── 1. Direktori Katalog Film (Cursor Pagination) ──

  async getFilms(cursor?: string, limit: number = 20) {
    let query = this.db
      .select({
        id: films.id,
        name: films.name,
        slug: films.slug,
        brand: films.brand,
        iso: films.iso,
        type: films.type,
        description: films.description,
        imageUrl: films.imageUrl,
        createdAt: films.createdAt,
      })
      .from(films)
      .orderBy(desc(films.createdAt))
      .limit(limit + 1); // +1 to know if there's a next page

    if (cursor) {
      query = query.where(sql`${films.createdAt} < ${new Date(cursor)}`);
    }

    const results = await query;

    const hasNext = results.length > limit;
    const items = hasNext ? results.slice(0, limit) : results;
    const nextCursor = hasNext ? items[items.length - 1].createdAt.toISOString() : null;

    // Aggregate available_formats for each film
    const filmIds = items.map(f => f.id);
    let formatsMap: Record<string, string[]> = {};

    if (filmIds.length > 0) {
      const variants = await this.db
        .select({
          filmId: film_variants.filmId,
          format: film_variants.format,
        })
        .from(film_variants)
        .where(sql`${film_variants.filmId} IN ${filmIds}`);

      for (const v of variants) {
        if (!formatsMap[v.filmId]) formatsMap[v.filmId] = [];
        if (!formatsMap[v.filmId].includes(v.format)) {
          formatsMap[v.filmId].push(v.format);
        }
      }
    }

    const filmsWithFormats = items.map(f => ({
      ...f,
      availableFormats: formatsMap[f.id] || [],
    }));

    return { films: filmsWithFormats, nextCursor };
  }

  // ── 1b. Advanced Filtering & Sorting (EPIC07) ──
  async getFilmsAdvanced(params: {
    isos?: number[];
    color_type?: string;
    format?: string;
    frame_size?: string;
    brand?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    cursor?: string;
    limit?: number;
  }) {
    const limit = params.limit || 20;
    const sort_order = params.sort_order || 'desc';
    const sort_by = params.sort_by || 'newest';

    let conditions: any[] = [];

    if (params.isos && params.isos.length > 0) {
      conditions.push(inArray(films.iso, params.isos));
    } else if (params.iso_min !== undefined && params.iso_max !== undefined) {
      conditions.push(between(films.iso, params.iso_min, params.iso_max));
    } else if (params.iso_min !== undefined) {
      conditions.push(gte(films.iso, params.iso_min));
    } else if (params.iso_max !== undefined) {
      conditions.push(lte(films.iso, params.iso_max));
    }

    if (params.color_type) {
      conditions.push(eq(films.type, params.color_type));
    }

    if (params.brand) {
      conditions.push(ilike(films.brand, `%${params.brand}%`));
    }

    // Join with variants if format or frame_size is provided
    let query = this.db
      .select({
        id: films.id,
        name: films.name,
        slug: films.slug,
        brand: films.brand,
        iso: films.iso,
        type: films.type,
        imageUrl: films.imageUrl,
        createdAt: films.createdAt,
        // Optional aggregates for sorting
        ratingAvg: sql<number>`COALESCE(AVG(${reviews.rating}), 0)::float`.as('rating_avg'),
        reviewCount: sql<number>`COUNT(${reviews.id})::int`.as('review_count'),
      })
      .from(films)
      .leftJoin(reviews, eq(films.id, reviews.filmId))
      .leftJoin(film_variants, eq(films.id, film_variants.filmId));

    if (params.format) {
      conditions.push(eq(film_variants.format, params.format));
    }
    if (params.frame_size) {
      conditions.push(eq(film_variants.frameSize, params.frame_size));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    query = query.groupBy(films.id);

    // Sorting logic
    if (sort_by === 'rating_avg') {
      query = query.orderBy(sort_order === 'asc' ? asc(sql`rating_avg`) : desc(sql`rating_avg`));
    } else if (sort_by === 'review_count') {
      query = query.orderBy(sort_order === 'asc' ? asc(sql`review_count`) : desc(sql`review_count`));
    } else if (sort_by === 'alphabetical') {
      query = query.orderBy(sort_order === 'asc' ? asc(films.name) : desc(films.name));
    } else {
      query = query.orderBy(desc(films.createdAt));
    }

    if (params.cursor) {
      // For simplicity in advanced filtering, we might use offset or a simplified cursor.
      // But let's stick to limit for now as deep filters often reset pagination.
    }

    const results = await query.limit(limit);

    // Get formats for results
    const filmIds = results.map(f => f.id);
    let formatsMap: Record<string, string[]> = {};
    if (filmIds.length > 0) {
      const variants = await this.db
        .select({ filmId: film_variants.filmId, format: film_variants.format })
        .from(film_variants)
        .where(inArray(film_variants.filmId, filmIds));
      for (const v of variants) {
        if (!formatsMap[v.filmId]) formatsMap[v.filmId] = [];
        if (!formatsMap[v.filmId].includes(v.format)) formatsMap[v.filmId].push(v.format);
      }
    }

    return results.map(f => ({
      ...f,
      availableFormats: formatsMap[f.id] || [],
    }));
  }

  // ── 2. Detail Film by Slug ──

  async getFilmBySlug(slug: string) {
    const [film] = await this.db
      .select()
      .from(films)
      .where(eq(films.slug, slug));

    if (!film) return null;

    const variants = await this.db
      .select()
      .from(film_variants)
      .where(eq(film_variants.filmId, film.id));

    return { ...film, variants };
  }

  // ── 3. Tambah Film (Admin) ──

  async createFilm(data: {
    name: string;
    brand: string;
    iso: number;
    type: string;
    description?: string;
    imageUrl?: string;
    variants: { format: string; frameSize?: string; exposures?: number }[];
  }) {
    // Generate slug from name
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Insert parent film
    const [film] = await this.db.insert(films).values({
      name: data.name,
      slug,
      brand: data.brand,
      iso: data.iso,
      type: data.type,
      description: data.description || null,
      imageUrl: data.imageUrl || null,
    }).returning();

    // Insert child variants
    if (data.variants && data.variants.length > 0) {
      await this.db.insert(film_variants).values(
        data.variants.map(v => ({
          filmId: film.id,
          format: v.format,
          frameSize: v.frameSize || null,
          exposures: v.exposures || null,
        }))
      );
    }

    // Return complete film with variants
    return this.getFilmBySlug(slug);
  }

  // ── 4. Katalog Trending (top films by review count in last 7 days) ──

  async getTrendingFilms(limit: number = 10) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trending = await this.db
      .select({
        filmId: reviews.filmId,
        reviewCount: sql<number>`count(*)::int`.as('review_count'),
      })
      .from(reviews)
      .where(gt(reviews.createdAt, sevenDaysAgo))
      .groupBy(reviews.filmId)
      .orderBy(sql`count(*) DESC`)
      .limit(limit);

    if (trending.length === 0) {
      // Fallback: return latest films if no reviews exist
      const latest = await this.db
        .select()
        .from(films)
        .orderBy(desc(films.createdAt))
        .limit(limit);

      const filmIds = latest.map(f => f.id);
      let formatsMap: Record<string, string[]> = {};
      if (filmIds.length > 0) {
        const variants = await this.db
          .select({ filmId: film_variants.filmId, format: film_variants.format })
          .from(film_variants)
          .where(sql`${film_variants.filmId} IN ${filmIds}`);
        for (const v of variants) {
          if (!formatsMap[v.filmId]) formatsMap[v.filmId] = [];
          if (!formatsMap[v.filmId].includes(v.format)) formatsMap[v.filmId].push(v.format);
        }
      }

      return latest.map(f => ({
        ...f,
        availableFormats: formatsMap[f.id] || [],
        reviewCount: 0,
        isTrending: false,
      }));
    }

    const filmIds = trending.map(t => t.filmId);
    const trendingFilms = await this.db
      .select()
      .from(films)
      .where(sql`${films.id} IN ${filmIds}`);

    // formats
    let formatsMap: Record<string, string[]> = {};
    if (filmIds.length > 0) {
      const variants = await this.db
        .select({ filmId: film_variants.filmId, format: film_variants.format })
        .from(film_variants)
        .where(sql`${film_variants.filmId} IN ${filmIds}`);
      for (const v of variants) {
        if (!formatsMap[v.filmId]) formatsMap[v.filmId] = [];
        if (!formatsMap[v.filmId].includes(v.format)) formatsMap[v.filmId].push(v.format);
      }
    }

    const reviewCountMap = Object.fromEntries(trending.map(t => [t.filmId, t.reviewCount]));

    return trendingFilms.map(f => ({
      ...f,
      availableFormats: formatsMap[f.id] || [],
      reviewCount: reviewCountMap[f.id] || 0,
      isTrending: true,
    }));
  }

  // ── 5. Wishlist ──

  async addToWishlist(userId: string, filmVariantId: string) {
    try {
      const [entry] = await this.db.insert(wishlists).values({
        userId,
        filmVariantId,
      }).returning();
      return entry;
    } catch (err: any) {
      if (err.message?.includes('unique_user_variant') || err.message?.includes('duplicate key')) {
        throw new Error('CONFLICT');
      }
      throw err;
    }
  }

  async removeFromWishlist(userId: string, filmVariantId: string) {
    await this.db.delete(wishlists).where(
      and(eq(wishlists.userId, userId), eq(wishlists.filmVariantId, filmVariantId))
    );
    return true;
  }

  async getWishlist(userId: string) {
    const items = await this.db
      .select({
        id: wishlists.id,
        filmVariantId: wishlists.filmVariantId,
        createdAt: wishlists.createdAt,
        format: film_variants.format,
        frameSize: film_variants.frameSize,
        exposures: film_variants.exposures,
        filmId: film_variants.filmId,
      })
      .from(wishlists)
      .innerJoin(film_variants, eq(wishlists.filmVariantId, film_variants.id))
      .where(eq(wishlists.userId, userId))
      .orderBy(desc(wishlists.createdAt));

    // Enrich with film info
    const filmIds = [...new Set(items.map(i => i.filmId))];
    let filmsMap: Record<string, any> = {};
    if (filmIds.length > 0) {
      const filmData = await this.db
        .select({ id: films.id, name: films.name, slug: films.slug, brand: films.brand, imageUrl: films.imageUrl })
        .from(films)
        .where(sql`${films.id} IN ${filmIds}`);
      for (const f of filmData) {
        filmsMap[f.id] = f;
      }
    }

    return items.map(i => ({
      ...i,
      film: filmsMap[i.filmId] || null,
    }));
  }

  async getUserWishlistVariantIds(userId: string): Promise<string[]> {
    const items = await this.db
      .select({ filmVariantId: wishlists.filmVariantId })
      .from(wishlists)
      .where(eq(wishlists.userId, userId));
    return items.map(i => i.filmVariantId);
  }
}
