import { createDatabase, user_lists, list_items, films, film_variants, users } from '@rolldump/db';
import { eq, and, desc, sql, or } from 'drizzle-orm';

export class ListService {
  private db: ReturnType<typeof createDatabase>;

  constructor(databaseUrl: string) {
    this.db = createDatabase(databaseUrl);
  }

  private generateSlug(title: string): string {
    const base = title
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
    const random = Math.random().toString(36).substring(2, 7);
    return `${base}-${random}`;
  }

  // 1. Create List
  async createList(userId: string, data: { title: string; description?: string; isPublic?: boolean }) {
    const slug = this.generateSlug(data.title);
    
    const [list] = await this.db.insert(user_lists).values({
      userId,
      title: data.title,
      slug,
      description: data.description || null,
      isPublic: data.isPublic === false ? 0 : 1,
    }).returning();

    return list;
  }

  // 2. Add Item to List
  async addItemToList(listId: string, userId: string, data: { filmVariantId: string; personalNote?: string }) {
    // Verify ownership
    const [list] = await this.db.select().from(user_lists).where(eq(user_lists.id, listId));
    if (!list) throw new Error('NOT_FOUND');
    if (list.userId !== userId) throw new Error('FORBIDDEN');

    // Check duplication
    const [existing] = await this.db
      .select()
      .from(list_items)
      .where(and(eq(list_items.listId, listId), eq(list_items.filmVariantId, data.filmVariantId)));
    
    if (existing) throw new Error('CONFLICT');

    const [item] = await this.db.insert(list_items).values({
      listId,
      filmVariantId: data.filmVariantId,
      personalNote: data.personalNote || null,
    }).returning();

    return item;
  }

  // 3. Remove Item from List
  async removeItemFromList(listId: string, itemId: string, userId: string) {
     // Verify list ownership
     const [list] = await this.db.select().from(user_lists).where(eq(user_lists.id, listId));
     if (!list) throw new Error('NOT_FOUND');
     if (list.userId !== userId) throw new Error('FORBIDDEN');

     await this.db.delete(list_items).where(and(eq(list_items.id, itemId), eq(list_items.listId, listId)));
     return true;
  }

  // 4. Get List Detail (by Slug)
  async getListBySlug(slug: string, currentUserId?: string) {
    const [list] = await this.db
      .select({
        id: user_lists.id,
        title: user_lists.title,
        description: user_lists.description,
        isPublic: user_lists.isPublic,
        createdAt: user_lists.createdAt,
        userId: users.id,
        username: users.username,
        avatarUrl: users.avatarUrl,
      })
      .from(user_lists)
      .innerJoin(users, eq(user_lists.userId, users.id))
      .where(eq(user_lists.slug, slug));

    if (!list) throw new Error('NOT_FOUND');

    // Privacy check
    if (list.isPublic === 0 && list.userId !== currentUserId) {
      throw new Error('FORBIDDEN');
    }

    // Get items
    const items = await this.db
      .select({
        id: list_items.id,
        personalNote: list_items.personalNote,
        variantId: film_variants.id,
        format: film_variants.format,
        frameSize: film_variants.frameSize,
        filmName: films.name,
        filmBrand: films.brand,
        filmSlug: films.slug,
        imageUrl: films.imageUrl,
      })
      .from(list_items)
      .innerJoin(film_variants, eq(list_items.filmVariantId, film_variants.id))
      .innerJoin(films, eq(film_variants.filmId, films.id))
      .where(eq(list_items.listId, list.id))
      .orderBy(desc(list_items.createdAt));

    return { ...list, items };
  }

  // 5. Get User Lists
  async getUserLists(userId: string, includePrivate: boolean = false) {
    let conditions = [eq(user_lists.userId, userId)];
    if (!includePrivate) {
      conditions.push(eq(user_lists.isPublic, 1));
    }

    return await this.db
      .select({
        id: user_lists.id,
        title: user_lists.title,
        slug: user_lists.slug,
        description: user_lists.description,
        isPublic: user_lists.isPublic,
        itemCount: sql<number>`count(${list_items.id})::int`,
      })
      .from(user_lists)
      .leftJoin(list_items, eq(user_lists.id, list_items.listId))
      .where(and(...conditions))
      .groupBy(user_lists.id)
      .orderBy(desc(user_lists.createdAt));
  }

  // 6. Explore Lists
  async getExploreLists() {
    // Simple implementation: recent public lists with preview images
    return await this.db
      .select({
        id: user_lists.id,
        title: user_lists.title,
        slug: user_lists.slug,
        username: users.username,
        itemCount: sql<number>`count(${list_items.id})::int`,
      })
      .from(user_lists)
      .innerJoin(users, eq(user_lists.userId, users.id))
      .leftJoin(list_items, eq(user_lists.id, list_items.listId))
      .where(eq(user_lists.isPublic, 1))
      .groupBy(user_lists.id, users.username)
      .having(sql`count(${list_items.id}) > 0`)
      .orderBy(desc(user_lists.createdAt))
      .limit(20);
  }

  // Helper for Modal: check if a variant is in any of user's lists
  async checkVariantInLists(userId: string, filmVariantId: string) {
    const results = await this.db
      .select({ listId: user_lists.id })
      .from(user_lists)
      .innerJoin(list_items, eq(user_lists.id, list_items.listId))
      .where(and(eq(user_lists.userId, userId), eq(list_items.filmVariantId, filmVariantId)));
    
    return results.map(r => r.listId);
  }
  // 7. Update List Privacy
  async updateListPrivacy(listId: string, userId: string, isPublic: number) {
    const [list] = await this.db.select().from(user_lists).where(eq(user_lists.id, listId));
    if (!list) throw new Error('NOT_FOUND');
    if (list.userId !== userId) throw new Error('FORBIDDEN');

    await this.db.update(user_lists).set({ isPublic }).where(eq(user_lists.id, listId));
    return true;
  }
}
