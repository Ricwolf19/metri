ALTER TABLE `exercise_settings` ADD `load` text;--> statement-breakpoint
ALTER TABLE `exercises` ADD `unilateral` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `set_logs` ADD `load` text;