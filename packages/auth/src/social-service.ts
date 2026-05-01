import { createDatabase, users, follows, reviews, photos, user_lists, likes, comments, notifications, films, film_variants } from '@rolldump/db';
import { eq, and, desc, sql, inArray, unionAll, lt } from 'drizzle-orm';

export class SocialService {
  private db: ReturnType<typeof createDatabase>;

  constructor(databaseUrl: string) {
    this.db = createDatabase(databaseUrl);
  }

  // ── 1. Follow / Unfollow ──
  async toggleFollow(followerId: string, targetUsername: string) {
    const target = await this.db.query.users.findFirst({
      where: eq(users.username, targetUsername),
    });

    if (!target) throw new Error('USER_NOT_FOUND');
    if (target.id === followerId) throw new Error('CANNOT_FOLLOW_SELF');

    console.log(`[DEBUG] SocialService.toggleFollow: followerId=${followerId}, targetUsername=${targetUsername}, targetId=${target.id}`);
    const existing = await this.db.query.follows.findFirst({
      where: and(
        eq(follows.followerId, followerId),
        eq(follows.followingId, target.id)
      ),
    });
    console.log(`[DEBUG] SocialService.toggleFollow: existingFound=${!!existing}`);

    if (existing) {
      await this.db.delete(follows).where(eq(follows.id, existing.id));
      return { status: 'unfollowed', targetId: target.id };
    } else {
      await this.db.insert(follows).values({
        followerId,
        followingId: target.id,
      });
      
      // Notify
      await this.createNotification({
        recipientId: target.id,
        actorId: followerId,
        type: 'new_follower',
      });

      return { status: 'followed', targetId: target.id };
    }
  }

  async getUserStats(targetUserId: string, viewerId?: string) {
    const [followers] = await this.db.select({ count: sql<number>`count(*)` }).from(follows).where(eq(follows.followingId, targetUserId));
    const [following] = await this.db.select({ count: sql<number>`count(*)` }).from(follows).where(eq(follows.followerId, targetUserId));
    
    let isFollowing = false;
    if (viewerId) {
      console.log(`[DEBUG] SocialService.getUserStats: targetUserId=${targetUserId}, viewerId=${viewerId}`);
      const existing = await this.db.query.follows.findFirst({
        where: and(
          eq(follows.followerId, viewerId),
          eq(follows.followingId, targetUserId)
        ),
      });
      isFollowing = !!existing;
      console.log(`[DEBUG] SocialService.getUserStats: isFollowing=${isFollowing}`);
    }

    return {
      followersCount: Number(followers.count),
      followingCount: Number(following.count),
      isFollowing
    };
  }

  // ── 2. Activity Timeline Feed ──
  async getFeed(userId: string, cursor?: string, limit: number = 10) {
    // Get following IDs
    const following = await this.db.query.follows.findMany({
      where: eq(follows.followerId, userId),
    });

    const followingIds = following.map(f => f.followingId);
    if (followingIds.length === 0) return { items: [], nextCursor: null };

    // Activity Union
    // 1. Reviews
    const reviewQuery = this.db.select({
      id: reviews.id,
      type: sql<string>`'review'`,
      userId: reviews.userId,
      createdAt: reviews.createdAt,
      content: reviews.content,
      targetName: films.name,
      targetSlug: films.slug,
      extraInfo: sql<string>`${film_variants.format}`
    })
    .from(reviews)
    .innerJoin(films, eq(reviews.filmId, films.id))
    .leftJoin(film_variants, eq(reviews.filmVariantId, film_variants.id))
    .where(inArray(reviews.userId, followingIds));

    // 2. Photos
    const photoQuery = this.db.select({
      id: photos.id,
      type: sql<string>`'photo'`,
      userId: photos.userId,
      createdAt: photos.createdAt,
      content: photos.caption,
      targetName: films.name,
      targetSlug: films.slug,
      extraInfo: sql<string>`${photos.imageUrl}`
    })
    .from(photos)
    .innerJoin(film_variants, eq(photos.filmVariantId, film_variants.id))
    .innerJoin(films, eq(film_variants.filmId, films.id))
    .where(inArray(photos.userId, followingIds));

    // 3. Lists
    const listQuery = this.db.select({
      id: user_lists.id,
      type: sql<string>`'list'`,
      userId: user_lists.userId,
      createdAt: user_lists.createdAt,
      content: user_lists.description,
      targetName: user_lists.title,
      targetSlug: user_lists.slug,
      extraInfo: sql<string>`null`
    })
    .from(user_lists)
    .where(and(
      inArray(user_lists.userId, followingIds),
      eq(user_lists.isPublic, 1)
    ));

    // Union and Sort
    let baseQuery = unionAll(reviewQuery, photoQuery, listQuery);
    
    // Pagination logic
    const results = await this.db.select()
      .from(baseQuery.as('feed'))
      .orderBy(desc(sql`created_at`))
      .limit(limit + 1)
      .where(cursor ? lt(sql`created_at`, new Date(cursor)) : undefined);

    const hasNextPage = results.length > limit;
    const items = hasNextPage ? results.slice(0, -1) : results;
    const nextCursor = hasNextPage ? items[items.length - 1].createdAt.toISOString() : null;

    // Enhance with user data
    const enhancedItems = await Promise.all(items.map(async (item) => {
      const user = await this.db.query.users.findFirst({
        where: eq(users.id, item.userId),
        columns: { username: true, avatarUrl: true }
      });
      return { ...item, user };
    }));

    return { items: enhancedItems, nextCursor };
  }

