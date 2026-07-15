PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_week_configs` (
	`id` text PRIMARY KEY NOT NULL,
	`workout_day_exercise_id` text NOT NULL,
	`week_number` integer NOT NULL,
	`sets` integer NOT NULL,
	`reps` integer NOT NULL,
	`reps_max` integer,
	`rir_min` integer,
	`rir_max` integer,
	`to_failure` integer DEFAULT false NOT NULL,
	`rest_seconds` integer,
	`intensity_type` text DEFAULT 'rir' NOT NULL,
	`intensity_value` real,
	`user_program_id` text,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_week_configs`("id", "workout_day_exercise_id", "week_number", "sets", "reps", "rir_min", "rir_max", "to_failure", "rest_seconds", "intensity_type", "intensity_value", "user_program_id", "updated_at") SELECT "id", "workout_day_exercise_id", "week_number", "sets", "reps", "rir_min", "rir_max", "to_failure", "rest_seconds", "intensity_type", "intensity_value", "user_program_id", (unixepoch() * 1000) FROM `week_configs`;--> statement-breakpoint
DROP TABLE `week_configs`;--> statement-breakpoint
ALTER TABLE `__new_week_configs` RENAME TO `week_configs`;--> statement-breakpoint
CREATE INDEX `idx_week_configs_slot` ON `week_configs` (`workout_day_exercise_id`);--> statement-breakpoint
CREATE TABLE `__new_workout_day_exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`workout_day_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`order_index` integer DEFAULT 0 NOT NULL,
	`default_rest_seconds` integer DEFAULT 120,
	`notes` text,
	`badges` text,
	`user_program_id` text,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_workout_day_exercises`("id", "workout_day_id", "exercise_id", "order_index", "default_rest_seconds", "notes", "user_program_id", "updated_at") SELECT "id", "workout_day_id", "exercise_id", "order_index", "default_rest_seconds", "notes", "user_program_id", (unixepoch() * 1000) FROM `workout_day_exercises`;--> statement-breakpoint
DROP TABLE `workout_day_exercises`;--> statement-breakpoint
ALTER TABLE `__new_workout_day_exercises` RENAME TO `workout_day_exercises`;--> statement-breakpoint
CREATE INDEX `idx_workout_day_exercises_day` ON `workout_day_exercises` (`workout_day_id`);--> statement-breakpoint
PRAGMA foreign_keys=ON;
