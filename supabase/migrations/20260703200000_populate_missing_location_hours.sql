-- Populate real regular_service_hours for locations that were inserted with
-- an empty '{}' placeholder in insert_missing_locations.sql (cafes, markets,
-- the grill, and 2 additional dining halls). Source: dining.umich.edu's
-- "Summer 2026 Hours of Operation" page (in effect June 28 - Aug 20, 2026)
-- and, for the two select-access residential halls, the year-round
-- "Regular Hours" page (their weekday schedule matches observed live scrape
-- data, unlike the summer page's generic "Closed" entry for them).
--
-- Petrovich Family Grill is intentionally left as '{}' — its hours are
-- explicitly "weather dependent" per the site, with no fixed weekly
-- schedule, only a live "Today's Hours" widget.

-- Fully closed for the current term
UPDATE location SET regular_service_hours = '{
  "monday": {"isClosed": true, "timeRanges": []},
  "tuesday": {"isClosed": true, "timeRanges": []},
  "wednesday": {"isClosed": true, "timeRanges": []},
  "thursday": {"isClosed": true, "timeRanges": []},
  "friday": {"isClosed": true, "timeRanges": []},
  "saturday": {"isClosed": true, "timeRanges": []},
  "sunday": {"isClosed": true, "timeRanges": []}
}'::jsonb
WHERE name IN ('Twigs at Oxford', 'Wolverine Village Dining Hall', 'Lawyers Club Dining Hall', 'Fireside Café', 'Blue Market at Bursley');

-- Martha Cook Dining Hall (select access) — Mon-Fri Breakfast/Lunch/Dinner, closed weekends
UPDATE location SET regular_service_hours = '{
  "monday": {"isClosed": false, "timeRanges": [{"open": 700, "close": 915}, {"open": 1100, "close": 1630}, {"open": 1630, "close": 1930}]},
  "tuesday": {"isClosed": false, "timeRanges": [{"open": 700, "close": 915}, {"open": 1100, "close": 1630}, {"open": 1630, "close": 1930}]},
  "wednesday": {"isClosed": false, "timeRanges": [{"open": 700, "close": 915}, {"open": 1100, "close": 1630}, {"open": 1630, "close": 1930}]},
  "thursday": {"isClosed": false, "timeRanges": [{"open": 700, "close": 915}, {"open": 1100, "close": 1630}, {"open": 1630, "close": 1930}]},
  "friday": {"isClosed": false, "timeRanges": [{"open": 700, "close": 915}, {"open": 1100, "close": 1630}, {"open": 1630, "close": 1930}]},
  "saturday": {"isClosed": true, "timeRanges": []},
  "sunday": {"isClosed": true, "timeRanges": []}
}'::jsonb
WHERE name = 'Martha Cook Dining Hall';

-- Bert's Café — Mon-Fri 10am-2pm
UPDATE location SET regular_service_hours = '{
  "monday": {"isClosed": false, "timeRanges": [{"open": 1000, "close": 1400}]},
  "tuesday": {"isClosed": false, "timeRanges": [{"open": 1000, "close": 1400}]},
  "wednesday": {"isClosed": false, "timeRanges": [{"open": 1000, "close": 1400}]},
  "thursday": {"isClosed": false, "timeRanges": [{"open": 1000, "close": 1400}]},
  "friday": {"isClosed": false, "timeRanges": [{"open": 1000, "close": 1400}]},
  "saturday": {"isClosed": true, "timeRanges": []},
  "sunday": {"isClosed": true, "timeRanges": []}
}'::jsonb
WHERE name = 'Bert''s Café';

-- Blue Cafe East Quad — Mon-Fri 11:30am-4:30pm
UPDATE location SET regular_service_hours = '{
  "monday": {"isClosed": false, "timeRanges": [{"open": 1130, "close": 1630}]},
  "tuesday": {"isClosed": false, "timeRanges": [{"open": 1130, "close": 1630}]},
  "wednesday": {"isClosed": false, "timeRanges": [{"open": 1130, "close": 1630}]},
  "thursday": {"isClosed": false, "timeRanges": [{"open": 1130, "close": 1630}]},
  "friday": {"isClosed": false, "timeRanges": [{"open": 1130, "close": 1630}]},
  "saturday": {"isClosed": true, "timeRanges": []},
  "sunday": {"isClosed": true, "timeRanges": []}
}'::jsonb
WHERE name = 'Blue Cafe East Quad';

-- Café 32 — Mon-Fri 7:30am-2pm
UPDATE location SET regular_service_hours = '{
  "monday": {"isClosed": false, "timeRanges": [{"open": 730, "close": 1400}]},
  "tuesday": {"isClosed": false, "timeRanges": [{"open": 730, "close": 1400}]},
  "wednesday": {"isClosed": false, "timeRanges": [{"open": 730, "close": 1400}]},
  "thursday": {"isClosed": false, "timeRanges": [{"open": 730, "close": 1400}]},
  "friday": {"isClosed": false, "timeRanges": [{"open": 730, "close": 1400}]},
  "saturday": {"isClosed": true, "timeRanges": []},
  "sunday": {"isClosed": true, "timeRanges": []}
}'::jsonb
WHERE name = 'Café 32';

