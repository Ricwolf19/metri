CREATE TABLE `exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`primary_muscles` text,
	`secondary_muscles` text,
	`equipment` text,
	`image_url` text,
	`instructions` text,
	`is_custom` integer DEFAULT false NOT NULL,
	`user_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_exercises_category` ON `exercises` (`category`);--> statement-breakpoint
CREATE INDEX `idx_exercises_name` ON `exercises` (`name`);--> statement-breakpoint
CREATE TABLE `programs` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`duration_weeks` integer,
	`difficulty` text,
	`goal` text,
	`is_custom` integer DEFAULT false NOT NULL,
	`user_id` text,
	`user_program_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_programs_user_program` ON `programs` (`user_program_id`);--> statement-breakpoint
CREATE TABLE `routines` (
	`id` text PRIMARY KEY NOT NULL,
	`program_id` text NOT NULL,
	`name` text NOT NULL,
	`order_index` integer DEFAULT 0 NOT NULL,
	`duration_weeks` integer DEFAULT 4 NOT NULL,
	`user_program_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_routines_program` ON `routines` (`program_id`);--> statement-breakpoint
CREATE TABLE `set_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`workout_log_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`set_number` integer NOT NULL,
	`weight_kg` real NOT NULL,
	`reps` integer NOT NULL,
	`rpe` integer,
	`rir` integer,
	`is_warmup` integer DEFAULT false NOT NULL,
	`is_failure` integer DEFAULT false NOT NULL,
	`notes` text,
	`rest_before_seconds` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_set_logs_workout` ON `set_logs` (`workout_log_id`);--> statement-breakpoint
CREATE INDEX `idx_set_logs_exercise` ON `set_logs` (`exercise_id`);--> statement-breakpoint
CREATE TABLE `user_programs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`program_id` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`started_at` integer,
	`completed_at` integer,
	`current_routine_id` text,
	`current_week` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_user_programs_user` ON `user_programs` (`user_id`);--> statement-breakpoint
CREATE TABLE `week_configs` (
	`id` text PRIMARY KEY NOT NULL,
	`workout_day_exercise_id` text NOT NULL,
	`week_number` integer NOT NULL,
	`sets` integer NOT NULL,
	`reps` integer NOT NULL,
	`rir_min` integer,
	`rir_max` integer,
	`to_failure` integer DEFAULT false NOT NULL,
	`rest_seconds` integer,
	`intensity_type` text DEFAULT 'rir' NOT NULL,
	`intensity_value` real,
	`user_program_id` text
);
--> statement-breakpoint
CREATE INDEX `idx_week_configs_slot` ON `week_configs` (`workout_day_exercise_id`);--> statement-breakpoint
CREATE TABLE `workout_day_exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`workout_day_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`order_index` integer DEFAULT 0 NOT NULL,
	`default_rest_seconds` integer DEFAULT 120,
	`notes` text,
	`user_program_id` text
);
--> statement-breakpoint
CREATE INDEX `idx_workout_day_exercises_day` ON `workout_day_exercises` (`workout_day_id`);--> statement-breakpoint
CREATE TABLE `workout_days` (
	`id` text PRIMARY KEY NOT NULL,
	`routine_id` text NOT NULL,
	`name` text NOT NULL,
	`focus_muscles` text,
	`order_index` integer DEFAULT 0 NOT NULL,
	`user_program_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_workout_days_routine` ON `workout_days` (`routine_id`);--> statement-breakpoint
CREATE TABLE `workout_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`user_program_id` text NOT NULL,
	`workout_day_id` text NOT NULL,
	`status` text DEFAULT 'in_progress' NOT NULL,
	`week_number` integer NOT NULL,
	`started_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`completed_at` integer,
	`duration_seconds` integer,
	`notes` text,
	`rating` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_workout_logs_user` ON `workout_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_workout_logs_program` ON `workout_logs` (`user_program_id`);--> statement-breakpoint
CREATE INDEX `idx_workout_logs_status` ON `workout_logs` (`status`);