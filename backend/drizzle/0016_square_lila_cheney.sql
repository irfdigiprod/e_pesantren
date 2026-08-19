CREATE TABLE `academic_periods` (
	`id` int AUTO_INCREMENT NOT NULL,
	`academic_year` varchar(20) NOT NULL,
	`semester` int NOT NULL,
	`start_date` date,
	`end_date` date,
	`status` enum('draft','active','locked','archived') NOT NULL DEFAULT 'draft',
	`locked_at` timestamp,
	`locked_by` int,
	`notes` text,
	`created_by` int,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `academic_periods_id` PRIMARY KEY(`id`),
	CONSTRAINT `academic_periods_academic_year_semester_unique` UNIQUE(`academic_year`,`semester`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actor_user_id` int,
	`entity_type` varchar(100) NOT NULL,
	`entity_id` varchar(191),
	`action` varchar(50) NOT NULL,
	`before_json` json,
	`after_json` json,
	`reason` text,
	`request_id` varchar(191),
	`ip_address` varchar(100),
	`user_agent` varchar(500),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `report_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`student_id` int NOT NULL,
	`class_id` int,
	`report_id` int,
	`academic_year` varchar(20) NOT NULL,
	`semester` int NOT NULL,
	`report_type` enum('academic','tahfidz','combined') NOT NULL DEFAULT 'academic',
	`status` enum('draft','published','revised','archived') NOT NULL DEFAULT 'draft',
	`final_payload_json` json,
	`pdf_path` varchar(500),
	`published_by` int,
	`published_at` timestamp,
	`locked_at` timestamp,
	`revision_of` int,
	`revision_reason` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `report_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_room_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`student_id` int NOT NULL,
	`room_id` int,
	`bed_label` varchar(100),
	`academic_year` varchar(20),
	`effective_from` date,
	`effective_to` date,
	`is_current` boolean DEFAULT true,
	`reason` text,
	`created_by` int,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_room_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_status_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`student_id` int NOT NULL,
	`status` enum('active','inactive','graduated','transferred','dropped','alumni','leave') NOT NULL,
	`effective_from` date,
	`effective_to` date,
	`is_current` boolean DEFAULT true,
	`reason` text,
	`document_path` varchar(500),
	`created_by` int,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_status_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `student_classes` ADD `semester` int;--> statement-breakpoint
ALTER TABLE `student_classes` ADD `effective_from` date;--> statement-breakpoint
ALTER TABLE `student_classes` ADD `effective_to` date;--> statement-breakpoint
ALTER TABLE `student_classes` ADD `is_current` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `student_classes` ADD `promotion_status` varchar(50);--> statement-breakpoint
ALTER TABLE `student_classes` ADD `reason` text;--> statement-breakpoint
ALTER TABLE `student_classes` ADD `created_by` int;--> statement-breakpoint
ALTER TABLE `academic_periods` ADD CONSTRAINT `academic_periods_locked_by_users_id_fk` FOREIGN KEY (`locked_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `academic_periods` ADD CONSTRAINT `academic_periods_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_actor_user_id_users_id_fk` FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `report_snapshots` ADD CONSTRAINT `report_snapshots_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `report_snapshots` ADD CONSTRAINT `report_snapshots_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `report_snapshots` ADD CONSTRAINT `report_snapshots_report_id_reports_id_fk` FOREIGN KEY (`report_id`) REFERENCES `reports`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `report_snapshots` ADD CONSTRAINT `report_snapshots_published_by_users_id_fk` FOREIGN KEY (`published_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_room_history` ADD CONSTRAINT `student_room_history_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_room_history` ADD CONSTRAINT `student_room_history_room_id_rooms_id_fk` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_room_history` ADD CONSTRAINT `student_room_history_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_status_history` ADD CONSTRAINT `student_status_history_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_status_history` ADD CONSTRAINT `student_status_history_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_classes` ADD CONSTRAINT `student_classes_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;