-- Darwin's — Mon-Fri 8:30am-2:30pm
UPDATE location SET regular_service_hours = '{
  "monday": {"isClosed": false, "timeRanges": [{"open": 830, "close": 1430}]},
  "tuesday": {"isClosed": false, "timeRanges": [{"open": 830, "close": 1430}]},
  "wednesday": {"isClosed": false, "timeRanges": [{"open": 830, "close": 1430}]},
  "thursday": {"isClosed": false, "timeRanges": [{"open": 830, "close": 1430}]},
  "friday": {"isClosed": false, "timeRanges": [{"open": 830, "close": 1430}]},
  "saturday": {"isClosed": true, "timeRanges": []},
  "sunday": {"isClosed": true, "timeRanges": []}
}'::jsonb
WHERE name = 'Darwin''s';

-- Eigen Café — 24/7 kiosk
UPDATE location SET regular_service_hours = '{
  "monday": {"isClosed": false, "timeRanges": [{"open": 0, "close": 2400}]},
  "tuesday": {"isClosed": false, "timeRanges": [{"open": 0, "close": 2400}]},
  "wednesday": {"isClosed": false, "timeRanges": [{"open": 0, "close": 2400}]},
  "thursday": {"isClosed": false, "timeRanges": [{"open": 0, "close": 2400}]},
  "friday": {"isClosed": false, "timeRanges": [{"open": 0, "close": 2400}]},
  "saturday": {"isClosed": false, "timeRanges": [{"open": 0, "close": 2400}]},
  "sunday": {"isClosed": false, "timeRanges": [{"open": 0, "close": 2400}]}
}'::jsonb
WHERE name = 'Eigen Café';

-- JavaBlu — Mon-Fri 8am-2pm
UPDATE location SET regular_service_hours = '{
  "monday": {"isClosed": false, "timeRanges": [{"open": 800, "close": 1400}]},
  "tuesday": {"isClosed": false, "timeRanges": [{"open": 800, "close": 1400}]},
  "wednesday": {"isClosed": false, "timeRanges": [{"open": 800, "close": 1400}]},
  "thursday": {"isClosed": false, "timeRanges": [{"open": 800, "close": 1400}]},
  "friday": {"isClosed": false, "timeRanges": [{"open": 800, "close": 1400}]},
  "saturday": {"isClosed": true, "timeRanges": []},
  "sunday": {"isClosed": true, "timeRanges": []}
}'::jsonb
WHERE name = 'JavaBlu';

-- Mujo Café — Mon-Fri 8am-4pm
UPDATE location SET regular_service_hours = '{
  "monday": {"isClosed": false, "timeRanges": [{"open": 800, "close": 1600}]},
  "tuesday": {"isClosed": false, "timeRanges": [{"open": 800, "close": 1600}]},
  "wednesday": {"isClosed": false, "timeRanges": [{"open": 800, "close": 1600}]},
  "thursday": {"isClosed": false, "timeRanges": [{"open": 800, "close": 1600}]},
  "friday": {"isClosed": false, "timeRanges": [{"open": 800, "close": 1600}]},
  "saturday": {"isClosed": true, "timeRanges": []},
  "sunday": {"isClosed": true, "timeRanges": []}
}'::jsonb
WHERE name = 'Mujo Café';

-- UMMA Café — Monday closed, Tue-Fri 9am-3pm, Sat-Sun 12pm-4pm
UPDATE location SET regular_service_hours = '{
  "monday": {"isClosed": true, "timeRanges": []},
  "tuesday": {"isClosed": false, "timeRanges": [{"open": 900, "close": 1500}]},
  "wednesday": {"isClosed": false, "timeRanges": [{"open": 900, "close": 1500}]},
  "thursday": {"isClosed": false, "timeRanges": [{"open": 900, "close": 1500}]},
  "friday": {"isClosed": false, "timeRanges": [{"open": 900, "close": 1500}]},
  "saturday": {"isClosed": false, "timeRanges": [{"open": 1200, "close": 1600}]},
  "sunday": {"isClosed": false, "timeRanges": [{"open": 1200, "close": 1600}]}
}'::jsonb
WHERE name = 'UMMA Café';

