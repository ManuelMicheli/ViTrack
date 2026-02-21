-- Recipes table: user-saved recipes for instant meal logging
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  items JSONB NOT NULL,  -- [{name, name_en, quantity_g, brand, is_branded}]
  total_calories INT,
  total_protein_g DECIMAL(6,1),
  total_carbs_g DECIMAL(6,1),
  total_fat_g DECIMAL(6,1),
  total_fiber_g DECIMAL(6,1),
  meal_type TEXT DEFAULT 'snack',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX recipes_user_name_idx ON recipes(user_id, lower(name));
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
