CREATE TABLE `progress_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`uri` text NOT NULL,
	`thumb_uri` text NOT NULL,
	`taken_at` text NOT NULL,
	`weight_kg` real,
	`note` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
