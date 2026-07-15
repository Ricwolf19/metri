CREATE TABLE `sync_deletions` (
	`id` text PRIMARY KEY NOT NULL,
	`table_name` text NOT NULL,
	`row_id` text NOT NULL,
	`deleted_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`pushed_at` integer
);
--> statement-breakpoint
CREATE INDEX `idx_sync_deletions_pushed` ON `sync_deletions` (`pushed_at`);--> statement-breakpoint
ALTER TABLE `routines` ADD `updated_at` integer;--> statement-breakpoint
ALTER TABLE `set_logs` ADD `updated_at` integer;--> statement-breakpoint
ALTER TABLE `workout_days` ADD `updated_at` integer;--> statement-breakpoint
ALTER TABLE `workout_logs` ADD `updated_at` integer;