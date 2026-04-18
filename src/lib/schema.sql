-- 인정협회 DB Schema
-- Run: psql $DATABASE_URL -f src/lib/schema.sql
--
-- NOTE: This file is a reverse-engineered snapshot of the runtime schema
-- required by the current codebase. Prefer a migrations tool (node-pg-migrate,
-- drizzle-kit, dbmate) for forward changes. Never drop/recreate on production.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ──────────────────────────────────────────────────────────────────────────
-- users
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname VARCHAR(30) UNIQUE,
  provider VARCHAR(50) NOT NULL,
  provider_id VARCHAR(255) NOT NULL,
  avatar_emoji VARCHAR(10) DEFAULT '🙂',
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  is_banned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, provider_id)
);

-- ──────────────────────────────────────────────────────────────────────────
-- posts
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(100),
  content VARCHAR(300) NOT NULL,
  category VARCHAR(20) NOT NULL DEFAULT '자유',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_category_created_at
  ON posts(category, created_at DESC);

-- ──────────────────────────────────────────────────────────────────────────
-- votes  (post-level 인정/노인정)
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('인정', '노인정')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_votes_post_id ON votes(post_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);

-- ──────────────────────────────────────────────────────────────────────────
-- comments  (1-level nesting via parent_id)
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content VARCHAR(200) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_post_created_at
  ON comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);

-- ──────────────────────────────────────────────────────────────────────────
-- comment_likes  (up/down per comment, unique per (comment, user))
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comment_likes (
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(5) NOT NULL CHECK (type IN ('up', 'down')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id
  ON comment_likes(comment_id);

-- ──────────────────────────────────────────────────────────────────────────
-- reports  (polymorphic: target_type ∈ {post, comment, user})
--
-- target_id intentionally has no FK because it's polymorphic.
-- Unique constraint prevents duplicate reports by the same user.
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type VARCHAR(10) NOT NULL CHECK (target_type IN ('post', 'comment', 'user')),
  target_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (reporter_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_reports_target ON reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);

-- ──────────────────────────────────────────────────────────────────────────
-- admin_audit  (audit log for admin moderation actions)
--
-- NEW in this migration: backfill-safe, append-only.
-- Populated by POST /api/admin/action.
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_audit (
  id BIGSERIAL PRIMARY KEY,
  -- admin_id preserved even if the acting admin is later deleted, so the
  -- audit trail remains intact. Denormalize admin_nickname at write time
  -- later if long-term attribution is needed.
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  target_type VARCHAR(20),
  target_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_admin_created
  ON admin_audit(admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_target
  ON admin_audit(target_type, target_id);
