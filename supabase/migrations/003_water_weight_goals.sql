-- Add personalization columns for water and weight tracking

ALTER TABLE users ADD COLUMN water_goal_ml INT DEFAULT 2000;
ALTER TABLE users ADD COLUMN water_tracking_mode TEXT DEFAULT 'glasses' CHECK (water_tracking_mode IN ('glasses', 'ml'));
ALTER TABLE users ADD COLUMN weight_goal_kg DECIMAL(5,1);
ALTER TABLE users ADD COLUMN height_cm INT;

-- Add ml tracking to water_logs
ALTER TABLE water_logs ADD COLUMN ml INT DEFAULT 0;
