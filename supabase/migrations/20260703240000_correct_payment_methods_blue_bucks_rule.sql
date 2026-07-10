-- Corrects methods_of_payment to match confirmed on-site payment acceptance:
-- cafes, markets, and the grill accept Blue Bucks + Dining Dollars only
-- ('MCard' enum value = Blue Bucks balance, displayed as "Blue Bucks" in the
-- app UI). Blue Market at Michigan Union is a confirmed exception that also
-- accepts cash and credit/debit. Dining halls remain cashless (unchanged).

-- Cafes, markets (except Michigan Union), and the grill
UPDATE location
SET methods_of_payment = ARRAY['MCard', 'Dining Dollars']::payment_method[]
WHERE name IN (
  'Bert''s Café',
  'Blue Cafe East Quad',
  'Café 32',
  'Darwin''s',
  'Eigen Café',
  'Fireside Café',
  'JavaBlu',
  'Mujo Café',
  'UMMA Café',
  'Petrovich Family Grill',
  'Blue Market at Bursley',
  'Blue Market at Munger',
  'Blue Market at Pierpont Commons',
  'Blue Cafe and Market at Mosher-Jordan',
  'Maizie''s Kitchen and Market',
  'PharmFresh'
);

-- Blue Market at Michigan Union: confirmed to also accept cash + credit/debit
UPDATE location
SET methods_of_payment = ARRAY['Cash', 'Credit/Debit', 'MCard', 'Dining Dollars']::payment_method[]
WHERE name = 'Blue Market at Michigan Union';

-- Dining halls: cashless (unchanged, re-asserted for clarity)
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
