-- Corrects methods_of_payment for every location against the official Michigan
-- Dining currency table (Dining Dollars + Blue Bucks) plus per-location
-- credit/debit rules.
--
-- Rules applied:
--  * Cash is never a real purchase method here — the only "cash" use is loading
--    Blue Bucks at a kiosk — so it is intentionally excluded everywhere.
--  * Every location takes Blue Bucks (MCard), Dining Dollars, and Credit/Debit
--    by default (residential halls via the premium door rate).
--  * Two exceptions: Eigen Café takes no Dining Dollars; Martha Cook Dining Hall
--    takes no outside Credit/Debit (residents & escorted guests only).
--  * JavaBlu is treated as OPEN (it is on MDining, has live hours, and is
--    scraped daily — a claimed "permanent closure" was incorrect).

-- Default for all 28 locations.
update public.location
set methods_of_payment = array['MCard', 'Dining Dollars', 'Credit/Debit']::payment_method[];

-- Eigen Café (Ford Robotics Building): no Dining Dollars.
update public.location
set methods_of_payment = array['MCard', 'Credit/Debit']::payment_method[]
where name = 'Eigen Café';

-- Martha Cook Dining Hall: no outside Credit/Debit (residents & escorted guests only).
update public.location
set methods_of_payment = array['MCard', 'Dining Dollars']::payment_method[]
where name = 'Martha Cook Dining Hall';
