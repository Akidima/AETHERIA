-- Aetheria Database Schema for Supabase
-- Run this in your Supabase SQL editor to set up the database

-- ============================================
-- CLEANUP: Remove problematic triggers first
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS create_user_settings();

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- INTERPRETATIONS TABLE
-- Stores user's emotion interpretations history
-- ============================================
CREATE TABLE IF NOT EXISTS interpretations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  input TEXT NOT NULL,
  params JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user history queries
CREATE INDEX IF NOT EXISTS idx_interpretations_user_id ON interpretations(user_id);
CREATE INDEX IF NOT EXISTS idx_interpretations_created_at ON interpretations(created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE interpretations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (makes schema re-runnable)
DROP POLICY IF EXISTS "Users can view own interpretations" ON interpretations;
DROP POLICY IF EXISTS "Users can insert own interpretations" ON interpretations;
DROP POLICY IF EXISTS "Users can delete own interpretations" ON interpretations;

-- Users can only see their own interpretations
CREATE POLICY "Users can view own interpretations"
  ON interpretations FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own interpretations
CREATE POLICY "Users can insert own interpretations"
  ON interpretations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own interpretations
CREATE POLICY "Users can delete own interpretations"
  ON interpretations FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- SHARED VISUALIZATIONS TABLE
-- Stores publicly shared visualizations
-- ============================================
CREATE TABLE IF NOT EXISTS shared_visualizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  share_id VARCHAR(16) UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  input TEXT NOT NULL,
  params JSONB NOT NULL,
  is_public BOOLEAN DEFAULT true,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for share lookups
CREATE INDEX IF NOT EXISTS idx_shared_share_id ON shared_visualizations(share_id);
CREATE INDEX IF NOT EXISTS idx_shared_is_public ON shared_visualizations(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_shared_views ON shared_visualizations(views DESC);
CREATE INDEX IF NOT EXISTS idx_shared_created_at ON shared_visualizations(created_at DESC);

-- RLS
ALTER TABLE shared_visualizations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view public shares" ON shared_visualizations;
DROP POLICY IF EXISTS "Users can view own shares" ON shared_visualizations;
DROP POLICY IF EXISTS "Anyone can create shares" ON shared_visualizations;
DROP POLICY IF EXISTS "Users can update own shares" ON shared_visualizations;
DROP POLICY IF EXISTS "Users can delete own shares" ON shared_visualizations;

-- Anyone can view public shares
CREATE POLICY "Anyone can view public shares"
  ON shared_visualizations FOR SELECT
  USING (is_public = true);

-- Users can view their own shares (public or private)
CREATE POLICY "Users can view own shares"
  ON shared_visualizations FOR SELECT
  USING (auth.uid() = user_id);

-- Anyone can create shares (including anonymous)
CREATE POLICY "Anyone can create shares"
  ON shared_visualizations FOR INSERT
  WITH CHECK (true);

-- Users can update their own shares
CREATE POLICY "Users can update own shares"
  ON shared_visualizations FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own shares
CREATE POLICY "Users can delete own shares"
  ON shared_visualizations FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- ANALYTICS EVENTS TABLE
-- Stores anonymized usage analytics
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_name VARCHAR(100) NOT NULL,
  properties JSONB DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id VARCHAR(64),
  ip_hash VARCHAR(32),
  user_agent VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_analytics_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_session ON analytics_events(session_id);

-- RLS - Allow inserts from anyone, reads only from service role
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert analytics" ON analytics_events;

CREATE POLICY "Anyone can insert analytics"
  ON analytics_events FOR INSERT
  WITH CHECK (true);

-- ============================================
-- USER SETTINGS TABLE
-- Stores user preferences
-- ============================================
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  sound_enabled BOOLEAN DEFAULT false,
  visual_mode VARCHAR(20) DEFAULT 'sphere',
  theme VARCHAR(20) DEFAULT 'dark',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;

CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamp on settings change
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- USER PROFILES TABLE
-- Public user profiles
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(20) UNIQUE,
  display_name VARCHAR(50),
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON user_profiles(username);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

CREATE POLICY "Anyone can view profiles"
  ON user_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- VISUALIZATION REACTIONS TABLE
-- Emoji reactions on shared visualizations
-- ============================================
CREATE TABLE IF NOT EXISTS visualization_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  share_id VARCHAR(16) NOT NULL REFERENCES shared_visualizations(share_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(share_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_reactions_share_id ON visualization_reactions(share_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON visualization_reactions(user_id);

ALTER TABLE visualization_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view reactions" ON visualization_reactions;
DROP POLICY IF EXISTS "Users can add reactions" ON visualization_reactions;
DROP POLICY IF EXISTS "Users can remove own reactions" ON visualization_reactions;

CREATE POLICY "Anyone can view reactions"
  ON visualization_reactions FOR SELECT
  USING (true);

CREATE POLICY "Users can add reactions"
  ON visualization_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own reactions"
  ON visualization_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to increment likes
CREATE OR REPLACE FUNCTION increment_likes(share_id_param VARCHAR)
RETURNS VOID AS $$
BEGIN
  UPDATE shared_visualizations
  SET likes = likes + 1
  WHERE share_id = share_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement likes
CREATE OR REPLACE FUNCTION decrement_likes(share_id_param VARCHAR)
RETURNS VOID AS $$
BEGIN
  UPDATE shared_visualizations
  SET likes = GREATEST(0, likes - 1)
  WHERE share_id = share_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- DAILY CHECK-INS TABLE
-- Mood tracking with streaks
-- ============================================
CREATE TABLE IF NOT EXISTS daily_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  check_date DATE NOT NULL,
  mood INTEGER NOT NULL CHECK (mood >= 1 AND mood <= 5),
  emotions TEXT[] DEFAULT '{}',
  note TEXT,
  params JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, check_date)
);

CREATE INDEX IF NOT EXISTS idx_checkins_user_id ON daily_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_checkins_date ON daily_checkins(check_date DESC);

ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own checkins" ON daily_checkins;
DROP POLICY IF EXISTS "Users can insert own checkins" ON daily_checkins;
DROP POLICY IF EXISTS "Users can update own checkins" ON daily_checkins;

CREATE POLICY "Users can view own checkins"
  ON daily_checkins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checkins"
  ON daily_checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checkins"
  ON daily_checkins FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- FOLLOWS TABLE
-- User follow relationships
-- ============================================
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view follows" ON follows;
DROP POLICY IF EXISTS "Users can follow" ON follows;
DROP POLICY IF EXISTS "Users can unfollow" ON follows;

CREATE POLICY "Users can view follows"
  ON follows FOR SELECT
  USING (true);

CREATE POLICY "Users can follow"
  ON follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON follows FOR DELETE
  USING (auth.uid() = follower_id);

-- ============================================
-- COMMENTS TABLE
-- Comments on shared visualizations
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visualization_id UUID NOT NULL REFERENCES shared_visualizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(content) <= 500),
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_visualization ON comments(visualization_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON comments(created_at DESC);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view comments" ON comments;
DROP POLICY IF EXISTS "Users can post comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;

CREATE POLICY "Anyone can view comments"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Users can post comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- COMMENT LIKES TABLE
-- Likes on comments
-- ============================================
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON comment_likes(comment_id);

ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view comment likes" ON comment_likes;
DROP POLICY IF EXISTS "Users can like comments" ON comment_likes;
DROP POLICY IF EXISTS "Users can unlike comments" ON comment_likes;

CREATE POLICY "Anyone can view comment likes"
  ON comment_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like comments"
  ON comment_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike comments"
  ON comment_likes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- COLLECTIONS TABLE
-- User collections of visualizations
-- ============================================
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collections_user ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_public ON collections(is_public) WHERE is_public = true;

ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view public collections" ON collections;
DROP POLICY IF EXISTS "Users can view own collections" ON collections;
DROP POLICY IF EXISTS "Users can create collections" ON collections;
DROP POLICY IF EXISTS "Users can update own collections" ON collections;
DROP POLICY IF EXISTS "Users can delete own collections" ON collections;

CREATE POLICY "Anyone can view public collections"
  ON collections FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can view own collections"
  ON collections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create collections"
  ON collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections"
  ON collections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections"
  ON collections FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_collections_updated_at ON collections;
CREATE TRIGGER update_collections_updated_at
  BEFORE UPDATE ON collections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- COLLECTION ITEMS TABLE
-- Items in collections
-- ============================================
CREATE TABLE IF NOT EXISTS collection_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  visualization_id UUID NOT NULL REFERENCES shared_visualizations(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(collection_id, visualization_id)
);

CREATE INDEX IF NOT EXISTS idx_collection_items_collection ON collection_items(collection_id);

ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view public collection items" ON collection_items;
DROP POLICY IF EXISTS "Users can view own collection items" ON collection_items;
DROP POLICY IF EXISTS "Users can add to own collections" ON collection_items;
DROP POLICY IF EXISTS "Users can remove from own collections" ON collection_items;

CREATE POLICY "Anyone can view public collection items"
  ON collection_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM collections c
      WHERE c.id = collection_id AND c.is_public = true
    )
  );

CREATE POLICY "Users can view own collection items"
  ON collection_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM collections c
      WHERE c.id = collection_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add to own collections"
  ON collection_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM collections c
      WHERE c.id = collection_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove from own collections"
  ON collection_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM collections c
      WHERE c.id = collection_id AND c.user_id = auth.uid()
    )
  );

