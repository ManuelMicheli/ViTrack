-- Water and Weight Tracking Tables
-- Adds support for water intake logging and weight tracking features.

-- =============================================================================
-- 1. TABLES
-- =============================================================================

-- Water tracking
CREATE TABLE water_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  glasses INT NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(user_id, date)
);

-- Weight tracking
CREATE TABLE weight_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  weight_kg DECIMAL(5,1) NOT NULL,
  logged_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- 2. INDEXES
-- =============================================================================

CREATE INDEX idx_water_user_date ON water_logs(user_id, date);
CREATE INDEX idx_weight_user_logged ON weight_logs(user_id, logged_at);

-- =============================================================================
-- 3. ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 3a. Service-role bypass
-- The service_role key in Supabase automatically bypasses RLS, but we add
-- explicit policies for clarity.
-- -----------------------------------------------------------------------------

CREATE POLICY "Service role full access on water_logs"
  ON water_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on weight_logs"
  ON weight_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 3b. Water logs table policies
-- Authenticated users can select/insert/update/delete their own water logs,
-- matched by user_id = auth.uid().
-- -----------------------------------------------------------------------------

CREATE POLICY "Users can view own water logs"
  ON water_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own water logs"
  ON water_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own water logs"
  ON water_logs
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own water logs"
  ON water_logs
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 3c. Weight logs table policies
-- Same pattern as water logs: authenticated users manage only their own records.
-- -----------------------------------------------------------------------------

CREATE POLICY "Users can view own weight logs"
  ON weight_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own weight logs"
  ON weight_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own weight logs"
  ON weight_logs
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own weight logs"
  ON weight_logs
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
