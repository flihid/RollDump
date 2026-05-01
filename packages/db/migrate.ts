import postgres from 'postgres';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: resolve(__dirname, '../../apps/api/.dev.vars') });

const SQL = `
-- Drop tables that may exist from previous experiments (preserve users + user_sessions)
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS invites CASCADE;
DROP TABLE IF EXISTS saved_filters CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS feature_flags CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS user_moderation_actions CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS user_blocks CASCADE;
DROP TABLE IF EXISTS follows CASCADE;
DROP TABLE IF EXISTS list_saves CASCADE;
DROP TABLE IF EXISTS list_likes CASCADE;
DROP TABLE IF EXISTS list_items CASCADE;
DROP TABLE IF EXISTS user_lists CASCADE;
DROP TABLE IF EXISTS tip_votes CASCADE;
DROP TABLE IF EXISTS film_tips CASCADE;
DROP TABLE IF EXISTS review_helpful_marks CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS photos CASCADE;
DROP TABLE IF EXISTS rolls CASCADE;
DROP TABLE IF EXISTS wishlists CASCADE;
DROP TABLE IF EXISTS film_variants CASCADE;
DROP TABLE IF EXISTS films CASCADE;
DROP TABLE IF EXISTS brands CASCADE;
DROP TABLE IF EXISTS lenses CASCADE;
DROP TABLE IF EXISTS cameras CASCADE;
DROP TABLE IF EXISTS notification_preferences CASCADE;
DROP TABLE IF EXISTS privacy_settings CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS password_resets CASCADE;
DROP TABLE IF EXISTS email_verifications CASCADE;

CREATE TABLE IF NOT EXISTS users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email varchar(255) NOT NULL UNIQUE,
  username varchar(50) NOT NULL UNIQUE,
  password text NOT NULL,
  full_name varchar(255),
  bio varchar(280),
  avatar_url text,
  banner_url text,
  location varchar(60),
  website_url text,
  instagram_handle varchar(50),
  role varchar(50) NOT NULL DEFAULT 'user',
  status varchar(20) NOT NULL DEFAULT 'active',
  email_verified_at timestamp,
  two_factor_enabled boolean NOT NULL DEFAULT false,
  totp_secret text,
  onboarding_completed_at timestamp,
  followers_count integer NOT NULL DEFAULT 0,
  following_count integer NOT NULL DEFAULT 0,
  last_login_at timestamp,
  last_login_ip varchar(64),
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  deleted_at timestamp
);

DO $$ BEGIN
  ALTER TABLE users ADD COLUMN IF NOT EXISTS bio varchar(280);
  ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url text;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS banner_url text;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS location varchar(60);
  ALTER TABLE users ADD COLUMN IF NOT EXISTS website_url text;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS instagram_handle varchar(50);
  ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at timestamp;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled boolean NOT NULL DEFAULT false;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_secret text;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamp;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS followers_count integer NOT NULL DEFAULT 0;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS following_count integer NOT NULL DEFAULT 0;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at timestamp;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_ip varchar(64);
  ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at timestamp NOT NULL DEFAULT now();
  ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at timestamp NOT NULL DEFAULT now();
  ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at timestamp;
EXCEPTION WHEN others THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token text NOT NULL UNIQUE,
  user_agent text,
  ip varchar(64),
  location varchar(100),
  expires_at timestamp NOT NULL,
  revoked_at timestamp,
  created_at timestamp NOT NULL DEFAULT now()
);
DO $$ BEGIN
  ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS user_agent text;
  ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS ip varchar(64);
  ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS location varchar(100);
  ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS revoked_at timestamp;
  ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS created_at timestamp NOT NULL DEFAULT now();
EXCEPTION WHEN others THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS email_verifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  expires_at timestamp NOT NULL,
  used_at timestamp,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS password_resets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  expires_at timestamp NOT NULL,
  used_at timestamp,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  format_preferences jsonb DEFAULT '[]'::jsonb,
  color_preferences jsonb DEFAULT '[]'::jsonb,
  iso_min integer DEFAULT 25,
  iso_max integer DEFAULT 3200,
  primary_camera_id uuid,
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS privacy_settings (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  profile_visibility varchar(20) NOT NULL DEFAULT 'public',
  allow_mentions_from varchar(20) NOT NULL DEFAULT 'everyone',
  show_email boolean NOT NULL DEFAULT false,
  show_location boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  in_app_enabled jsonb DEFAULT '{}'::jsonb,
  email_enabled jsonb DEFAULT '{}'::jsonb,
  push_enabled jsonb DEFAULT '{}'::jsonb,
  digest_frequency varchar(10) NOT NULL DEFAULT 'weekly'
);

CREATE TABLE IF NOT EXISTS brands (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug varchar(100) NOT NULL UNIQUE,
  name varchar(100) NOT NULL,
  logo_url text,
  country varchar(60),
  founded_year integer,
  description text,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS films (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug varchar(150) NOT NULL UNIQUE,
  name varchar(150) NOT NULL,
  brand_id uuid REFERENCES brands(id),
  description text,
  cover_url text,
  datasheet_url text,
  iso integer,
  color_type varchar(30),
  country_of_origin varchar(60),
  year_introduced integer,
  year_discontinued integer,
  status varchar(20) NOT NULL DEFAULT 'active',
  is_active boolean NOT NULL DEFAULT true,
  rating_avg real NOT NULL DEFAULT 0,
  review_count integer NOT NULL DEFAULT 0,
  photo_count integer NOT NULL DEFAULT 0,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS film_variants (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  film_id uuid NOT NULL REFERENCES films(id) ON DELETE CASCADE,
  format varchar(20) NOT NULL,
  exposures integer,
  frame_size varchar(20),
  emulsion_layers text,
  push_pull_range varchar(30),
  dx_coded boolean,
  msrp_usd real,
  available boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wishlists (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  film_variant_id uuid NOT NULL REFERENCES film_variants(id) ON DELETE CASCADE,
  created_at timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, film_variant_id)
);

CREATE TABLE IF NOT EXISTS cameras (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  brand varchar(100) NOT NULL,
  model varchar(100) NOT NULL,
  slug varchar(200) NOT NULL UNIQUE,
  type varchar(30),
  formats_supported jsonb DEFAULT '[]'::jsonb,
  year_introduced integer,
  image_url text,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lenses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  brand varchar(100) NOT NULL,
  model varchar(100) NOT NULL,
  slug varchar(200) NOT NULL UNIQUE,
  mount varchar(50),
  focal_length_mm integer,
  max_aperture real,
  image_url text,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  film_id uuid NOT NULL REFERENCES films(id) ON DELETE CASCADE,
  film_variant_id uuid REFERENCES film_variants(id),
  rating_overall real NOT NULL,
  rating_color real,
  rating_grain real,
  rating_sharpness real,
  content text NOT NULL,
  camera_id uuid REFERENCES cameras(id),
  lens_id uuid REFERENCES lenses(id),
  camera_text varchar(100),
  lens_text varchar(100),
  lab_developed_at varchar(100),
  scan_method varchar(20),
  push_pull_stops integer DEFAULT 0,
  shooting_conditions varchar(30),
  helpful_count integer NOT NULL DEFAULT 0,
  status varchar(20) NOT NULL DEFAULT 'published',
  edited boolean NOT NULL DEFAULT false,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  deleted_at timestamp
);

CREATE TABLE IF NOT EXISTS review_helpful_marks (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  review_id uuid NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  created_at timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, review_id)
);

CREATE TABLE IF NOT EXISTS rolls (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  film_variant_id uuid REFERENCES film_variants(id),
  title varchar(150),
  description text,
  lab_name varchar(100),
  developed_at timestamp,
  scan_date timestamp,
  photo_count integer NOT NULL DEFAULT 0,
  cover_photo_id uuid,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS photos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  film_id uuid REFERENCES films(id),
  film_variant_id uuid REFERENCES film_variants(id),
  roll_id uuid REFERENCES rolls(id) ON DELETE SET NULL,
  camera_id uuid REFERENCES cameras(id),
  lens_id uuid REFERENCES lenses(id),
  image_url text NOT NULL,
  thumb_url text,
  caption varchar(500),
  frame_number integer,
  frame_size varchar(20),
  push_pull_stops integer DEFAULT 0,
  shooting_conditions varchar(30),
  shot_at_date timestamp,
  location varchar(200),
  exif jsonb,
  width integer,
  height integer,
  view_count integer NOT NULL DEFAULT 0,
  status varchar(20) NOT NULL DEFAULT 'published',
  created_at timestamp NOT NULL DEFAULT now(),
  deleted_at timestamp
);

CREATE TABLE IF NOT EXISTS film_tips (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  film_id uuid NOT NULL REFERENCES films(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title varchar(150) NOT NULL,
  content text NOT NULL,
  target_format varchar(20) NOT NULL DEFAULT 'all',
  category varchar(30) NOT NULL DEFAULT 'general',
  net_score integer NOT NULL DEFAULT 0,
  view_count integer NOT NULL DEFAULT 0,
  status varchar(20) NOT NULL DEFAULT 'published',
  edited boolean NOT NULL DEFAULT false,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tip_votes (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tip_id uuid NOT NULL REFERENCES film_tips(id) ON DELETE CASCADE,
  vote_type integer NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, tip_id)
);

CREATE TABLE IF NOT EXISTS user_lists (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug varchar(200) NOT NULL,
  title varchar(100) NOT NULL,
  description text,
  cover_image_url text,
  is_public boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  item_count integer NOT NULL DEFAULT 0,
  like_count integer NOT NULL DEFAULT 0,
  save_count integer NOT NULL DEFAULT 0,
  status varchar(20) NOT NULL DEFAULT 'active',
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS list_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id uuid NOT NULL REFERENCES user_lists(id) ON DELETE CASCADE,
  film_variant_id uuid NOT NULL REFERENCES film_variants(id) ON DELETE CASCADE,
  personal_note varchar(280),
  position integer NOT NULL DEFAULT 0,
  added_at timestamp NOT NULL DEFAULT now(),
  UNIQUE (list_id, film_variant_id)
);

CREATE TABLE IF NOT EXISTS list_likes (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  list_id uuid NOT NULL REFERENCES user_lists(id) ON DELETE CASCADE,
  created_at timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, list_id)
);

CREATE TABLE IF NOT EXISTS list_saves (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  list_id uuid NOT NULL REFERENCES user_lists(id) ON DELETE CASCADE,
  created_at timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, list_id)
);

CREATE TABLE IF NOT EXISTS follows (
  follower_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id)
);

CREATE TABLE IF NOT EXISTS user_blocks (
  blocker_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id)
);

CREATE TABLE IF NOT EXISTS likes (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  likeable_id uuid NOT NULL,
  likeable_type varchar(20) NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, likeable_id, likeable_type)
);

CREATE TABLE IF NOT EXISTS comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  commentable_id uuid NOT NULL,
  commentable_type varchar(20) NOT NULL,
  parent_id uuid,
  content text NOT NULL,
  edited boolean NOT NULL DEFAULT false,
  deleted_at timestamp,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type varchar(40) NOT NULL,
  notifiable_id uuid,
  notifiable_type varchar(20),
  payload jsonb,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamp,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reportable_id uuid NOT NULL,
  reportable_type varchar(20) NOT NULL,
  reason varchar(30) NOT NULL,
  detail text,
  status varchar(20) NOT NULL DEFAULT 'pending',
  resolved_by_id uuid,
  resolved_at timestamp,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_moderation_actions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  moderator_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action varchar(20) NOT NULL,
  reason text,
  expires_at timestamp,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  actor_role varchar(30),
  action varchar(80) NOT NULL,
  resource_type varchar(40),
  resource_id text,
  ip varchar(64),
  user_agent text,
  before jsonb,
  after jsonb,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS feature_flags (
  key varchar(100) PRIMARY KEY,
  value jsonb,
  description text,
  rollout_percentage integer NOT NULL DEFAULT 0,
  is_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS announcements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title varchar(200) NOT NULL,
  body text NOT NULL,
  audience jsonb,
  channels jsonb,
  status varchar(20) NOT NULL DEFAULT 'draft',
  scheduled_at timestamp,
  sent_at timestamp,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS achievements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key varchar(80) NOT NULL UNIQUE,
  name varchar(100) NOT NULL,
  description text,
  icon_url text,
  criteria jsonb,
  points integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_achievements (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS invites (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  inviter_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code varchar(20) NOT NULL UNIQUE,
  invitee_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  used_at timestamp,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS saved_filters (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name varchar(100) NOT NULL,
  filters jsonb NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);
`;

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL missing');
  const sql = postgres(url, { ssl: 'require', max: 1, prepare: false });
  console.log('Connecting…');
  // run via unsafe to support multiple statements
  await sql.unsafe(SQL);
  console.log('Migration applied.');
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
