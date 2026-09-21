CREATE TABLE `body_goals` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`phase` text NOT NULL,
	`start_date` text NOT NULL,
	`start_weight_kg` real NOT NULL,
	`rate_kg_per_week` real NOT NULL,
	`duration_weeks` integer NOT NULL,
	`checkin_weekday` integer NOT NULL,
	`training_level` text,
	`body_fat_pct_at_start` real,
	`tdee_at_start` real,
	`target_kcal` real NOT NULL,
	`protein_g` real NOT NULL,
	`fat_g` real NOT NULL,
	`carbs_g` real NOT NULL,
	`adjustments` text,
	`ended_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_body_goals_user` ON `body_goals` (`user_id`);--> statement-breakpoint
CREATE TABLE `body_measurements` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`site` text NOT NULL,
	`value_cm` real NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_body_measurements_user` ON `body_measurements` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_body_measurements_user_date_site` ON `body_measurements` (`user_id`,`date`,`site`);