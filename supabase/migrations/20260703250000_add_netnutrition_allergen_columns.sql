-- NetNutrition (fss.studentlife.umich.edu/NetNutrition) exposes several
-- allergens that dining.umich.edu's own menu pages never list at all
-- (Alcohol, Coconut, Oats) plus a "deep fried" flag. Add them here so the new
-- scripts/scrape-netnutrition.mjs enrichment scraper has somewhere to write.
ALTER TABLE "public"."allergens"
  ADD COLUMN IF NOT EXISTS "alcohol" boolean,
  ADD COLUMN IF NOT EXISTS "coconut" boolean,
  ADD COLUMN IF NOT EXISTS "oats" boolean,
  ADD COLUMN IF NOT EXISTS "deep_fried" boolean;
