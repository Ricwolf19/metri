CREATE TABLE `warmup_routines` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`steps` text NOT NULL,
	`order_index` integer DEFAULT 0 NOT NULL,
	`is_custom` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_warmup_routines_user` ON `warmup_routines` (`user_id`);