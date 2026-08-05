-- Persistent cache of AI nutrition/ingredient estimates, keyed by a normalized
-- dish name. The menu scraper deletes and recreates food_item + nutrition rows
-- every cycle, wiping AI estimates written into nutrition — without this cache
-- the enrichment would re-call the model for the same ~300 dishes every run.
-- Instead each unique dish name is estimated by the model exactly once (ever),
-- then copied from here into new nutrition rows for free on later cycles.
CREATE TABLE IF NOT EXISTS ai_nutrition_estimates (
  normalized_name text PRIMARY KEY,
  sample_name text,
  ingredients text,
  serving_size text,
  calories text,
  total_fat text,
  saturated_fat text,
  trans_fat text,
  cholesterol text,
  sodium text,
  total_carbohydrates text,
  dietary_fiber text,
  total_sugars text,
  protein text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Written only by the service-role scraper; no public read needed (the app
-- reads the estimates through nutrition, never this table directly).
ALTER TABLE ai_nutrition_estimates ENABLE ROW LEVEL SECURITY;
