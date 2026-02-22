-- Onboarding & Metabolic Profile columns on users table
-- Adds all fields needed by the multi-step onboarding questionnaire
-- and the personal stats page.

-- Onboarding gate
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Goal
ALTER TABLE users ADD COLUMN IF NOT EXISTS goal TEXT;

-- Physical data (age stored as int, weight_kg already tracked via weight_logs)
ALTER TABLE users ADD COLUMN IF NOT EXISTS age INT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(5,1);
ALTER TABLE users ADD COLUMN IF NOT EXISTS target_weight_kg DECIMAL(5,1);

-- Body measurements (optional, for Navy body fat formula)
ALTER TABLE users ADD COLUMN IF NOT EXISTS neck_cm INT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS waist_cm INT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hip_cm INT;

-- Lifestyle
ALTER TABLE users ADD COLUMN IF NOT EXISTS workout_types TEXT[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS weekly_frequency TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sleep_hours TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stress_level TEXT;

-- Nutrition
ALTER TABLE users ADD COLUMN IF NOT EXISTS diet_type TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS intolerances TEXT[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS meals_per_day INT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS supplements TEXT[] DEFAULT '{}';

-- Calculated metabolic fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS bmr DECIMAL(7,1);
ALTER TABLE users ADD COLUMN IF NOT EXISTS tdee DECIMAL(7,1);
ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_calorie_target DECIMAL(7,1);
ALTER TABLE users ADD COLUMN IF NOT EXISTS calories_bulk DECIMAL(7,1);
ALTER TABLE users ADD COLUMN IF NOT EXISTS calories_maintain DECIMAL(7,1);
ALTER TABLE users ADD COLUMN IF NOT EXISTS calories_cut DECIMAL(7,1);
ALTER TABLE users ADD COLUMN IF NOT EXISTS macro_protein_g DECIMAL(6,1);
ALTER TABLE users ADD COLUMN IF NOT EXISTS macro_carbs_g DECIMAL(6,1);
ALTER TABLE users ADD COLUMN IF NOT EXISTS macro_fat_g DECIMAL(6,1);

-- Body composition (nullable — only set if measurements provided)
ALTER TABLE users ADD COLUMN IF NOT EXISTS body_fat_percentage DECIMAL(4,1);
ALTER TABLE users ADD COLUMN IF NOT EXISTS lean_mass_kg DECIMAL(5,1);