-- ============================================
-- CUSTOM PRESETS TABLE
-- User-saved parameter presets
-- ============================================
CREATE TABLE IF NOT EXISTS custom_presets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  params JSONB NOT NULL,
  visual_mode VARCHAR(20) DEFAULT 'sphere',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_presets_user ON custom_presets(user_id);
CREATE INDEX IF NOT EXISTS idx_presets_public ON custom_presets(is_public) WHERE is_public = true;

ALTER TABLE custom_presets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view public presets" ON custom_presets;
DROP POLICY IF EXISTS "Users can view own presets" ON custom_presets;
DROP POLICY IF EXISTS "Users can create presets" ON custom_presets;
DROP POLICY IF EXISTS "Users can update own presets" ON custom_presets;
DROP POLICY IF EXISTS "Users can delete own presets" ON custom_presets;

CREATE POLICY "Anyone can view public presets"
  ON custom_presets FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can view own presets"
  ON custom_presets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create presets"
  ON custom_presets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own presets"
  ON custom_presets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own presets"
  ON custom_presets FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- API KEYS TABLE
-- For public API access
-- ============================================
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  key_hash VARCHAR(64) NOT NULL UNIQUE,
  permissions TEXT[] DEFAULT '{"read"}',
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own api keys" ON api_keys;
DROP POLICY IF EXISTS "Users can create api keys" ON api_keys;
DROP POLICY IF EXISTS "Users can delete own api keys" ON api_keys;

