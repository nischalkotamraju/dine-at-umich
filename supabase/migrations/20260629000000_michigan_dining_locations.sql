-- Replace all existing locations and location types with University of Michigan dining data

-- Clear existing data (cascades to menu, menu_category, food_item, nutrition, allergens)
DELETE FROM "public"."location";
DELETE FROM "public"."location_type";

-- Insert UMich location types
INSERT INTO "public"."location_type" ("id", "name", "created_at", "updated_at", "display_order") VALUES
  ('11111111-0000-0000-0000-000000000001', 'Dining Hall', now(), now(), 0),
  ('11111111-0000-0000-0000-000000000002', 'Café & Coffee', now(), now(), 1),
  ('11111111-0000-0000-0000-000000000003', 'Food Court', now(), now(), 2),
  ('11111111-0000-0000-0000-000000000004', 'Convenience Store', now(), now(), 3),
  ('11111111-0000-0000-0000-000000000005', 'Food Truck', now(), now(), 4);

-- Insert University of Michigan dining locations
INSERT INTO "public"."location" (
  "id", "name", "colloquial_name", "description", "address",
  "type_id", "regular_service_hours", "methods_of_payment", "meal_times",
  "google_maps_link", "apple_maps_link", "image",
  "created_at", "updated_at", "force_close", "has_menus", "display_order",
  "latitude", "longitude"
) VALUES

