CREATE TABLE `reminders` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`body` text,
	`frequency` text DEFAULT 'daily' NOT NULL,
	`hour` integer DEFAULT 8 NOT NULL,
	`minute` integer DEFAULT 0 NOT NULL,
	`weekday` integer,
	`enabled` integer DEFAULT true NOT NULL,
	`notification_id` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
