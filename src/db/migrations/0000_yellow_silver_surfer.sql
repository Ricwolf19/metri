CREATE TABLE `app_meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
