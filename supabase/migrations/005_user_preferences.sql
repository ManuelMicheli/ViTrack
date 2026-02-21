-- Add personalization preferences columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT 'blue'
    CHECK (accent_color IN ('blue', 'violet', 'cyan', 'green', 'orange', 'pink'));

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS layout_mode TEXT DEFAULT 'expanded'
    CHECK (layout_mode IN ('compact', 'expanded'));

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS section_order JSONB DEFAULT '["greeting","quickadd","calories","water-streak","weight","meals","workouts"]'::jsonb;