-- DINING HALLS (has_menus = true)
(
  'aaaaaaaa-0000-0000-0000-000000000001',
  'Bursley Dining Hall', 'Bursley',
  'Located on North Campus, Bursley Dining Hall serves breakfast, lunch, and dinner daily. It is one of the largest dining halls at Michigan and is conveniently close to the engineering and music schools.',
  '1931 Duffield St, Ann Arbor, MI 48109',
  '11111111-0000-0000-0000-000000000001',
  '{"monday":{"isClosed":false,"timeRanges":[{"open":700,"close":900},{"open":1100,"close":1400},{"open":1700,"close":2000}]},"tuesday":{"isClosed":false,"timeRanges":[{"open":700,"close":900},{"open":1100,"close":1400},{"open":1700,"close":2000}]},"wednesday":{"isClosed":false,"timeRanges":[{"open":700,"close":900},{"open":1100,"close":1400},{"open":1700,"close":2000}]},"thursday":{"isClosed":false,"timeRanges":[{"open":700,"close":900},{"open":1100,"close":1400},{"open":1700,"close":2000}]},"friday":{"isClosed":false,"timeRanges":[{"open":700,"close":900},{"open":1100,"close":1400},{"open":1700,"close":1930}]},"saturday":{"isClosed":false,"timeRanges":[{"open":1000,"close":1400},{"open":1700,"close":1930}]},"sunday":{"isClosed":false,"timeRanges":[{"open":1000,"close":1400},{"open":1700,"close":2000}]}}',
  '{"MCard","Dining Dollars","Credit/Debit","Cash"}',
  ARRAY['{"breakfast":{"open":700,"close":900},"lunch":{"open":1100,"close":1400},"dinner":{"open":1700,"close":2000}}'::jsonb],
  'https://www.google.com/maps/search/?api=1&query=1931+Duffield+St+Ann+Arbor+MI+48109',
  'https://maps.apple.com/?address=1931+Duffield+St,+Ann+Arbor,+MI+48109&ll=42.2929,-83.7158',
  'https://dining.umich.edu/wp-content/uploads/2019/07/bursley.jpg',
  now(), now(), false, true, 0, 42.29289, -83.71581
),
(
  'aaaaaaaa-0000-0000-0000-000000000002',
  'East Quad Dining Hall', 'East Quad',
  'East Quad Dining Hall is located in the East Quadrangle residential community on central campus. It offers a warm, community atmosphere and serves all three meals daily.',
  '701 E University Ave, Ann Arbor, MI 48109',
  '11111111-0000-0000-0000-000000000001',
  '{"monday":{"isClosed":false,"timeRanges":[{"open":700,"close":900},{"open":1100,"close":1400},{"open":1700,"close":2000}]},"tuesday":{"isClosed":false,"timeRanges":[{"open":700,"close":900},{"open":1100,"close":1400},{"open":1700,"close":2000}]},"wednesday":{"isClosed":false,"timeRanges":[{"open":700,"close":900},{"open":1100,"close":1400},{"open":1700,"close":2000}]},"thursday":{"isClosed":false,"timeRanges":[{"open":700,"close":900},{"open":1100,"close":1400},{"open":1700,"close":2000}]},"friday":{"isClosed":false,"timeRanges":[{"open":700,"close":900},{"open":1100,"close":1400},{"open":1700,"close":1930}]},"saturday":{"isClosed":false,"timeRanges":[{"open":1000,"close":1400},{"open":1700,"close":1930}]},"sunday":{"isClosed":false,"timeRanges":[{"open":1000,"close":1400},{"open":1700,"close":2000}]}}',
  '{"MCard","Dining Dollars","Credit/Debit","Cash"}',
  ARRAY['{"breakfast":{"open":700,"close":900},"lunch":{"open":1100,"close":1400},"dinner":{"open":1700,"close":2000}}'::jsonb],
  'https://www.google.com/maps/search/?api=1&query=701+E+University+Ave+Ann+Arbor+MI+48109',
  'https://maps.apple.com/?address=701+E+University+Ave,+Ann+Arbor,+MI+48109&ll=42.27563,-83.73348',
  'https://dining.umich.edu/wp-content/uploads/2019/07/east-quad.jpg',
  now(), now(), false, true, 1, 42.27563, -83.73348
),
(
  'aaaaaaaa-0000-0000-0000-000000000003',
  'Markley Dining Hall', 'Markley',
  'Mary Markley Dining Hall serves the residents of Mary Markley Hall, one of Michigan''s largest residence halls. The dining hall is known for its variety and is open for all three meals.',
  '1503 Washington Heights, Ann Arbor, MI 48104',
  '11111111-0000-0000-0000-000000000001',
  '{"monday":{"isClosed":false,"timeRanges":[{"open":700,"close":900},{"open":1100,"close":1400},{"open":1700,"close":2000}]},"tuesday":{"isClosed":false,"timeRanges":[{"open":700,"close":900},{"open":1100,"close":1400},{"open":1700,"close":2000}]},"wednesday":{"isClosed":false,"timeRanges":[{"open":700,"close":900},{"open":1100,"close":1400},{"open":1700,"close":2000}]},"thursday":{"isClosed":false,"timeRanges":[{"open":700,"close":900},{"open":1100,"close":1400},{"open":1700,"close":2000}]},"friday":{"isClosed":false,"timeRanges":[{"open":700,"close":900},{"open":1100,"close":1400},{"open":1700,"close":1930}]},"saturday":{"isClosed":false,"timeRanges":[{"open":1000,"close":1400},{"open":1700,"close":1930}]},"sunday":{"isClosed":false,"timeRanges":[{"open":1000,"close":1400},{"open":1700,"close":2000}]}}',
  '{"MCard","Dining Dollars","Credit/Debit","Cash"}',
  ARRAY['{"breakfast":{"open":700,"close":900},"lunch":{"open":1100,"close":1400},"dinner":{"open":1700,"close":2000}}'::jsonb],
  'https://www.google.com/maps/search/?api=1&query=1503+Washington+Heights+Ann+Arbor+MI+48104',
  'https://maps.apple.com/?address=1503+Washington+Heights,+Ann+Arbor,+MI+48104&ll=42.27972,-83.72540',
  'https://dining.umich.edu/wp-content/uploads/2019/07/markley.jpg',
  now(), now(), false, true, 2, 42.27972, -83.72540
),
(
  'aaaaaaaa-0000-0000-0000-000000000004',
  'North Quad Dining Hall', 'North Quad',
  'North Quad Dining Hall is located inside the North Quad Residential and Academic Complex on central campus. It features an open kitchen concept and serves breakfast, lunch, and dinner.',
  '105 S State St, Ann Arbor, MI 48109',
  '11111111-0000-0000-0000-000000000001',
  '{"monday":{"isClosed":false,"timeRanges":[{"open":700,"close":900},{"open":1100,"close":1400},{"open":1700,"close":2000}]},"tuesday":{"isClosed":false,"timeRanges":[{"open":700,"close":900},{"open":1100,"close":1400},{"open":1700,"close":2000}]},"wednesday":{"isClosed":false,"timeRanges":[{"open":700,"close":900},{"open":1100,"close":1400},{"open":1700,"close":2000}]},"thursday":{"isClosed":false,"timeRanges":[{"open":700,"close":900},{"open":1100,"close":1400},{"open":1700,"close":2000}]},"friday":{"isClosed":false,"timeRanges":[{"open":700,"close":900},{"open":1100,"close":1400},{"open":1700,"close":1930}]},"saturday":{"isClosed":false,"timeRanges":[{"open":1000,"close":1400},{"open":1700,"close":1930}]},"sunday":{"isClosed":false,"timeRanges":[{"open":1000,"close":1400},{"open":1700,"close":2000}]}}',
  '{"MCard","Dining Dollars","Credit/Debit","Cash"}',
  ARRAY['{"breakfast":{"open":700,"close":900},"lunch":{"open":1100,"close":1400},"dinner":{"open":1700,"close":2000}}'::jsonb],
  'https://www.google.com/maps/search/?api=1&query=105+S+State+St+Ann+Arbor+MI+48109',
  'https://maps.apple.com/?address=105+S+State+St,+Ann+Arbor,+MI+48109&ll=42.28023,-83.74236',
  'https://dining.umich.edu/wp-content/uploads/2019/07/north-quad.jpg',
  now(), now(), false, true, 3, 42.28023, -83.74236
),
(
  'aaaaaaaa-0000-0000-0000-000000000005',
  'South Quad Dining Hall', 'South Quad',
  'South Quad Dining Hall serves the residents of South Quadrangle, one of the largest residential communities on central campus. It is open for breakfast, lunch, and dinner and is known for its lively atmosphere.',
  '702 Monroe St, Ann Arbor, MI 48104',
  '11111111-0000-0000-0000-000000000001',
  '{"monday":{"isClosed":false,"timeRanges":[{"open":700,"close":900},{"open":1100,"close":1400},{"open":1700,"close":2000}]},"tuesday":{"isClosed":false,"timeRanges":[{"open":700,"close":900},{"open":1100,"close":1400},{"open":1700,"close":2000}]},"wednesday":{"isClosed":false,"timeRanges":[{"open":700,"close":900},{"open":1100,"close":1400},{"open":1700,"close":2000}]},"thursday":{"isClosed":false,"timeRanges":[{"open":700,"close":900},{"open":1100,"close":1400},{"open":1700,"close":2000}]},"friday":{"isClosed":false,"timeRanges":[{"open":700,"close":900},{"open":1100,"close":1400},{"open":1700,"close":1930}]},"saturday":{"isClosed":false,"timeRanges":[{"open":1000,"close":1400},{"open":1700,"close":1930}]},"sunday":{"isClosed":false,"timeRanges":[{"open":1000,"close":1400},{"open":1700,"close":2000}]}}',
  '{"MCard","Dining Dollars","Credit/Debit","Cash"}',
  ARRAY['{"breakfast":{"open":700,"close":900},"lunch":{"open":1100,"close":1400},"dinner":{"open":1700,"close":2000}}'::jsonb],
  'https://www.google.com/maps/search/?api=1&query=702+Monroe+St+Ann+Arbor+MI+48104',
  'https://maps.apple.com/?address=702+Monroe+St,+Ann+Arbor,+MI+48104&ll=42.27357,-83.74191',
  'https://dining.umich.edu/wp-content/uploads/2019/07/south-quad.jpg',
  now(), now(), false, true, 4, 42.27357, -83.74191
),
(
  'aaaaaaaa-0000-0000-0000-000000000006',
  'Mosher-Jordan Dining Hall', 'Mo-Jo',
  'Mosher-Jordan Dining Hall, affectionately known as Mo-Jo, serves the Mosher-Jordan residence hall community on central campus. Open for all three meals, it offers a welcoming dining experience.',
  '1503 Monroe St, Ann Arbor, MI 48104',
  '11111111-0000-0000-0000-000000000001',
  '{"monday":{"isClosed":false,"timeRanges":[{"open":700,"close":900},{"open":1100,"close":1400},{"open":1700,"close":2000}]},"tuesday":{"isClosed":false,"timeRanges":[{"open":700,"close":900},{"open":1100,"close":1400},{"open":1700,"close":2000}]},"wednesday":{"isClosed":false,"timeRanges":[{"open":700,"close":900},{"open":1100,"close":1400},{"open":1700,"close":2000}]},"thursday":{"isClosed":false,"timeRanges":[{"open":700,"close":900},{"open":1100,"close":1400},{"open":1700,"close":2000}]},"friday":{"isClosed":false,"timeRanges":[{"open":700,"close":900},{"open":1100,"close":1400},{"open":1700,"close":1930}]},"saturday":{"isClosed":false,"timeRanges":[{"open":1000,"close":1400},{"open":1700,"close":1930}]},"sunday":{"isClosed":false,"timeRanges":[{"open":1000,"close":1400},{"open":1700,"close":2000}]}}',
  '{"MCard","Dining Dollars","Credit/Debit","Cash"}',
  ARRAY['{"breakfast":{"open":700,"close":900},"lunch":{"open":1100,"close":1400},"dinner":{"open":1700,"close":2000}}'::jsonb],
  'https://www.google.com/maps/search/?api=1&query=1503+Monroe+St+Ann+Arbor+MI+48104',
  'https://maps.apple.com/?address=1503+Monroe+St,+Ann+Arbor,+MI+48104&ll=42.28148,-83.72571',
  'https://dining.umich.edu/wp-content/uploads/2019/07/mosher-jordan.jpg',
  now(), now(), false, true, 5, 42.28148, -83.72571
),

