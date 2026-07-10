-- Fix corrupted type name (already done via API but included for completeness)
UPDATE location_type SET name = 'Café & Coffee' WHERE id = '11111111-0000-0000-0000-000000000002';
UPDATE location_type SET name = 'Market' WHERE id = '11111111-0000-0000-0000-000000000004';

-- Remove non-UMich locations (already done via API)
-- DELETE FROM location WHERE id IN (
--   'aaaaaaaa-0000-0000-0000-000000000007', -- Espresso Royale
--   'aaaaaaaa-0000-0000-0000-000000000009', -- Sweetwaters
--   'aaaaaaaa-0000-0000-0000-000000000011', -- Michigan League Dining
--   'aaaaaaaa-0000-0000-0000-000000000012', -- Markley Market
--   'aaaaaaaa-0000-0000-0000-000000000013'  -- South Quad Market
-- );

-- Fix Pierpont Commons (already done via API)
-- UPDATE location SET name = 'Blue Market at Pierpont Commons', type_id = '11111111-0000-0000-0000-000000000004'
-- WHERE id = 'aaaaaaaa-0000-0000-0000-000000000008';

-- Add missing Dining Halls
INSERT INTO location (id, name, colloquial_name, description, address, type_id, regular_service_hours, methods_of_payment, meal_times, google_maps_link, apple_maps_link, force_close, has_menus, display_order, latitude, longitude)
VALUES
  ('aaaaaaaa-0000-0000-0000-000000000014', 'Twigs at Oxford', 'Twigs', '', '700 S Forest Ave, Ann Arbor, MI 48104', '11111111-0000-0000-0000-000000000001', '{}'::jsonb, '{}', '{}', 'https://www.google.com/maps/search/?api=1&query=700+S+Forest+Ave+Ann+Arbor+MI', 'https://maps.apple.com/?address=700+S+Forest+Ave,+Ann+Arbor,+MI+48104', false, true, 7, 42.2738, -83.7393),
  ('aaaaaaaa-0000-0000-0000-000000000015', 'Wolverine Village Dining Hall', 'Wolverine Village', '', '700 Maiden Ln, Ann Arbor, MI 48105', '11111111-0000-0000-0000-000000000001', '{}'::jsonb, '{}', '{}', 'https://www.google.com/maps/search/?api=1&query=700+Maiden+Ln+Ann+Arbor+MI', 'https://maps.apple.com/?address=700+Maiden+Ln,+Ann+Arbor,+MI+48105', false, true, 8, 42.3034, -83.7201);

