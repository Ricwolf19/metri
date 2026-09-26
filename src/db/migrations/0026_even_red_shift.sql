CREATE TABLE `calculation_history` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`calc_id` text NOT NULL,
	`inputs` text NOT NULL,
	`primary_value` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_calculation_history_user` ON `calculation_history` (`user_id`,`calc_id`);--> statement-breakpoint
CREATE TABLE `exercise_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`note` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_exercise_notes_user_exercise` ON `exercise_notes` (`user_id`,`exercise_id`);