CREATE POLICY "Users can view own api keys"
  ON api_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create api keys"
  ON api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own api keys"
  ON api_keys FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- COLLAB ROOMS TABLE
-- Real-time collaborative sessions
-- ============================================
CREATE TABLE IF NOT EXISTS collab_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_code VARCHAR(8) UNIQUE NOT NULL,
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  params JSONB NOT NULL,
  visual_mode VARCHAR(20) DEFAULT 'sphere',
  is_public BOOLEAN DEFAULT true,
  max_participants INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_collab_rooms_code ON collab_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_collab_rooms_host ON collab_rooms(host_id);
CREATE INDEX IF NOT EXISTS idx_collab_rooms_public ON collab_rooms(is_public) WHERE is_public = true;

ALTER TABLE collab_rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view public rooms" ON collab_rooms;
DROP POLICY IF EXISTS "Users can view own rooms" ON collab_rooms;
DROP POLICY IF EXISTS "Users can create rooms" ON collab_rooms;
DROP POLICY IF EXISTS "Hosts can update rooms" ON collab_rooms;
DROP POLICY IF EXISTS "Hosts can delete rooms" ON collab_rooms;

CREATE POLICY "Anyone can view public rooms"
  ON collab_rooms FOR SELECT
  USING (is_public = true AND expires_at > NOW());

CREATE POLICY "Users can view own rooms"
  ON collab_rooms FOR SELECT
  USING (auth.uid() = host_id);

CREATE POLICY "Users can create rooms"
  ON collab_rooms FOR INSERT
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update rooms"
  ON collab_rooms FOR UPDATE
  USING (auth.uid() = host_id);

CREATE POLICY "Hosts can delete rooms"
  ON collab_rooms FOR DELETE
  USING (auth.uid() = host_id);

-- ============================================
-- HELPER FUNCTIONS FOR NEW FEATURES
-- ============================================

-- Function to get user's streak
CREATE OR REPLACE FUNCTION get_user_streak(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  streak INTEGER := 0;
  check_date DATE := CURRENT_DATE;
  last_checkin DATE;
BEGIN
  -- Get the most recent check-in date
  SELECT check_date INTO last_checkin
  FROM daily_checkins
  WHERE user_id = user_id_param
  ORDER BY check_date DESC
  LIMIT 1;
  
  -- If no check-ins, return 0
  IF last_checkin IS NULL THEN
    RETURN 0;
  END IF;
  
  -- If last check-in wasn't today or yesterday, streak is 0
  IF last_checkin < CURRENT_DATE - INTERVAL '1 day' THEN
    RETURN 0;
  END IF;
  
  -- Count consecutive days
  WHILE EXISTS (
    SELECT 1 FROM daily_checkins
    WHERE user_id = user_id_param AND check_date = check_date
  ) LOOP
    streak := streak + 1;
    check_date := check_date - INTERVAL '1 day';
  END LOOP;
  
  RETURN streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment comment likes
CREATE OR REPLACE FUNCTION increment_comment_likes(comment_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE comments
  SET likes = likes + 1
  WHERE id = comment_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement comment likes
CREATE OR REPLACE FUNCTION decrement_comment_likes(comment_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE comments
  SET likes = GREATEST(0, likes - 1)
  WHERE id = comment_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get follower count
CREATE OR REPLACE FUNCTION get_follower_count(user_id_param UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM follows WHERE following_id = user_id_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get following count
CREATE OR REPLACE FUNCTION get_following_count(user_id_param UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM follows WHERE follower_id = user_id_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate unique room code
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS VARCHAR(8) AS $$
DECLARE
  chars VARCHAR(36) := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result VARCHAR(8) := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;
