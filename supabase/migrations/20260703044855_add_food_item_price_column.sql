-- Alter `food_item` table to add `price` column (captured for cafés/grill/markets)
ALTER TABLE food_item
ADD COLUMN price TEXT;
