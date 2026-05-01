import {
  pgTable,
  text,
  timestamp,
  varchar,
  uuid,
  integer,
  boolean,
  jsonb,
  primaryKey,
  real,
  serial,
  index,
  unique,
} from 'drizzle-orm/pg-core';

// ============== USERS & AUTH ==============

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  password: text('password').notNull(),
  fullName: varchar('full_name', { length: 255 }),
  bio: varchar('bio', { length: 280 }),
  avatarUrl: text('avatar_url'),
  bannerUrl: text('banner_url'),
  location: varchar('location', { length: 60 }),
  websiteUrl: text('website_url'),
  instagramHandle: varchar('instagram_handle', { length: 50 }),
  role: varchar('role', { length: 50 }).notNull().default('user'),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  emailVerifiedAt: timestamp('email_verified_at'),
  twoFactorEnabled: boolean('two_factor_enabled').notNull().default(false),
  totpSecret: text('totp_secret'),
  onboardingCompletedAt: timestamp('onboarding_completed_at'),
  followersCount: integer('followers_count').notNull().default(0),
  followingCount: integer('following_count').notNull().default(0),
  lastLoginAt: timestamp('last_login_at'),
  lastLoginIp: varchar('last_login_ip', { length: 64 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const userSessions = pgTable('user_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  refreshToken: text('refresh_token').notNull().unique(),
  userAgent: text('user_agent'),
  ip: varchar('ip', { length: 64 }),
  location: varchar('location', { length: 100 }),
  expiresAt: timestamp('expires_at').notNull(),
  revokedAt: timestamp('revoked_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const emailVerifications = pgTable('email_verifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const passwordResets = pgTable('password_resets', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const userPreferences = pgTable('user_preferences', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  formatPreferences: jsonb('format_preferences').$type<string[]>().default([]),
  colorPreferences: jsonb('color_preferences').$type<string[]>().default([]),
  isoMin: integer('iso_min').default(25),
  isoMax: integer('iso_max').default(3200),
  primaryCameraId: uuid('primary_camera_id'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const privacySettings = pgTable('privacy_settings', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  profileVisibility: varchar('profile_visibility', { length: 20 }).notNull().default('public'),
  allowMentionsFrom: varchar('allow_mentions_from', { length: 20 }).notNull().default('everyone'),
  showEmail: boolean('show_email').notNull().default(false),
  showLocation: boolean('show_location').notNull().default(true),
});

export const notificationPreferences = pgTable('notification_preferences', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  inAppEnabled: jsonb('in_app_enabled').$type<Record<string, boolean>>().default({}),
  emailEnabled: jsonb('email_enabled').$type<Record<string, boolean>>().default({}),
  pushEnabled: jsonb('push_enabled').$type<Record<string, boolean>>().default({}),
  digestFrequency: varchar('digest_frequency', { length: 10 }).notNull().default('weekly'),
});

// ============== BRANDS, FILMS, VARIANTS ==============

export const brands = pgTable('brands', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  logoUrl: text('logo_url'),
  country: varchar('country', { length: 60 }),
  foundedYear: integer('founded_year'),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const films = pgTable('films', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: varchar('slug', { length: 150 }).notNull().unique(),
  name: varchar('name', { length: 150 }).notNull(),
  brandId: uuid('brand_id').references(() => brands.id),
  description: text('description'),
  coverUrl: text('cover_url'),
  datasheetUrl: text('datasheet_url'),
  iso: integer('iso'),
  colorType: varchar('color_type', { length: 30 }), // color_negative, slide_e6, bw, color_positive
  countryOfOrigin: varchar('country_of_origin', { length: 60 }),
  yearIntroduced: integer('year_introduced'),
  yearDiscontinued: integer('year_discontinued'),
  status: varchar('status', { length: 20 }).notNull().default('active'), // active|discontinued|out_of_stock
  isActive: boolean('is_active').notNull().default(true),
  ratingAvg: real('rating_avg').notNull().default(0),
  reviewCount: integer('review_count').notNull().default(0),
  photoCount: integer('photo_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const filmVariants = pgTable('film_variants', {
  id: uuid('id').defaultRandom().primaryKey(),
  filmId: uuid('film_id').notNull().references(() => films.id, { onDelete: 'cascade' }),
  format: varchar('format', { length: 20 }).notNull(), // 35mm | 120 | large_format | instant | 110 | half_frame
  exposures: integer('exposures'),
  frameSize: varchar('frame_size', { length: 20 }),
  emulsionLayers: text('emulsion_layers'),
  pushPullRange: varchar('push_pull_range', { length: 30 }),
  dxCoded: boolean('dx_coded'),
  msrpUsd: real('msrp_usd'),
  available: boolean('available').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const wishlists = pgTable('wishlists', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  filmVariantId: uuid('film_variant_id').notNull().references(() => filmVariants.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.filmVariantId] }),
}));

// ============== EQUIPMENT REGISTRY ==============

export const cameras = pgTable('cameras', {
  id: uuid('id').defaultRandom().primaryKey(),
  brand: varchar('brand', { length: 100 }).notNull(),
  model: varchar('model', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 200 }).notNull().unique(),
  type: varchar('type', { length: 30 }), // rangefinder|slr|tlr|point_shoot|medium_format|large_format|instant
  formatsSupported: jsonb('formats_supported').$type<string[]>().default([]),
  yearIntroduced: integer('year_introduced'),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const lenses = pgTable('lenses', {
  id: uuid('id').defaultRandom().primaryKey(),
  brand: varchar('brand', { length: 100 }).notNull(),
  model: varchar('model', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 200 }).notNull().unique(),
  mount: varchar('mount', { length: 50 }),
  focalLengthMm: integer('focal_length_mm'),
  maxAperture: real('max_aperture'),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ============== REVIEWS ==============

export const reviews = pgTable('reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  filmId: uuid('film_id').notNull().references(() => films.id, { onDelete: 'cascade' }),
  filmVariantId: uuid('film_variant_id').references(() => filmVariants.id),
  ratingOverall: real('rating_overall').notNull(),
  ratingColor: real('rating_color'),
  ratingGrain: real('rating_grain'),
  ratingSharpness: real('rating_sharpness'),
  content: text('content').notNull(),
  cameraId: uuid('camera_id').references(() => cameras.id),
  lensId: uuid('lens_id').references(() => lenses.id),
  cameraText: varchar('camera_text', { length: 100 }),
  lensText: varchar('lens_text', { length: 100 }),
  labDevelopedAt: varchar('lab_developed_at', { length: 100 }),
  scanMethod: varchar('scan_method', { length: 20 }),
  pushPullStops: integer('push_pull_stops').default(0),
  shootingConditions: varchar('shooting_conditions', { length: 30 }),
  helpfulCount: integer('helpful_count').notNull().default(0),
  status: varchar('status', { length: 20 }).notNull().default('published'),
  edited: boolean('edited').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const reviewHelpfulMarks = pgTable('review_helpful_marks', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  reviewId: uuid('review_id').notNull().references(() => reviews.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.reviewId] }),
}));

// ============== PHOTOS & ROLLS ==============

export const rolls = pgTable('rolls', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  filmVariantId: uuid('film_variant_id').references(() => filmVariants.id),
  title: varchar('title', { length: 150 }),
  description: text('description'),
  labName: varchar('lab_name', { length: 100 }),
  developedAt: timestamp('developed_at'),
  scanDate: timestamp('scan_date'),
  photoCount: integer('photo_count').notNull().default(0),
  coverPhotoId: uuid('cover_photo_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const photos = pgTable('photos', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  filmId: uuid('film_id').references(() => films.id),
  filmVariantId: uuid('film_variant_id').references(() => filmVariants.id),
  rollId: uuid('roll_id').references(() => rolls.id, { onDelete: 'set null' }),
  cameraId: uuid('camera_id').references(() => cameras.id),
  lensId: uuid('lens_id').references(() => lenses.id),
  imageUrl: text('image_url').notNull(),
  thumbUrl: text('thumb_url'),
  caption: varchar('caption', { length: 500 }),
  frameNumber: integer('frame_number'),
  frameSize: varchar('frame_size', { length: 20 }),
  pushPullStops: integer('push_pull_stops').default(0),
  shootingConditions: varchar('shooting_conditions', { length: 30 }),
  shotAtDate: timestamp('shot_at_date'),
  location: varchar('location', { length: 200 }),
  exif: jsonb('exif').$type<Record<string, any>>(),
  width: integer('width'),
  height: integer('height'),
  viewCount: integer('view_count').notNull().default(0),
  status: varchar('status', { length: 20 }).notNull().default('published'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

// ============== TIPS ==============

export const filmTips = pgTable('film_tips', {
  id: uuid('id').defaultRandom().primaryKey(),
  filmId: uuid('film_id').notNull().references(() => films.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 150 }).notNull(),
  content: text('content').notNull(),
  targetFormat: varchar('target_format', { length: 20 }).notNull().default('all'),
  category: varchar('category', { length: 30 }).notNull().default('general'),
  netScore: integer('net_score').notNull().default(0),
  viewCount: integer('view_count').notNull().default(0),
  status: varchar('status', { length: 20 }).notNull().default('published'),
  edited: boolean('edited').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const tipVotes = pgTable('tip_votes', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tipId: uuid('tip_id').notNull().references(() => filmTips.id, { onDelete: 'cascade' }),
  voteType: integer('vote_type').notNull(), // 1, -1
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.tipId] }),
}));

// ============== LISTS ==============

export const userLists = pgTable('user_lists', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  slug: varchar('slug', { length: 200 }).notNull(),
  title: varchar('title', { length: 100 }).notNull(),
  description: text('description'),
  coverImageUrl: text('cover_image_url'),
  isPublic: boolean('is_public').notNull().default(true),
  isFeatured: boolean('is_featured').notNull().default(false),
  itemCount: integer('item_count').notNull().default(0),
  likeCount: integer('like_count').notNull().default(0),
  saveCount: integer('save_count').notNull().default(0),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const listItems = pgTable('list_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  listId: uuid('list_id').notNull().references(() => userLists.id, { onDelete: 'cascade' }),
  filmVariantId: uuid('film_variant_id').notNull().references(() => filmVariants.id, { onDelete: 'cascade' }),
  personalNote: varchar('personal_note', { length: 280 }),
  position: integer('position').notNull().default(0),
  addedAt: timestamp('added_at').notNull().defaultNow(),
}, (t) => ({
  uniq: unique().on(t.listId, t.filmVariantId),
}));

export const listLikes = pgTable('list_likes', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  listId: uuid('list_id').notNull().references(() => userLists.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => ({ pk: primaryKey({ columns: [t.userId, t.listId] }) }));

export const listSaves = pgTable('list_saves', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  listId: uuid('list_id').notNull().references(() => userLists.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => ({ pk: primaryKey({ columns: [t.userId, t.listId] }) }));

// ============== SOCIAL: FOLLOWS, BLOCKS, LIKES, COMMENTS ==============

export const follows = pgTable('follows', {
  followerId: uuid('follower_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  followingId: uuid('following_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => ({ pk: primaryKey({ columns: [t.followerId, t.followingId] }) }));

export const userBlocks = pgTable('user_blocks', {
  blockerId: uuid('blocker_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  blockedId: uuid('blocked_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => ({ pk: primaryKey({ columns: [t.blockerId, t.blockedId] }) }));

export const likes = pgTable('likes', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  likeableId: uuid('likeable_id').notNull(),
  likeableType: varchar('likeable_type', { length: 20 }).notNull(), // photo|review|list|tip
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => ({ pk: primaryKey({ columns: [t.userId, t.likeableId, t.likeableType] }) }));

export const comments = pgTable('comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  commentableId: uuid('commentable_id').notNull(),
  commentableType: varchar('commentable_type', { length: 20 }).notNull(),
  parentId: uuid('parent_id'),
  content: text('content').notNull(),
  edited: boolean('edited').notNull().default(false),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ============== NOTIFICATIONS ==============

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  recipientId: uuid('recipient_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  actorId: uuid('actor_id').references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 40 }).notNull(),
  notifiableId: uuid('notifiable_id'),
  notifiableType: varchar('notifiable_type', { length: 20 }),
  payload: jsonb('payload').$type<Record<string, any>>(),
  isRead: boolean('is_read').notNull().default(false),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ============== REPORTS / MODERATION ==============

export const reports = pgTable('reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  reporterId: uuid('reporter_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  reportableId: uuid('reportable_id').notNull(),
  reportableType: varchar('reportable_type', { length: 20 }).notNull(), // review|tip|photo|comment|user
  reason: varchar('reason', { length: 30 }).notNull(),
  detail: text('detail'),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  resolvedById: uuid('resolved_by_id'),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const userModerationActions = pgTable('user_moderation_actions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  moderatorId: uuid('moderator_id').references(() => users.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 20 }).notNull(),
  reason: text('reason'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ============== ADMIN: AUDIT, FEATURE FLAGS, ANNOUNCEMENTS ==============

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
  actorRole: varchar('actor_role', { length: 30 }),
  action: varchar('action', { length: 80 }).notNull(),
  resourceType: varchar('resource_type', { length: 40 }),
  resourceId: text('resource_id'),
  ip: varchar('ip', { length: 64 }),
  userAgent: text('user_agent'),
  before: jsonb('before').$type<Record<string, any>>(),
  after: jsonb('after').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const featureFlags = pgTable('feature_flags', {
  key: varchar('key', { length: 100 }).primaryKey(),
  value: jsonb('value'),
  description: text('description'),
  rolloutPercentage: integer('rollout_percentage').notNull().default(0),
  isEnabled: boolean('is_enabled').notNull().default(false),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const announcements = pgTable('announcements', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  body: text('body').notNull(),
  audience: jsonb('audience').$type<Record<string, any>>(),
  channels: jsonb('channels').$type<string[]>(),
  status: varchar('status', { length: 20 }).notNull().default('draft'),
  scheduledAt: timestamp('scheduled_at'),
  sentAt: timestamp('sent_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ============== ACHIEVEMENTS ==============

export const achievements = pgTable('achievements', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: varchar('key', { length: 80 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  iconUrl: text('icon_url'),
  criteria: jsonb('criteria').$type<Record<string, any>>(),
  points: integer('points').notNull().default(0),
});

export const userAchievements = pgTable('user_achievements', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  achievementId: uuid('achievement_id').notNull().references(() => achievements.id, { onDelete: 'cascade' }),
  unlockedAt: timestamp('unlocked_at').notNull().defaultNow(),
}, (t) => ({ pk: primaryKey({ columns: [t.userId, t.achievementId] }) }));

// ============== INVITES & SAVED FILTERS ==============

export const invites = pgTable('invites', {
  id: uuid('id').defaultRandom().primaryKey(),
  inviterId: uuid('inviter_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  code: varchar('code', { length: 20 }).notNull().unique(),
  inviteeUserId: uuid('invitee_user_id').references(() => users.id, { onDelete: 'set null' }),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const savedFilters = pgTable('saved_filters', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  filters: jsonb('filters').$type<Record<string, any>>().notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Backwards-compat export aliases used in existing code
export const user_sessions = userSessions;
