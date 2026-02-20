-- ViTrack Chat Messages Migration
-- Adds chat_messages table to persist conversation history across Telegram and Web.

-- =============================================================================
-- 1. TABLES
-- =============================================================================

CREATE TABLE chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text'
    CHECK (message_type IN ('text', 'meal_saved', 'workout_saved', 'need_info', 'command_result', 'error')),
  source TEXT NOT NULL DEFAULT 'web' CHECK (source IN ('telegram', 'web')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE active_chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) UNIQUE NOT NULL,
  exercises JSONB DEFAULT '[]'::jsonb,
  workout_id UUID,
  started_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- 2. INDEXES
-- =============================================================================

CREATE INDEX idx_chat_messages_user_created ON chat_messages(user_id, created_at DESC);
CREATE INDEX idx_active_sessions_user ON active_chat_sessions(user_id);

-- =============================================================================
-- 3. ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on chat_messages"
  ON chat_messages FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on active_chat_sessions"
  ON active_chat_sessions FOR ALL TO service_role
  USING (true) WITH CHECK (true);
