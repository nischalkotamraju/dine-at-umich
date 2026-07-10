-- Correct location addresses that were wrong (previously copied from an
-- earlier, stale seed migration instead of the real physical address of
-- each dining hall / café / grill / market).

UPDATE "public"."location" SET "address" = '1503 Washington Heights, Ann Arbor, MI 48109' WHERE "id" = 'aaaaaaaa-0000-0000-0000-000000000003'; -- Markley Dining Hall
UPDATE "public"."location" SET "address" = '200 Observatory St, Ann Arbor, MI 48109' WHERE "id" = 'aaaaaaaa-0000-0000-0000-000000000006'; -- Mosher-Jordan Dining Hall
UPDATE "public"."location" SET "address" = '600 E Madison St, Ann Arbor, MI 48109' WHERE "id" = 'aaaaaaaa-0000-0000-0000-000000000005'; -- South Quad Dining Hall
UPDATE "public"."location" SET "address" = '619 Oxford Rd, Ann Arbor, MI 48109-2634' WHERE "id" = 'aaaaaaaa-0000-0000-0000-000000000014'; -- Twigs at Oxford

UPDATE "public"."location" SET "address" = '919 S University Ave, Ann Arbor, MI 48109' WHERE "id" = 'aaaaaaaa-0000-0000-0000-000000000016'; -- Bert's Café
UPDATE "public"."location" SET "address" = '200 Observatory St, Ann Arbor, MI 48109' WHERE "id" = 'aaaaaaaa-0000-0000-0000-000000000028'; -- Blue Café and Market at Mosher-Jordan
UPDATE "public"."location" SET "address" = 'G052 Dental School, 1011 N University Ave, Ann Arbor, MI 48109' WHERE "id" = 'aaaaaaaa-0000-0000-0000-000000000018'; -- Café 32
UPDATE "public"."location" SET "address" = 'Biological Sciences Building, 1105 N University Ave, Ann Arbor, MI 48109' WHERE "id" = 'aaaaaaaa-0000-0000-0000-000000000019'; -- Darwin's
UPDATE "public"."location" SET "address" = 'Ford Robotics Building, 2505 Hayward St, Ann Arbor, MI 48109' WHERE "id" = 'aaaaaaaa-0000-0000-0000-000000000020'; -- Eigen Café
UPDATE "public"."location" SET "address" = 'Pierpont Commons, 2101 Bonisteel Blvd, Ann Arbor, MI 48109' WHERE "id" = 'aaaaaaaa-0000-0000-0000-000000000021'; -- Fireside Café
UPDATE "public"."location" SET "address" = 'Taubman Health Sciences Library, 1135 Catherine St, Ann Arbor, MI 48109' WHERE "id" = 'aaaaaaaa-0000-0000-0000-000000000022'; -- JavaBlu
UPDATE "public"."location" SET "address" = 'Duderstadt Center, 2281 Bonisteel Blvd, Ann Arbor, MI 48105' WHERE "id" = 'aaaaaaaa-0000-0000-0000-000000000023'; -- Mujo Café
UPDATE "public"."location" SET "address" = 'Michigan League, 911 N University Ave, Ann Arbor, MI 48109' WHERE "id" = 'aaaaaaaa-0000-0000-0000-000000000029'; -- Maizie's Kitchen & Market

UPDATE "public"."location" SET "address" = '500 E Stadium Blvd, Ann Arbor, MI 48104' WHERE "id" = 'aaaaaaaa-0000-0000-0000-000000000031'; -- Petrovich Family Grill

UPDATE "public"."location" SET "address" = '540 Thompson St, Ann Arbor, MI 48104' WHERE "id" = 'aaaaaaaa-0000-0000-0000-000000000027'; -- Blue Market at Munger
UPDATE "public"."location" SET "address" = '1007 E Huron St, Ann Arbor, MI 48104' WHERE "id" = 'aaaaaaaa-0000-0000-0000-000000000030'; -- PharmFresh
