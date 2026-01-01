CREATE TABLE `information_board` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`image_url` varchar(255) NOT NULL,
	`order` int DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `information_board_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `province` text;--> statement-breakpoint
ALTER TABLE `users` ADD `regency` text;--> statement-breakpoint
ALTER TABLE `users` ADD `district` text;--> statement-breakpoint
ALTER TABLE `users` ADD `village` text;--> statement-breakpoint
ALTER TABLE `users` ADD `address_detail` text;--> statement-breakpoint
ALTER TABLE `users` ADD `postal_code` varchar(10);--> statement-breakpoint
ALTER TABLE `parents` ADD `province` text;--> statement-breakpoint
ALTER TABLE `parents` ADD `regency` text;--> statement-breakpoint
ALTER TABLE `parents` ADD `district` text;--> statement-breakpoint
ALTER TABLE `parents` ADD `village` text;--> statement-breakpoint
ALTER TABLE `parents` ADD `address_detail` text;--> statement-breakpoint
ALTER TABLE `parents` ADD `postal_code` varchar(10);--> statement-breakpoint
ALTER TABLE `students` ADD `full_name_ar` varchar(255);--> statement-breakpoint
ALTER TABLE `grades` ADD `letter_grade_ar` varchar(10);--> statement-breakpoint
ALTER TABLE `subjects` ADD `name_ar` varchar(255);--> statement-breakpoint
ALTER TABLE `subjects` ADD `grades` text;--> statement-breakpoint
ALTER TABLE `subjects` ADD `kkm` decimal(5,2) DEFAULT '70.00';--> statement-breakpoint
ALTER TABLE `subjects` ADD `sort_order` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `tahfidz_exams` ADD `academic_year` varchar(20);--> statement-breakpoint
ALTER TABLE `tahfidz_exams` ADD `semester` enum('1','2','ganjil','genap');