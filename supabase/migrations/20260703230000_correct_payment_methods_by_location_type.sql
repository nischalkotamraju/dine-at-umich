-- Corrects methods_of_payment based on official M|Dining payment policy:
-- residential dining halls are cashless (card/Blue Bucks/Dining Dollars only),
-- retail cafes/grills/markets accept both cash and card, and two residents-only
-- halls (Lawyers Club, Martha Cook) accept neither.

-- Card only (cashless) dining halls
UPDATE location
SET methods_of_payment = ARRAY['Credit/Debit', 'MCard', 'Dining Dollars']::payment_method[]
WHERE name IN (
  'Bursley Dining Hall',
  'East Quad Dining Hall',
  'Markley Dining Hall',
  'Mosher-Jordan Dining Hall',
  'North Quad Dining Hall',
  'South Quad Dining Hall',
  'Twigs at Oxford',
  'Wolverine Village Dining Hall'
);

-- Cash and card retail locations (markets, cafes, grill)
UPDATE location
SET methods_of_payment = ARRAY['Cash', 'Credit/Debit', 'MCard', 'Dining Dollars']::payment_method[]
WHERE name IN (
  'Blue Market at Bursley',
  'Blue Market at Michigan Union',
  'Blue Market at Munger',
  'Blue Market at Pierpont Commons',
  'Blue Cafe East Quad',
  'Blue Cafe and Market at Mosher-Jordan',
  'Maizie''s Kitchen and Market',
  'PharmFresh',
  'Bert''s Café',
  'Café 32',
  'Darwin''s',
  'Eigen Café',
  'Fireside Café',
  'JavaBlu',
  'Mujo Café',
  'UMMA Café',
  'Petrovich Family Grill'
);

-- Residents-only halls that accept neither cash nor card
UPDATE location
SET methods_of_payment = ARRAY[]::payment_method[]
WHERE name IN (
  'Lawyers Club Dining Hall',
  'Martha Cook Dining Hall'
);
