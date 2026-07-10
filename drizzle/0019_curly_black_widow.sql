CREATE TABLE `location_favorites` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`location_name` text NOT NULL,
	`date_added` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `location_favorites_location_name_unique` ON `location_favorites` (`location_name`);
