-- One-time cleanup of accumulated per-device rows.
--
-- device_id is app-local and regenerates on every reinstall, while favorites
-- re-sync on launch, so repeatedly deleting/reinstalling the dev app left
-- orphaned rows in user_devices + device_*_favorites (each tied to a dead
-- push token from an old install) and their dedup entries in device_alert_log.
-- Those ghosts were the source of duplicate closing-soon/opening-now pushes.
--
-- The push-token-keyed dedup in favorite-alerts-dispatch already prevents
-- duplicate delivery going forward; this just wipes the stale state so the
-- current install starts from a clean slate. Safe to run on a fresh DB (the
-- tables are simply empty). Re-favorite in the current install afterward.
truncate table
  public.user_devices,
  public.device_location_favorites,
  public.device_food_favorites,
  public.device_alert_log;
