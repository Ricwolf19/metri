CREATE TABLE `body_metrics` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`weight_kg` real,
	`body_fat_pct` real,
	`note` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_body_metrics_user` ON `body_metrics` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_body_metrics_user_date` ON `body_metrics` (`user_id`,`date`);