-- CAFÉS & COFFEE
(
  'aaaaaaaa-0000-0000-0000-000000000007',
  'Espresso Royale', NULL,
  'A popular Ann Arbor coffee chain with a cozy location on campus. Known for great espresso drinks, tea, and light bites.',
  '214 S State St, Ann Arbor, MI 48104',
  '11111111-0000-0000-0000-000000000002',
  '{"monday":{"isClosed":false,"timeRanges":[{"open":700,"close":2100}]},"tuesday":{"isClosed":false,"timeRanges":[{"open":700,"close":2100}]},"wednesday":{"isClosed":false,"timeRanges":[{"open":700,"close":2100}]},"thursday":{"isClosed":false,"timeRanges":[{"open":700,"close":2100}]},"friday":{"isClosed":false,"timeRanges":[{"open":700,"close":2000}]},"saturday":{"isClosed":false,"timeRanges":[{"open":800,"close":2000}]},"sunday":{"isClosed":false,"timeRanges":[{"open":800,"close":2100}]}}',
  '{"MCard","Dining Dollars","Credit/Debit","Cash"}',
  ARRAY[]::jsonb[],
  'https://www.google.com/maps/search/?api=1&query=214+S+State+St+Ann+Arbor+MI+48104',
  'https://maps.apple.com/?address=214+S+State+St,+Ann+Arbor,+MI+48104&ll=42.27760,-83.74054',
  NULL,
  now(), now(), false, false, 6, 42.27760, -83.74054
),
(
  'aaaaaaaa-0000-0000-0000-000000000008',
  'Pierpont Commons Café', NULL,
  'Located in Pierpont Commons on North Campus, this café serves coffee, snacks, and light meals and is a popular gathering spot for engineering and music students.',
  '2101 Bonisteel Blvd, Ann Arbor, MI 48109',
  '11111111-0000-0000-0000-000000000002',
  '{"monday":{"isClosed":false,"timeRanges":[{"open":730,"close":2000}]},"tuesday":{"isClosed":false,"timeRanges":[{"open":730,"close":2000}]},"wednesday":{"isClosed":false,"timeRanges":[{"open":730,"close":2000}]},"thursday":{"isClosed":false,"timeRanges":[{"open":730,"close":2000}]},"friday":{"isClosed":false,"timeRanges":[{"open":730,"close":1700}]},"saturday":{"isClosed":true,"timeRanges":[{"open":900,"close":1700}]},"sunday":{"isClosed":true,"timeRanges":[{"open":900,"close":1700}]}}',
  '{"MCard","Dining Dollars","Credit/Debit","Cash"}',
  ARRAY[]::jsonb[],
  'https://www.google.com/maps/search/?api=1&query=2101+Bonisteel+Blvd+Ann+Arbor+MI+48109',
  'https://maps.apple.com/?address=2101+Bonisteel+Blvd,+Ann+Arbor,+MI+48109&ll=42.29290,-83.71577',
  NULL,
  now(), now(), false, false, 7, 42.29290, -83.71577
),
(
  'aaaaaaaa-0000-0000-0000-000000000009',
  'Sweetwaters Coffee & Tea', NULL,
  'A beloved Ann Arbor local coffee shop offering handcrafted coffee and tea drinks, pastries, and light food. Known for its cozy atmosphere and unique blends.',
  '123 W Washington St, Ann Arbor, MI 48104',
  '11111111-0000-0000-0000-000000000002',
  '{"monday":{"isClosed":false,"timeRanges":[{"open":700,"close":2100}]},"tuesday":{"isClosed":false,"timeRanges":[{"open":700,"close":2100}]},"wednesday":{"isClosed":false,"timeRanges":[{"open":700,"close":2100}]},"thursday":{"isClosed":false,"timeRanges":[{"open":700,"close":2100}]},"friday":{"isClosed":false,"timeRanges":[{"open":700,"close":2100}]},"saturday":{"isClosed":false,"timeRanges":[{"open":800,"close":2100}]},"sunday":{"isClosed":false,"timeRanges":[{"open":800,"close":2100}]}}',
  '{"MCard","Dining Dollars","Credit/Debit","Cash"}',
  ARRAY[]::jsonb[],
  'https://www.google.com/maps/search/?api=1&query=123+W+Washington+St+Ann+Arbor+MI+48104',
  'https://maps.apple.com/?address=123+W+Washington+St,+Ann+Arbor,+MI+48104&ll=42.27990,-83.74820',
  NULL,
  now(), now(), false, false, 8, 42.27990, -83.74820
),

