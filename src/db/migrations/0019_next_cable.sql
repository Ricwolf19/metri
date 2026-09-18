PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text,
	`auth_kind` text DEFAULT 'remote' NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`plan` text DEFAULT 'free' NOT NULL,
	`display_name` text,
	`avatar_uri` text,
	`avatar_color` text,
	`avatar_id` text,
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
INSERT INTO `__new_users`("id", "email", "auth_kind", "role", "plan", "display_name", "avatar_uri", "avatar_color", "avatar_id", "sex", "age", "height_cm", "weight_kg", "activity_level", "body_fat_pct", "bmr", "tdee", "bmr_formula", "bmr_computed_at", "onboarded_at", "created_at", "updated_at") SELECT "id", "email", "auth_kind", "role", "plan", "display_name", "avatar_uri", "avatar_color", "avatar_id", "sex", "age", "height_cm", "weight_kg", "activity_level", "body_fat_pct", "bmr", "tdee", "bmr_formula", "bmr_computed_at", "onboarded_at", "created_at", "updated_at" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);