-- Blue Market at Michigan Union — Mon-Fri 9am-3pm
UPDATE location SET regular_service_hours = '{
  "monday": {"isClosed": false, "timeRanges": [{"open": 900, "close": 1500}]},
  "tuesday": {"isClosed": false, "timeRanges": [{"open": 900, "close": 1500}]},
  "wednesday": {"isClosed": false, "timeRanges": [{"open": 900, "close": 1500}]},
  "thursday": {"isClosed": false, "timeRanges": [{"open": 900, "close": 1500}]},
  "friday": {"isClosed": false, "timeRanges": [{"open": 900, "close": 1500}]},
  "saturday": {"isClosed": true, "timeRanges": []},
  "sunday": {"isClosed": true, "timeRanges": []}
}'::jsonb
WHERE name = 'Blue Market at Michigan Union';

-- Blue Market at Pierpont Commons — Mon-Fri 9am-3pm
UPDATE location SET regular_service_hours = '{
  "monday": {"isClosed": false, "timeRanges": [{"open": 900, "close": 1500}]},
  "tuesday": {"isClosed": false, "timeRanges": [{"open": 900, "close": 1500}]},
  "wednesday": {"isClosed": false, "timeRanges": [{"open": 900, "close": 1500}]},
  "thursday": {"isClosed": false, "timeRanges": [{"open": 900, "close": 1500}]},
  "friday": {"isClosed": false, "timeRanges": [{"open": 900, "close": 1500}]},
  "saturday": {"isClosed": true, "timeRanges": []},
  "sunday": {"isClosed": true, "timeRanges": []}
}'::jsonb
WHERE name = 'Blue Market at Pierpont Commons';

-- Blue Market at Munger — 24/7 kiosk
UPDATE location SET regular_service_hours = '{
  "monday": {"isClosed": false, "timeRanges": [{"open": 0, "close": 2400}]},
  "tuesday": {"isClosed": false, "timeRanges": [{"open": 0, "close": 2400}]},
  "wednesday": {"isClosed": false, "timeRanges": [{"open": 0, "close": 2400}]},
  "thursday": {"isClosed": false, "timeRanges": [{"open": 0, "close": 2400}]},
  "friday": {"isClosed": false, "timeRanges": [{"open": 0, "close": 2400}]},
  "saturday": {"isClosed": false, "timeRanges": [{"open": 0, "close": 2400}]},
  "sunday": {"isClosed": false, "timeRanges": [{"open": 0, "close": 2400}]}
}'::jsonb
WHERE name = 'Blue Market at Munger';

-- Blue Cafe and Market at Mosher-Jordan — daily 1pm-9pm
UPDATE location SET regular_service_hours = '{
  "monday": {"isClosed": false, "timeRanges": [{"open": 1300, "close": 2100}]},
  "tuesday": {"isClosed": false, "timeRanges": [{"open": 1300, "close": 2100}]},
  "wednesday": {"isClosed": false, "timeRanges": [{"open": 1300, "close": 2100}]},
  "thursday": {"isClosed": false, "timeRanges": [{"open": 1300, "close": 2100}]},
  "friday": {"isClosed": false, "timeRanges": [{"open": 1300, "close": 2100}]},
  "saturday": {"isClosed": false, "timeRanges": [{"open": 1300, "close": 2100}]},
  "sunday": {"isClosed": false, "timeRanges": [{"open": 1300, "close": 2100}]}
}'::jsonb
WHERE name = 'Blue Cafe and Market at Mosher-Jordan';

-- Maizie's Kitchen and Market — Mon-Fri 8am-2pm
UPDATE location SET regular_service_hours = '{
  "monday": {"isClosed": false, "timeRanges": [{"open": 800, "close": 1400}]},
  "tuesday": {"isClosed": false, "timeRanges": [{"open": 800, "close": 1400}]},
  "wednesday": {"isClosed": false, "timeRanges": [{"open": 800, "close": 1400}]},
  "thursday": {"isClosed": false, "timeRanges": [{"open": 800, "close": 1400}]},
  "friday": {"isClosed": false, "timeRanges": [{"open": 800, "close": 1400}]},
  "saturday": {"isClosed": true, "timeRanges": []},
  "sunday": {"isClosed": true, "timeRanges": []}
}'::jsonb
WHERE name = 'Maizie''s Kitchen and Market';

-- PharmFresh — 24/7 kiosk
UPDATE location SET regular_service_hours = '{
  "monday": {"isClosed": false, "timeRanges": [{"open": 0, "close": 2400}]},
  "tuesday": {"isClosed": false, "timeRanges": [{"open": 0, "close": 2400}]},
  "wednesday": {"isClosed": false, "timeRanges": [{"open": 0, "close": 2400}]},
  "thursday": {"isClosed": false, "timeRanges": [{"open": 0, "close": 2400}]},
  "friday": {"isClosed": false, "timeRanges": [{"open": 0, "close": 2400}]},
  "saturday": {"isClosed": false, "timeRanges": [{"open": 0, "close": 2400}]},
  "sunday": {"isClosed": false, "timeRanges": [{"open": 0, "close": 2400}]}
}'::jsonb
WHERE name = 'PharmFresh';
