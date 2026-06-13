PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_app_meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_app_meta`("key", "value", "updated_at") SELECT "key", "value", CAST(unixepoch("updated_at") * 1000 AS INTEGER) FROM `app_meta`;--> statement-breakpoint
DROP TABLE `app_meta`;--> statement-breakpoint
ALTER TABLE `__new_app_meta` RENAME TO `app_meta`;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`password_salt` text NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`display_name` text,
	`avatar_uri` text,
	`avatar_color` text,
	`sex` text,
	`age` integer,
	`height_cm` real,
	`weight_kg` real,
	`activity_level` text,
	`body_fat_pct` real,
	`bmr` real,
	`tdee` real,
	`bmr_formula` text,
	`bmr_computed_at` integer,
	`onboarded_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "email", "username", "password_hash", "password_salt", "role", "display_name", "avatar_uri", "avatar_color", "sex", "age", "height_cm", "weight_kg", "activity_level", "body_fat_pct", "bmr", "tdee", "bmr_formula", "bmr_computed_at", "onboarded_at", "created_at", "updated_at") SELECT "id", "email", "username", "password_hash", "password_salt", "role", "display_name", "avatar_uri", "avatar_color", "sex", "age", "height_cm", "weight_kg", "activity_level", "body_fat_pct", "bmr", "tdee", "bmr_formula", CAST(unixepoch("bmr_computed_at") * 1000 AS INTEGER), CAST(unixepoch("onboarded_at") * 1000 AS INTEGER), CAST(unixepoch("created_at") * 1000 AS INTEGER), CAST(unixepoch("updated_at") * 1000 AS INTEGER) FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE TABLE `__new_reminders` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`body` text,
	`frequency` text DEFAULT 'daily' NOT NULL,
	`hour` integer DEFAULT 8 NOT NULL,
	`minute` integer DEFAULT 0 NOT NULL,
	`weekdays` text,
	`enabled` integer DEFAULT true NOT NULL,
	`notification_ids` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_reminders`("id", "user_id", "title", "body", "frequency", "hour", "minute", "weekdays", "enabled", "notification_ids", "created_at", "updated_at") SELECT "id", "user_id", "title", "body", "frequency", "hour", "minute", "weekdays", "enabled", "notification_ids", CAST(unixepoch("created_at") * 1000 AS INTEGER), CAST(unixepoch("updated_at") * 1000 AS INTEGER) FROM `reminders`;--> statement-breakpoint
DROP TABLE `reminders`;--> statement-breakpoint
ALTER TABLE `__new_reminders` RENAME TO `reminders`;--> statement-breakpoint
CREATE TABLE `__new_progress_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`uri` text NOT NULL,
	`thumb_uri` text NOT NULL,
	`taken_at` integer NOT NULL,
	`weight_kg` real,
	`note` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_progress_photos`("id", "user_id", "uri", "thumb_uri", "taken_at", "weight_kg", "note", "created_at") SELECT "id", "user_id", "uri", "thumb_uri", CAST(unixepoch("taken_at") * 1000 AS INTEGER), "weight_kg", "note", CAST(unixepoch("created_at") * 1000 AS INTEGER) FROM `progress_photos`;--> statement-breakpoint
DROP TABLE `progress_photos`;--> statement-breakpoint
ALTER TABLE `__new_progress_photos` RENAME TO `progress_photos`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
