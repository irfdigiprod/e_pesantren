ALTER TABLE `users` ADD `name` varchar(255);--> statement-breakpoint
ALTER TABLE `conversations` ADD `is_locked` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `messages` ADD `is_signed` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `messages` ADD `original_signer_id` int;