CREATE TABLE `location_hours` (
	`location_id` text NOT NULL,
	`date` text NOT NULL,
	`is_closed` integer DEFAULT false NOT NULL,
	`blocks` text DEFAULT '[]' NOT NULL,
	PRIMARY KEY(`location_id`, `date`)
);
