CREATE TABLE `progress_checkins` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`note` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_progress_checkins_user_date` ON `progress_checkins` (`user_id`,`date`);--> statement-breakpoint
ALTER TABLE `progress_photos` ADD `checkin_id` text;--> statement-breakpoint
ALTER TABLE `progress_photos` ADD `kind` text DEFAULT 'photo' NOT NULL;--> statement-breakpoint
ALTER TABLE `progress_photos` ADD `pose` text;--> statement-breakpoint
ALTER TABLE `progress_photos` ADD `width` integer;--> statement-breakpoint
ALTER TABLE `progress_photos` ADD `height` integer;--> statement-breakpoint
ALTER TABLE `progress_photos` ADD `duration_ms` integer;--> statement-breakpoint
ALTER TABLE `progress_photos` ADD `align` text;--> statement-breakpoint
CREATE INDEX `idx_progress_photos_checkin` ON `progress_photos` (`checkin_id`);