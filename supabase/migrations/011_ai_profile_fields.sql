-- AI Assistant profile fields — cooking skill, allergies, equipment, injuries, etc.

ALTER TABLE users ADD COLUMN IF NOT EXISTS cooking_skill TEXT DEFAULT 'intermediate'
  CHECK (cooking_skill IN ('none', 'basic', 'intermediate', 'advanced'));

ALTER TABLE users ADD COLUMN IF NOT EXISTS allergies TEXT[] DEFAULT '{}';

ALTER TABLE users ADD COLUMN IF NOT EXISTS disliked_foods TEXT[] DEFAULT '{}';

ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_cuisine TEXT[] DEFAULT '{}';

ALTER TABLE users ADD COLUMN IF NOT EXISTS available_equipment TEXT[] DEFAULT '{}';

ALTER TABLE users ADD COLUMN IF NOT EXISTS injuries_or_limitations TEXT[] DEFAULT '{}';

ALTER TABLE users ADD COLUMN IF NOT EXISTS training_days_per_week INT DEFAULT 3;

ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_training_time TEXT;
