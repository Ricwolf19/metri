ALTER TABLE `user_programs` ADD `training_weekdays` text;--> statement-breakpoint
ALTER TABLE `week_configs` ADD `set_groups` text;--> statement-breakpoint
ALTER TABLE `workout_day_exercises` ADD `alternative_exercise_ids` text;--> statement-breakpoint
ALTER TABLE `workout_logs` ADD `planned_snapshot` text;