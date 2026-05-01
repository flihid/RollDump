import { createDatabase, photos, film_variants, users, films } from '@rolldump/db';
import { eq, and, desc, isNull } from 'drizzle-orm';

export class PhotoService {
  private db: ReturnType<typeof createDatabase>;

  constructor(databaseUrl: string) {
    this.db = createDatabase(databaseUrl);
  }

  // 1. Create Photo
  async createPhoto(data: {
    userId: string;
    filmVariantId: string;
    imageUrl: string;
    caption?: string;
    cameraUsed?: string;
    lensUsed?: string;
  }) {
    const [photo] = await this.db.insert(photos).values({
      userId: data.userId,
      filmVariantId: data.filmVariantId,
      imageUrl: data.imageUrl,
      caption: data.caption || null,
      cameraUsed: data.cameraUsed || null,
      lensUsed: data.lensUsed || null,
    }).returning();

    return photo;
  }

  // 2. Get Photos for Film (Gallery)
  async getFilmPhotos(filmSlug: string, query?: { format?: string; frameSize?: string }) {
    // First, find the film id based on the slug
    const [film] = await this.db.select({ id: films.id }).from(films).where(eq(films.slug, filmSlug));
    if (!film) throw new Error('NOT_FOUND');

    let conditions = [
      eq(film_variants.filmId, film.id),
      isNull(photos.deletedAt)
    ];

    if (query?.format) conditions.push(eq(film_variants.format, query.format));
    if (query?.frameSize) conditions.push(eq(film_variants.frameSize, query.frameSize));

    const result = await this.db
      .select({
        id: photos.id,
        imageUrl: photos.imageUrl,
        format: film_variants.format,
        frameSize: film_variants.frameSize,
      })
      .from(photos)
      .innerJoin(film_variants, eq(photos.filmVariantId, film_variants.id))
      .where(and(...conditions))
      .orderBy(desc(photos.createdAt));

    return result;
  }

  // 3. Get Photo Detail
  async getPhotoById(id: string) {
    const [photo] = await this.db
      .select({
        id: photos.id,
        imageUrl: photos.imageUrl,
        caption: photos.caption,
        cameraUsed: photos.cameraUsed,
        lensUsed: photos.lensUsed,
        createdAt: photos.createdAt,
        userId: users.id,
        username: users.username,
        avatarUrl: users.avatarUrl,
        filmName: films.name,
        filmBrand: films.brand,
        filmSlug: films.slug,
        format: film_variants.format,
        frameSize: film_variants.frameSize,
      })
      .from(photos)
      .innerJoin(users, eq(photos.userId, users.id))
      .innerJoin(film_variants, eq(photos.filmVariantId, film_variants.id))
      .innerJoin(films, eq(film_variants.filmId, films.id))
      .where(and(eq(photos.id, id), isNull(photos.deletedAt)));

    return photo || null;
  }

  // 4. Get User Portfolio
  async getUserPhotos(username: string) {
    const [user] = await this.db.select({ id: users.id }).from(users).where(eq(users.username, username));
    if (!user) throw new Error('NOT_FOUND');

    const result = await this.db
      .select({
        id: photos.id,
        imageUrl: photos.imageUrl,
        filmName: films.name,
        format: film_variants.format,
      })
      .from(photos)
      .innerJoin(film_variants, eq(photos.filmVariantId, film_variants.id))
      .innerJoin(films, eq(film_variants.filmId, films.id))
      .where(and(eq(photos.userId, user.id), isNull(photos.deletedAt)))
      .orderBy(desc(photos.createdAt));

    return result;
  }

  // 5. Soft Delete Photo
  async deletePhoto(photoId: string, userId: string, isAdmin: boolean = false) {
    const [existing] = await this.db.select().from(photos).where(eq(photos.id, photoId));
    if (!existing) throw new Error('NOT_FOUND');
    if (!isAdmin && existing.userId !== userId) throw new Error('FORBIDDEN');

    await this.db.update(photos)
      .set({ deletedAt: new Date() })
      .where(eq(photos.id, photoId));

    // In a real scenario, trigger a background job to delete the image from cloud storage here

    return true;
  }
}