  // ── 3. Likes ──
  async toggleLike(userId: string, targetId: string, targetType: string) {
    const existing = await this.db.query.likes.findFirst({
      where: and(
        eq(likes.userId, userId),
        eq(likes.targetId, targetId),
        eq(likes.targetType, targetType)
      ),
    });

    if (existing) {
      await this.db.delete(likes).where(eq(likes.id, existing.id));
      return { status: 'unliked' };
    } else {
      await this.db.insert(likes).values({ userId, targetId, targetType });
      
      // Determine recipient for notification
      let recipientId: string | null = null;
      if (targetType === 'review') {
        const r = await this.db.query.reviews.findFirst({ where: eq(reviews.id, targetId) });
        recipientId = r?.userId || null;
      } else if (targetType === 'photo') {
        const p = await this.db.query.photos.findFirst({ where: eq(photos.id, targetId) });
        recipientId = p?.userId || null;
      } else if (targetType === 'list') {
        const l = await this.db.query.user_lists.findFirst({ where: eq(user_lists.id, targetId) });
        recipientId = l?.userId || null;
      }

      if (recipientId && recipientId !== userId) {
        await this.createNotification({
          recipientId,
          actorId: userId,
          type: 'new_like',
          targetId,
          targetType
        });
      }

      return { status: 'liked' };
    }
  }

  // ── 4. Comments ──
  private lastCommentTime: Map<string, number> = new Map();

  async addComment(userId: string, targetId: string, targetType: string, content: string) {
    if (content.length > 500) throw new Error('COMMENT_TOO_LONG');
    
    // Rate limit: 1 comment per 10 seconds per user
    const now = Date.now();
    const lastTime = this.lastCommentTime.get(userId) || 0;
    if (now - lastTime < 10000) {
      throw new Error('RATE_LIMIT_EXCEEDED');
    }
    this.lastCommentTime.set(userId, now);

    const [comment] = await this.db.insert(comments).values({
      userId,
      targetId,
      targetType,
      content,
    }).returning();

    // Determine recipient for notification
    let recipientId: string | null = null;
    if (targetType === 'review') {
      const r = await this.db.query.reviews.findFirst({ where: eq(reviews.id, targetId) });
      recipientId = r?.userId || null;
    } else if (targetType === 'photo') {
      const p = await this.db.query.photos.findFirst({ where: eq(photos.id, targetId) });
      recipientId = p?.userId || null;
    }

    if (recipientId && recipientId !== userId) {
      await this.createNotification({
        recipientId,
        actorId: userId,
        type: 'new_comment',
        targetId: comment.id,
        targetType
      });
    }

    return comment;
  }

  async getComments(targetId: string, targetType: string) {
    const results = await this.db.select({
      id: comments.id,
      content: comments.content,
      createdAt: comments.createdAt,
      user: {
        username: users.username,
        avatarUrl: users.avatarUrl
      }
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(and(
      eq(comments.targetId, targetId),
      eq(comments.targetType, targetType)
    ))
    .orderBy(desc(comments.createdAt));

    return results;
  }

  // ── 5. Notifications ──
  async getNotifications(userId: string) {
    return await this.db.select({
      id: notifications.id,
      type: notifications.type,
      isRead: notifications.isRead,
      createdAt: notifications.createdAt,
      actor: {
        username: users.username,
        avatarUrl: users.avatarUrl
      },
      targetId: notifications.targetId,
      targetType: notifications.targetType
    })
    .from(notifications)
    .innerJoin(users, eq(notifications.actorId, users.id))
    .where(eq(notifications.recipientId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(20);
  }

  async markNotificationRead(notificationId: string, userId: string) {
    await this.db.update(notifications)
      .set({ isRead: 1 })
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.recipientId, userId)
      ));
  }

  private async createNotification(data: {
    recipientId: string;
    actorId: string;
    type: string;
    targetId?: string;
    targetType?: string;
  }) {
    // In a real app, this could be sent to a queue
    await this.db.insert(notifications).values({
      ...data,
      isRead: 0
    });
  }
}
