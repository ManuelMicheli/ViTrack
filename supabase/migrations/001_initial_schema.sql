-- ViTrack Initial Schema Migration
-- Sets up users, meals, and workouts tables with RLS policies and indexes.

-- =============================================================================
-- 1. TABLES
-- =============================================================================

CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  daily_calorie_goal INT DEFAULT 2000,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE meals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  description TEXT NOT NULL,
  calories INT NOT NULL,
  protein_g DECIMAL(6,1),
  carbs_g DECIMAL(6,1),
  fat_g DECIMAL(6,1),
  fiber_g DECIMAL(6,1),
  meal_type TEXT CHECK (meal_type IN ('colazione', 'pranzo', 'cena', 'snack')),
  logged_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE workouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  description TEXT NOT NULL,
  workout_type TEXT NOT NULL,
  duration_min INT,
  calories_burned INT,
  exercises JSONB,
  logged_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- 2. INDEXES
-- =============================================================================

CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_meals_user_logged ON meals(user_id, logged_at);
CREATE INDEX idx_workouts_user_logged ON workouts(user_id, logged_at);

-- =============================================================================
-- 3. ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 3a. Service-role bypass (used by N8N and backend services)
-- The service_role key in Supabase automatically bypasses RLS, but we add
-- explicit policies for clarity and in case of custom role configurations.
-- -----------------------------------------------------------------------------

CREATE POLICY "Service role full access on users"
  ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on meals"
  ON meals
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on workouts"
  ON workouts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 3b. Users table policies
-- Authenticated users can select and update only their own row,
-- matched via telegram_id stored in the JWT claim.
-- -----------------------------------------------------------------------------

CREATE POLICY "Users can view own row"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    telegram_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'telegram_id')::BIGINT
  );

CREATE POLICY "Users can update own row"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    telegram_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'telegram_id')::BIGINT
  )
  WITH CHECK (
    telegram_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'telegram_id')::BIGINT
  );

-- -----------------------------------------------------------------------------
-- 3c. Meals table policies
-- Authenticated users can select/insert/update/delete their own meals,
-- matched by user_id = auth.uid().
-- -----------------------------------------------------------------------------

CREATE POLICY "Users can view own meals"
  ON meals
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own meals"
  ON meals
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own meals"
  ON meals
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own meals"
  ON meals
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 3d. Workouts table policies
-- Same pattern as meals: authenticated users manage only their own records.
-- -----------------------------------------------------------------------------

CREATE POLICY "Users can view own workouts"
  ON workouts
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own workouts"
  ON workouts
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own workouts"
  ON workouts
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own workouts"
  ON workouts
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