-- FOOD COURTS
(
  'aaaaaaaa-0000-0000-0000-000000000010',
  'Michigan Union Food Court', 'The Union',
  'The Michigan Union food court offers a wide variety of dining options on central campus, including national chains and local favorites. A bustling hub for students between classes.',
  '530 S State St, Ann Arbor, MI 48109',
  '11111111-0000-0000-0000-000000000003',
  '{"monday":{"isClosed":false,"timeRanges":[{"open":700,"close":2100}]},"tuesday":{"isClosed":false,"timeRanges":[{"open":700,"close":2100}]},"wednesday":{"isClosed":false,"timeRanges":[{"open":700,"close":2100}]},"thursday":{"isClosed":false,"timeRanges":[{"open":700,"close":2100}]},"friday":{"isClosed":false,"timeRanges":[{"open":700,"close":2000}]},"saturday":{"isClosed":false,"timeRanges":[{"open":900,"close":2000}]},"sunday":{"isClosed":false,"timeRanges":[{"open":1000,"close":2000}]}}',
  '{"MCard","Dining Dollars","Credit/Debit","Cash"}',
  ARRAY[]::jsonb[],
  'https://www.google.com/maps/search/?api=1&query=530+S+State+St+Ann+Arbor+MI+48109',
  'https://maps.apple.com/?address=530+S+State+St,+Ann+Arbor,+MI+48109&ll=42.27494,-83.74289',
  NULL,
  now(), now(), false, false, 9, 42.27494, -83.74289
),
(
  'aaaaaaaa-0000-0000-0000-000000000011',
  'Michigan League Dining', 'The League',
  'Located in the historic Michigan League, this dining spot offers lunch and dinner service with a variety of hot and cold options in a classic Michigan setting.',
  '911 N University Ave, Ann Arbor, MI 48109',
  '11111111-0000-0000-0000-000000000003',
  '{"monday":{"isClosed":false,"timeRanges":[{"open":1100,"close":1400},{"open":1700,"close":1900}]},"tuesday":{"isClosed":false,"timeRanges":[{"open":1100,"close":1400},{"open":1700,"close":1900}]},"wednesday":{"isClosed":false,"timeRanges":[{"open":1100,"close":1400},{"open":1700,"close":1900}]},"thursday":{"isClosed":false,"timeRanges":[{"open":1100,"close":1400},{"open":1700,"close":1900}]},"friday":{"isClosed":false,"timeRanges":[{"open":1100,"close":1400}]},"saturday":{"isClosed":true,"timeRanges":[{"open":1100,"close":1400}]},"sunday":{"isClosed":true,"timeRanges":[{"open":1100,"close":1400}]}}',
  '{"MCard","Dining Dollars","Credit/Debit","Cash"}',
  ARRAY[]::jsonb[],
  'https://www.google.com/maps/search/?api=1&query=911+N+University+Ave+Ann+Arbor+MI+48109',
  'https://maps.apple.com/?address=911+N+University+Ave,+Ann+Arbor,+MI+48109&ll=42.27884,-83.74103',
  NULL,
  now(), now(), false, false, 10, 42.27884, -83.74103
),

