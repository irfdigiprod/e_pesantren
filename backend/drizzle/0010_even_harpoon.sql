CREATE TABLE `homeroom_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`student_id` int NOT NULL,
	`class_id` int,
	`academic_year` varchar(20) NOT NULL,
	`semester` int NOT NULL,
	`sick_days` int DEFAULT 0,
	`permission_days` int DEFAULT 0,
	`absent_days` int DEFAULT 0,
	`teacher_notes` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `homeroom_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `homeroom_notes` ADD CONSTRAINT `homeroom_notes_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `homeroom_notes` ADD CONSTRAINT `homeroom_notes_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE no action ON UPDATE no action;