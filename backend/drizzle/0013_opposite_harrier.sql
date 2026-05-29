CREATE TABLE `student_leave_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leave_id` int,
	`student_id` int NOT NULL,
	`clinic_exam_id` int,
	CONSTRAINT `student_leave_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_leaves` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('sick','permit') NOT NULL,
	`start_date` date NOT NULL,
	`end_date` date NOT NULL,
	`reason` text NOT NULL,
	`attachment` varchar(500),
	`created_by` int,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_leaves_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `savings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`transfer_date` date NOT NULL,
	`nominal` int NOT NULL,
	`receipt_path` varchar(500),
	`type` varchar(50) NOT NULL DEFAULT 'deposit',
	`status` varchar(50) NOT NULL DEFAULT 'pending',
	`description` varchar(500),
	`confirmed_by` int,
	`confirmed_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `savings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `student_leave_items` ADD CONSTRAINT `student_leave_items_leave_id_student_leaves_id_fk` FOREIGN KEY (`leave_id`) REFERENCES `student_leaves`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_leave_items` ADD CONSTRAINT `student_leave_items_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_leave_items` ADD CONSTRAINT `student_leave_items_clinic_exam_id_health_examinations_id_fk` FOREIGN KEY (`clinic_exam_id`) REFERENCES `health_examinations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_leaves` ADD CONSTRAINT `student_leaves_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `savings` ADD CONSTRAINT `savings_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `savings` ADD CONSTRAINT `savings_confirmed_by_users_id_fk` FOREIGN KEY (`confirmed_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;