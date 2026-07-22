CREATE TABLE `pharmacies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pharmacies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pharmacy_pharmacists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pharmacy_id` int NOT NULL,
	`teacher_id` int NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `pharmacy_pharmacists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `teacher_attendances` MODIFY COLUMN `teacher_id` int;--> statement-breakpoint
ALTER TABLE `schedules` MODIFY COLUMN `teacher_id` int;--> statement-breakpoint
ALTER TABLE `permission_requests` MODIFY COLUMN `teacher_id` int;--> statement-breakpoint
ALTER TABLE `tahfidz_deposits` MODIFY COLUMN `teacher_id` int;--> statement-breakpoint
ALTER TABLE `tahfidz_exams` MODIFY COLUMN `examiner_id` int;--> statement-breakpoint
ALTER TABLE `medicines` ADD `pharmacy_id` int;--> statement-breakpoint
ALTER TABLE `medicines` ADD `administration_route` varchar(255);--> statement-breakpoint
ALTER TABLE `pharmacy_pharmacists` ADD CONSTRAINT `pharmacy_pharmacists_pharmacy_id_pharmacies_id_fk` FOREIGN KEY (`pharmacy_id`) REFERENCES `pharmacies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pharmacy_pharmacists` ADD CONSTRAINT `pharmacy_pharmacists_teacher_id_teachers_id_fk` FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `medicines` ADD CONSTRAINT `medicines_pharmacy_id_pharmacies_id_fk` FOREIGN KEY (`pharmacy_id`) REFERENCES `pharmacies`(`id`) ON DELETE no action ON UPDATE no action;