-- Goal Classification columns on users table
-- Adds columns needed by the goal sub-classifier (GuidaObiettivi.md).
-- These store the detailed breakdown of the user's selected goal
-- (bulk / cut / performance / maintain / healthy) into specific
-- sub-types with exact surplus/deficit values and contextual metadata.
--
-- Values reference:
--   training_experience : 'beginner' | 'intermediate' | 'advanced'
--   goal_subtype        : 'lean_bulk' | 'moderate_bulk' | 'aggressive_bulk'
--                       | 'conservative_deficit' | 'moderate_deficit' | 'aggressive_deficit'
--                       | 'performance_strength' | 'performance_endurance'
--                       | 'performance_intermittent' | 'performance_technical'
--                       | 'maintain' | 'healthy'
--   calorie_surplus_deficit : signed integer (e.g. +200, -450)
--   season_phase        : 'pre_season' | 'competitive' | 'off_season'
--   sport_category      : 'strength' | 'endurance' | 'intermittent' | 'technical'

-- Training experience level (affects bulk type selection & macro ratios)
ALTER TABLE users ADD COLUMN IF NOT EXISTS training_experience TEXT;

-- Specific goal sub-classification determined by the classifier
ALTER TABLE users ADD COLUMN IF NOT EXISTS goal_subtype TEXT;

-- Exact calorie surplus (+) or deficit (-) computed for this user
ALTER TABLE users ADD COLUMN IF NOT EXISTS calorie_surplus_deficit INT;

-- Athletic season phase (relevant for performance goals)
ALTER TABLE users ADD COLUMN IF NOT EXISTS season_phase TEXT;

-- Sport category (relevant for performance goals)
ALTER TABLE users ADD COLUMN IF NOT EXISTS sport_category TEXT;