-- CONVENIENCE STORES
(
  'aaaaaaaa-0000-0000-0000-000000000012',
  'Markley Market', NULL,
  'A convenient campus store inside Mary Markley Hall stocked with snacks, beverages, groceries, and everyday essentials. Perfect for late-night cravings.',
  '1503 Washington Heights, Ann Arbor, MI 48104',
  '11111111-0000-0000-0000-000000000004',
  '{"monday":{"isClosed":false,"timeRanges":[{"open":900,"close":2300}]},"tuesday":{"isClosed":false,"timeRanges":[{"open":900,"close":2300}]},"wednesday":{"isClosed":false,"timeRanges":[{"open":900,"close":2300}]},"thursday":{"isClosed":false,"timeRanges":[{"open":900,"close":2300}]},"friday":{"isClosed":false,"timeRanges":[{"open":900,"close":2300}]},"saturday":{"isClosed":false,"timeRanges":[{"open":1000,"close":2200}]},"sunday":{"isClosed":false,"timeRanges":[{"open":1000,"close":2300}]}}',
  '{"MCard","Dining Dollars","Credit/Debit","Cash"}',
  ARRAY[]::jsonb[],
  'https://www.google.com/maps/search/?api=1&query=1503+Washington+Heights+Ann+Arbor+MI+48104',
  'https://maps.apple.com/?address=1503+Washington+Heights,+Ann+Arbor,+MI+48104&ll=42.27972,-83.72540',
  NULL,
  now(), now(), false, false, 11, 42.27972, -83.72540
),
(
  'aaaaaaaa-0000-0000-0000-000000000013',
  'South Quad Market', NULL,
  'The South Quad Market is a convenience store serving the South Quadrangle community. It carries snacks, drinks, toiletries, and basic grocery items.',
  '702 Monroe St, Ann Arbor, MI 48104',
  '11111111-0000-0000-0000-000000000004',
  '{"monday":{"isClosed":false,"timeRanges":[{"open":900,"close":2300}]},"tuesday":{"isClosed":false,"timeRanges":[{"open":900,"close":2300}]},"wednesday":{"isClosed":false,"timeRanges":[{"open":900,"close":2300}]},"thursday":{"isClosed":false,"timeRanges":[{"open":900,"close":2300}]},"friday":{"isClosed":false,"timeRanges":[{"open":900,"close":2300}]},"saturday":{"isClosed":false,"timeRanges":[{"open":1000,"close":2200}]},"sunday":{"isClosed":false,"timeRanges":[{"open":1000,"close":2300}]}}',
  '{"MCard","Dining Dollars","Credit/Debit","Cash"}',
  ARRAY[]::jsonb[],
  'https://www.google.com/maps/search/?api=1&query=702+Monroe+St+Ann+Arbor+MI+48104',
  'https://maps.apple.com/?address=702+Monroe+St,+Ann+Arbor,+MI+48104&ll=42.27357,-83.74191',
  NULL,
  now(), now(), false, false, 12, 42.27357, -83.74191
);
