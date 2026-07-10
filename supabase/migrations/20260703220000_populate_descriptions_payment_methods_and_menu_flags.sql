-- Populates methods_of_payment and description for locations that were left
-- empty by the original seed data, and marks the 4 pure grab-and-go markets
-- (no published itemized menu — see scripts/scrape-menus.mjs) as has_menus =
-- false so they route to the location_generic screen (description + hours +
-- payment methods) instead of the empty menu-browsing screen.
--
-- methods_of_payment sourced from each location's live "Accepted Here"
-- payment widget on dining.umich.edu (only 'Blue Bucks' and 'Dining Dollars'
-- are ever listed there — mapped to this app's payment_method enum as
-- 'MCard' and 'Dining Dollars' respectively). Cash/Credit-Debit are NOT
-- added since the site never itemizes them per-location.

-- Locations whose page lists both Blue Bucks and Dining Dollars
UPDATE location
SET methods_of_payment = ARRAY['MCard', 'Dining Dollars']::payment_method[]
WHERE name IN (
  'Bursley Dining Hall',
  'East Quad Dining Hall',
  'Markley Dining Hall',
  'North Quad Dining Hall',
  'South Quad Dining Hall',
  'Mosher-Jordan Dining Hall',
  'Twigs at Oxford',
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
  'Blue Market at Pierpont Commons',
  'Blue Cafe and Market at Mosher-Jordan',
  'Maizie''s Kitchen and Market',
  'Blue Market at Bursley',
  'Blue Market at Michigan Union',
  'Blue Market at Munger',
  'PharmFresh'
);

-- Martha Cook (Select Access) only lists Blue Bucks
UPDATE location
SET methods_of_payment = ARRAY['MCard']::payment_method[]
WHERE name = 'Martha Cook Dining Hall';

-- Wolverine Village (not yet open) and Lawyers Club (no payment widget
-- published) are left as the default empty array.

-- Descriptions (sourced from each location's live dining.umich.edu page)
UPDATE location SET description = 'Grab a snack at Bert''s Café located in the Shapiro Library (UGLi). Refuel with a La Colombe coffee drink, grab a snack, or pick up a Blue to Go sandwich for something more filling.' WHERE name = 'Bert''s Café';

UPDATE location SET description = 'Located on the Palmer Field side of Mosher-Jordan, Blue Cafe and Market offers frozen foods, sandwiches made your way, Blue to Go salads, pizza, smoothies, La Colombe coffee drinks, and all the convenience items a U-M student needs.' WHERE name = 'Blue Cafe and Market at Mosher-Jordan';

UPDATE location SET description = 'Located on the main floor of East Quad, Blue Cafe proudly serves La Colombe coffee and has comforting favorites like chicken tenders and mozzarella sticks.' WHERE name = 'Blue Cafe East Quad';

UPDATE location SET description = 'This market is conveniently located in Bursley for North Campus residents. Stock up on snacks, drinks, and Blue to Go items for late-night studying.' WHERE name = 'Blue Market at Bursley';

UPDATE location SET description = 'Located in the underground of the Michigan Union, Blue Market is a snap for snacks. You''ll find plenty of grab and go choices including Blue To Go sandwiches and salads, bakery items from M|Bakery, fresh fruit, and beverages of all kinds.' WHERE name = 'Blue Market at Michigan Union';

UPDATE location SET description = 'This 24/7 convenience store, located on the eighth floor of Munger, offers a selection of grocery items and snacks tailored to meet the needs of Munger residents. Kiosk available for 24/7 shopping whenever you need it.' WHERE name = 'Blue Market at Munger';

UPDATE location SET description = 'Your one-stop shop for anything you could crave: fresh fruit, savory snacks, baked goods, sandwiches, and beverages of all kinds. You''ll also find freshly brewed La Colombe coffee, nitro cold brew, and local vendors like Tiffin Tonight and Anu Sushi.' WHERE name = 'Blue Market at Pierpont Commons';

UPDATE location SET description = 'Named after the 32 teeth adults have, Cafe 32 in the Dental School offers hot beverages ranging from a basic cup of coffee to matcha lattes. Rotating daily soups, freshly baked goods, and Blue to Go sandwiches are available as well.' WHERE name = 'Café 32';

UPDATE location SET description = 'Darwin''s is food evolved. Located off the atrium of the Museum of Natural History, Darwin''s features La Colombe coffee, organic and fair-trade Light of Day tea, and assorted sandwiches.' WHERE name = 'Darwin''s';

UPDATE location SET description = 'The first 24/7 café with M|Dining, Eigen Cafe gives guests the flexibility to fuel up whenever that time presents itself. Nestled in the Ford Robotics Building, it''s a great spot for a quick meal or a cup of coffee.' WHERE name = 'Eigen Café';

UPDATE location SET description = 'Just off the main corridor in Pierpont Commons, Fireside is a cozy place to study or share a meal with friends, featuring hot entrees and a rotating selection of local vendors.' WHERE name = 'Fireside Café';

UPDATE location SET description = 'Located on the 4th floor of the Taubman Health Sciences Library, JavaBlu serves La Colombe espresso drinks alongside made-to-order sandwiches, soup, and grab-and-go offerings.' WHERE name = 'JavaBlu';

UPDATE location SET description = 'Located at the Michigan League in the heart of Ann Arbor''s theater district, Maizie''s offers La Colombe coffee, a variety of local flavors from area restaurants, fresh-to-go selections, and a wide variety of snacks.' WHERE name = 'Maizie''s Kitchen and Market';

UPDATE location SET description = 'Located in the sunny atrium of the Duderstadt Center, Mujo Café serves La Colombe coffee alongside salads, sandwiches, bakery treats, and Michigan-made snacks.' WHERE name = 'Mujo Café';

UPDATE location SET description = 'A 24/7 convenience store located on the second floor of the College of Pharmacy building, offering a selection of snacks and fresh grab-and-go options.' WHERE name = 'PharmFresh';

UPDATE location SET description = 'Tucked away at the woodsy Oxford Houses, Twigs is a laid-back dining hall with big windows and comfy couches, offering a rotating selection of American and international options along with burgers from the Grill.' WHERE name = 'Twigs at Oxford';

UPDATE location SET description = 'Located at the University of Michigan Museum of Art, UMMA Café is a lively place with plenty of natural light, offering a rotating monthly sandwich and the UMMA-exclusive Brown Sugar Latte.' WHERE name = 'UMMA Café';

UPDATE location SET description = 'An 800+ seat dining hall for Wolverine Village residents and guests, opening Fall 2026.' WHERE name = 'Wolverine Village Dining Hall';

-- These 4 are pure grab-and-go convenience kiosks with no published
-- itemized menu (see scripts/scrape-menus.mjs comment above MARKETS) — route
-- them to the location_generic screen instead of the empty menu screen.
UPDATE location
SET has_menus = false
WHERE name IN (
  'Blue Market at Bursley',
  'Blue Market at Michigan Union',
  'Blue Market at Munger',
  'PharmFresh'
);
