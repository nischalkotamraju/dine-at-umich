-- Flags a nutrition row whose values were estimated by AI (scripts/enrich-ai.mjs)
-- because neither U-M Dining nor NetNutrition published nutrition/ingredients
-- for the dish. The app shows an "AI-estimated" notice when this is true.
ALTER TABLE nutrition ADD COLUMN IF NOT EXISTS ai_estimated boolean NOT NULL DEFAULT false;
