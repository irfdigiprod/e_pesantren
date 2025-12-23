CREATE TABLE `starred_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`message_id` int NOT NULL,
	`user_id` int NOT NULL,
	`attachment_id` int,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `starred_messages_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_starred` UNIQUE(`message_id`,`user_id`,`attachment_id`)
);
--> statement-breakpoint
ALTER TABLE `starred_messages` ADD CONSTRAINT `starred_messages_message_id_messages_id_fk` FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `starred_messages` ADD CONSTRAINT `starred_messages_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `starred_messages` ADD CONSTRAINT `starred_messages_attachment_id_message_attachments_id_fk` FOREIGN KEY (`attachment_id`) REFERENCES `message_attachments`(`id`) ON DELETE cascade ON UPDATE no action;