-- Add missing Cafés
INSERT INTO location (id, name, colloquial_name, description, address, type_id, regular_service_hours, methods_of_payment, meal_times, google_maps_link, apple_maps_link, force_close, has_menus, display_order, latitude, longitude)
VALUES
  ('aaaaaaaa-0000-0000-0000-000000000016', 'Bert''s Café', 'Bert''s', '', '2000 Bonisteel Blvd, Ann Arbor, MI 48109', '11111111-0000-0000-0000-000000000002', '{}'::jsonb, '{}', '{}', 'https://www.google.com/maps/search/?api=1&query=Bert%27s+Cafe+University+of+Michigan', 'https://maps.apple.com/?address=2000+Bonisteel+Blvd,+Ann+Arbor,+MI+48109', false, true, 1, 42.2931, -83.7107),
  ('aaaaaaaa-0000-0000-0000-000000000017', 'Blue Cafe East Quad', 'Blue Cafe EQ', '', '701 E University Ave, Ann Arbor, MI 48109', '11111111-0000-0000-0000-000000000002', '{}'::jsonb, '{}', '{}', 'https://www.google.com/maps/search/?api=1&query=Blue+Cafe+East+Quad+University+Michigan', 'https://maps.apple.com/?address=701+E+University+Ave,+Ann+Arbor,+MI+48109', false, true, 2, 42.2753, -83.7367),
  ('aaaaaaaa-0000-0000-0000-000000000018', 'Café 32', 'Café 32', '', '1032 Greene St, Ann Arbor, MI 48109', '11111111-0000-0000-0000-000000000002', '{}'::jsonb, '{}', '{}', 'https://www.google.com/maps/search/?api=1&query=Cafe+32+University+Michigan', 'https://maps.apple.com/?address=1032+Greene+St,+Ann+Arbor,+MI+48109', false, true, 3, 42.2817, -83.7351),
  ('aaaaaaaa-0000-0000-0000-000000000019', 'Darwin''s', 'Darwin''s', '', '315 Maynard St, Ann Arbor, MI 48104', '11111111-0000-0000-0000-000000000002', '{}'::jsonb, '{}', '{}', 'https://www.google.com/maps/search/?api=1&query=Darwin%27s+University+Michigan+Ann+Arbor', 'https://maps.apple.com/?address=315+Maynard+St,+Ann+Arbor,+MI+48104', false, true, 4, 42.2790, -83.7417),
  ('aaaaaaaa-0000-0000-0000-000000000020', 'Eigen Café', 'Eigen', '', '530 Church St, Ann Arbor, MI 48109', '11111111-0000-0000-0000-000000000002', '{}'::jsonb, '{}', '{}', 'https://www.google.com/maps/search/?api=1&query=Eigen+Cafe+University+Michigan', 'https://maps.apple.com/?address=530+Church+St,+Ann+Arbor,+MI+48109', false, true, 5, 42.2774, -83.7396),
  ('aaaaaaaa-0000-0000-0000-000000000021', 'Fireside Café', 'Fireside', '', '515 E Jefferson St, Ann Arbor, MI 48109', '11111111-0000-0000-0000-000000000002', '{}'::jsonb, '{}', '{}', 'https://www.google.com/maps/search/?api=1&query=Fireside+Cafe+University+Michigan', 'https://maps.apple.com/?address=515+E+Jefferson+St,+Ann+Arbor,+MI+48109', false, true, 6, 42.2769, -83.7387),
  ('aaaaaaaa-0000-0000-0000-000000000022', 'JavaBlu', 'JavaBlu', '', '3003 South State St, Ann Arbor, MI 48109', '11111111-0000-0000-0000-000000000002', '{}'::jsonb, '{}', '{}', 'https://www.google.com/maps/search/?api=1&query=JavaBlu+University+Michigan', 'https://maps.apple.com/?address=3003+South+State+St,+Ann+Arbor,+MI+48109', false, true, 7, 42.2685, -83.7453),
  ('aaaaaaaa-0000-0000-0000-000000000023', 'Mujo Café', 'Mujo', '', '500 S State St, Ann Arbor, MI 48109', '11111111-0000-0000-0000-000000000002', '{}'::jsonb, '{}', '{}', 'https://www.google.com/maps/search/?api=1&query=Mujo+Cafe+University+Michigan', 'https://maps.apple.com/?address=500+S+State+St,+Ann+Arbor,+MI+48109', false, true, 8, 42.2780, -83.7400),
  ('aaaaaaaa-0000-0000-0000-000000000024', 'UMMA Café', 'UMMA Café', '', '525 S State St, Ann Arbor, MI 48109', '11111111-0000-0000-0000-000000000002', '{}'::jsonb, '{}', '{}', 'https://www.google.com/maps/search/?api=1&query=UMMA+Cafe+University+Michigan+Museum+Art', 'https://maps.apple.com/?address=525+S+State+St,+Ann+Arbor,+MI+48109', false, true, 9, 42.2784, -83.7405);

