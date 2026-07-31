-- Adds Cash to the locations that have a kiosk where cash can be loaded onto
-- Blue Bucks (the markets and a few cafés). Cash is not accepted for direct
-- purchases anywhere, but since these spots let you convert cash to Blue Bucks,
-- Cash is surfaced there. These are the four-method locations.
update public.location
set methods_of_payment = array['MCard', 'Dining Dollars', 'Credit/Debit', 'Cash']::payment_method[]
where name in (
  'Blue Cafe and Market at Mosher-Jordan',
  'Blue Cafe East Quad',
  'Blue Market at Bursley',
  'Blue Market at Michigan Union',
  'Blue Market at Munger',
  'Blue Market at Pierpont Commons',
  'Café 32',
  'Fireside Café',
  'Maizie''s Kitchen and Market',
  'Mujo Café',
  'Wolverine Village Blue Market'
);
