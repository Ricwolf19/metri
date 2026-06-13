ALTER TABLE `reminders` DROP COLUMN `weekday`;--> statement-breakpoint
ALTER TABLE `reminders` ADD `weekdays` text;--> statement-breakpoint
ALTER TABLE `reminders` DROP COLUMN `notification_id`;--> statement-breakpoint
ALTER TABLE `reminders` ADD `notification_ids` text;