-- Add missing Markets
INSERT INTO location (id, name, colloquial_name, description, address, type_id, regular_service_hours, methods_of_payment, meal_times, google_maps_link, apple_maps_link, force_close, has_menus, display_order, latitude, longitude)
VALUES
  ('aaaaaaaa-0000-0000-0000-000000000025', 'Blue Market at Bursley', 'Bursley Market', '', '1931 Duffield St, Ann Arbor, MI 48109', '11111111-0000-0000-0000-000000000004', '{}'::jsonb, '{}', '{}', 'https://www.google.com/maps/search/?api=1&query=Blue+Market+Bursley+University+Michigan', 'https://maps.apple.com/?address=1931+Duffield+St,+Ann+Arbor,+MI+48109', false, true, 1, 42.2929, -83.7158),
  ('aaaaaaaa-0000-0000-0000-000000000026', 'Blue Market at Michigan Union', 'Union Market', '', '530 S State St, Ann Arbor, MI 48109', '11111111-0000-0000-0000-000000000004', '{}'::jsonb, '{}', '{}', 'https://www.google.com/maps/search/?api=1&query=Blue+Market+Michigan+Union+Ann+Arbor', 'https://maps.apple.com/?address=530+S+State+St,+Ann+Arbor,+MI+48109', false, true, 2, 42.2765, -83.7405),
  ('aaaaaaaa-0000-0000-0000-000000000027', 'Blue Market at Munger', 'Munger Market', '', '1425 Wilmot St, Ann Arbor, MI 48104', '11111111-0000-0000-0000-000000000004', '{}'::jsonb, '{}', '{}', 'https://www.google.com/maps/search/?api=1&query=Blue+Market+Munger+University+Michigan', 'https://maps.apple.com/?address=1425+Wilmot+St,+Ann+Arbor,+MI+48104', false, true, 3, 42.2714, -83.7296),
  ('aaaaaaaa-0000-0000-0000-000000000028', 'Blue Cafe and Market at Mosher-Jordan', 'MoJo Market', '', '1500 Washington Heights, Ann Arbor, MI 48104', '11111111-0000-0000-0000-000000000004', '{}'::jsonb, '{}', '{}', 'https://www.google.com/maps/search/?api=1&query=Blue+Cafe+Market+Mosher+Jordan+Michigan', 'https://maps.apple.com/?address=1500+Washington+Heights,+Ann+Arbor,+MI+48104', false, true, 4, 42.2820, -83.7298),
  ('aaaaaaaa-0000-0000-0000-000000000029', 'Maizie''s Kitchen and Market', 'Maizie''s', '', '3003 South State St, Ann Arbor, MI 48109', '11111111-0000-0000-0000-000000000004', '{}'::jsonb, '{}', '{}', 'https://www.google.com/maps/search/?api=1&query=Maizie%27s+Kitchen+Market+University+Michigan', 'https://maps.apple.com/?address=3003+South+State+St,+Ann+Arbor,+MI+48109', false, true, 5, 42.2685, -83.7453),
  ('aaaaaaaa-0000-0000-0000-000000000030', 'PharmFresh', 'PharmFresh', '', '428 Church St, Ann Arbor, MI 48109', '11111111-0000-0000-0000-000000000004', '{}'::jsonb, '{}', '{}', 'https://www.google.com/maps/search/?api=1&query=PharmFresh+University+Michigan', 'https://maps.apple.com/?address=428+Church+St,+Ann+Arbor,+MI+48109', false, true, 6, 42.2804, -83.7380);

-- Add Petrovich Family Grill (Food Court type)
INSERT INTO location (id, name, colloquial_name, description, address, type_id, regular_service_hours, methods_of_payment, meal_times, google_maps_link, apple_maps_link, force_close, has_menus, display_order, latitude, longitude)
VALUES
  ('aaaaaaaa-0000-0000-0000-000000000031', 'Petrovich Family Grill', 'Petrovich Grill', 'Enjoy a peaceful meal at the University of Michigan golf course!', '3025 Glazier Way, Ann Arbor, MI 48105', '11111111-0000-0000-0000-000000000003', '{}'::jsonb, '{}', '{}', 'https://www.google.com/maps/search/?api=1&query=Petrovich+Family+Grill+University+Michigan+Golf', 'https://maps.apple.com/?address=3025+Glazier+Way,+Ann+Arbor,+MI+48105', false, true, 3, 42.3025, -83.6920);
