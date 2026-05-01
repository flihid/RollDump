import { pgTable, text, timestamp, varchar, uuid, jsonb, integer, uniqueIndex, numeric } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  password: text('password').notNull(),
  fullName: varchar('full_name', { length: 255 }),
  role: varchar('role', { length: 50 }).notNull().default('user'),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  avatarUrl: text('avatar_url'),
  bio: text('bio'),
  formatPreferences: jsonb('format_preferences'),
});

export const password_reset_tokens = pgTable('password_reset_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
});

export const user_sessions = pgTable('user_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  refreshToken: text('refresh_token').notNull().unique(),
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
});

// ── EPIC02: Film Roll Catalog ──

export const films = pgTable('films', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  brand: varchar('brand', { length: 100 }).notNull(),
  iso: integer('iso').notNull(),
  type: varchar('type', { length: 20 }).notNull(), // 'color' | 'bw'
  description: text('description'),
  imageUrl: text('image_url'),
  datasheetUrl: text('datasheet_url'), // ── EPIC05: Official Datasheet ──
  avgRating: numeric('avg_rating', { precision: 3, scale: 2 }),  // cached average rating
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const film_variants = pgTable('film_variants', {
  id: uuid('id').defaultRandom().primaryKey(),
  filmId: uuid('film_id').notNull().references(() => films.id, { onDelete: 'cascade' }),
  format: varchar('format', { length: 30 }).notNull(), // '35mm' | '120' | 'large_format'
  frameSize: varchar('frame_size', { length: 20 }),     // '24x36', '6x6', '6x7', '4x5', etc.
  exposures: integer('exposures'),                       // 36, 12, 10, etc.
});

// ── EPIC03: Review & Rating System ──

export const reviews = pgTable('reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  filmId: uuid('film_id').notNull().references(() => films.id, { onDelete: 'cascade' }),
  filmVariantId: uuid('film_variant_id').references(() => film_variants.id, { onDelete: 'set null' }),
  rating: integer('rating').notNull(),          // 1-5
  content: text('content'),                      // review text (min 20 chars enforced at API level)
  cameraUsed: varchar('camera_used', { length: 100 }),
  editedAt: timestamp('edited_at', { mode: 'date' }),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),  // soft delete
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const review_upvotes = pgTable('review_upvotes', {
  id: uuid('id').defaultRandom().primaryKey(),
  reviewId: uuid('review_id').notNull().references(() => reviews.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  uniqueReviewUser: uniqueIndex('unique_review_user').on(table.reviewId, table.userId),
}));

export const wishlists = pgTable('wishlists', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  filmVariantId: uuid('film_variant_id').notNull().references(() => film_variants.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  uniqueUserVariant: uniqueIndex('unique_user_variant').on(table.userId, table.filmVariantId),
}));

// ── EPIC04: Photo Upload & Gallery ──

export const photos = pgTable('photos', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  filmVariantId: uuid('film_variant_id').notNull().references(() => film_variants.id, { onDelete: 'cascade' }),
  imageUrl: text('image_url').notNull(),
  caption: text('caption'),
  cameraUsed: varchar('camera_used', { length: 100 }),
  lensUsed: varchar('lens_used', { length: 100 }),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// ── EPIC05: Tips & Guide System ──

export const film_tips = pgTable('film_tips', {
  id: uuid('id').defaultRandom().primaryKey(),
  filmId: uuid('film_id').notNull().references(() => films.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 100 }).notNull(),
  content: text('content').notNull(), // Markdown support
  targetFormat: varchar('target_format', { length: 20 }).notNull(), // 'All' | '35mm' | '120' | 'Large_Format'
  netScore: integer('net_score').default(0).notNull(), // cached net votes
  isHidden: integer('is_hidden').default(0).notNull(), // 1 for true, 0 for false
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }),
});

export const tip_votes = pgTable('tip_votes', {
  id: uuid('id').defaultRandom().primaryKey(),
  tipId: uuid('tip_id').notNull().references(() => film_tips.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  voteType: integer('vote_type').notNull(), // 1 for upvote, -1 for downvote
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  uniqueTipUser: uniqueIndex('unique_tip_user').on(table.tipId, table.userId),
}));

export const reports = pgTable('reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  tipId: uuid('tip_id').notNull().references(() => film_tips.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  reason: varchar('reason', { length: 50 }).notNull(), // 'Spam' | 'Misinformation' | 'Harmful'
  description: text('description'),
  status: varchar('status', { length: 20 }).default('pending').notNull(), // 'pending' | 'reviewed'
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// ── EPIC06: List & Collection ──

export const user_lists = pgTable('user_lists', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 60 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  isPublic: integer('is_public').default(1).notNull(), // 1 for true, 0 for false
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }),
});

export const list_items = pgTable('list_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  listId: uuid('list_id').notNull().references(() => user_lists.id, { onDelete: 'cascade' }),
  filmVariantId: uuid('film_variant_id').notNull().references(() => film_variants.id, { onDelete: 'cascade' }),
  personalNote: text('personal_note'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }),
}, (table) => ({
  uniqueListVariant: uniqueIndex('unique_list_variant').on(table.listId, table.filmVariantId),
}));

// ── EPIC08: Social Interaction ──

export const follows = pgTable('follows', {
  id: uuid('id').defaultRandom().primaryKey(),
  followerId: uuid('follower_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  followingId: uuid('following_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  uniqueFollow: uniqueIndex('unique_follow').on(table.followerId, table.followingId),
}));

export const likes = pgTable('likes', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  targetId: uuid('target_id').notNull(),
  targetType: varchar('target_type', { length: 20 }).notNull(), // 'photo', 'review', 'list'
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  uniqueLike: uniqueIndex('unique_like').on(table.userId, table.targetId, table.targetType),
}));

export const comments = pgTable('comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  targetId: uuid('target_id').notNull(),
  targetType: varchar('target_type', { length: 20 }).notNull(), // 'photo', 'review'
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  recipientId: uuid('recipient_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  actorId: uuid('actor_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(), // 'new_follower', 'new_like', 'new_comment'
  targetId: uuid('target_id'), // the related entity ID
  targetType: varchar('target_type', { length: 20 }),
  isRead: integer('is_read').default(0).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});
