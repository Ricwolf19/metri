CREATE TABLE `training_days` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`status` text NOT NULL,
	`skip_reason` text,
	`note` text,
	`workout_log_id` text,
	`workout_day_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_training_days_user` ON `training_days` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_training_days_user_date` ON `training_days` (`user_id`,`date`);