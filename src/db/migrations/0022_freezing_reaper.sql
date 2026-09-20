CREATE TABLE `exercise_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`rest_seconds` integer,
	`badges` text,
	`alternative_exercise_ids` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_exercise_settings_user` ON `exercise_settings` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_exercise_settings_user_exercise` ON `exercise_settings` (`user_id`,`exercise_id`);