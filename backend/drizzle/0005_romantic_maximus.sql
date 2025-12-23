CREATE TABLE `class_homeroom_teachers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`class_id` int NOT NULL,
	`teacher_id` int NOT NULL,
	`role` varchar(50) DEFAULT 'wali_kelas',
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `class_homeroom_teachers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `first_name` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `last_name` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `gender` enum('male','female');--> statement-breakpoint
ALTER TABLE `users` ADD `birth_place` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `birth_date` date;--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `address` text;--> statement-breakpoint
ALTER TABLE `users` ADD `photo` varchar(500);--> statement-breakpoint
ALTER TABLE `class_homeroom_teachers` ADD CONSTRAINT `class_homeroom_teachers_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `class_homeroom_teachers` ADD CONSTRAINT `class_homeroom_teachers_teacher_id_teachers_id_fk` FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON DELETE no action ON UPDATE no action;