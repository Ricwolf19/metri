CREATE TABLE `users` (
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
	`bmr` real,
	`tdee` real,
	`bmr_formula` text,
	`bmr_computed_at` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);