CREATE TABLE `point_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`point_id` int NOT NULL,
	`image_url` varchar(500) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `point_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `point_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('reward','punishment') NOT NULL,
	`category` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`default_points` int NOT NULL DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `point_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_warnings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`student_id` int NOT NULL,
	`sp_level` int NOT NULL,
	`status` enum('active','resolved') DEFAULT 'active',
	`issue_date` date NOT NULL,
	`valid_until` date,
	`reason` text NOT NULL,
	`notes` text,
	`issued_by` int,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_warnings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clinic_patients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('student','teacher','external') NOT NULL,
	`ref_id` int,
	`name` varchar(255) NOT NULL,
	`gender` enum('L','P') DEFAULT 'L',
	`dob` date,
	`birth_place` varchar(255),
	`blood_type` varchar(5),
	`phone` varchar(20),
	`province` text,
	`regency` text,
	`district` text,
	`village` text,
	`address_detail` text,
	`postal_code` varchar(10),
	`address` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clinic_patients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clinic_rooms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`capacity` int NOT NULL DEFAULT 1,
	`gender` enum('L','P','mixed') DEFAULT 'mixed',
	`description` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clinic_rooms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `report_card_dates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`academic_year` varchar(20) NOT NULL,
	`semester` int NOT NULL,
	`report_date` date NOT NULL,
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `report_card_dates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `report_card_predicates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`grade` varchar(5) NOT NULL,
	`min_score` decimal(5,2) NOT NULL,
	`max_score` decimal(5,2) NOT NULL,
	`description` varchar(100),
	`description_ar` varchar(100),
	`sort_order` int DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `report_card_predicates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_classes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`student_id` int NOT NULL,
	`class_id` int NOT NULL,
	`academic_year` varchar(20) NOT NULL,
	`status` enum('active','promoted','transferred','graduated','dropped') DEFAULT 'active',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_classes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`role` enum('admin','teacher','student','parent','staff','clinic') NOT NULL,
	`route_path` varchar(255) NOT NULL,
	`route_label` varchar(255),
	`route_category` varchar(100),
	`is_allowed` boolean NOT NULL DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `role_permissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `role_permissions_role_route_path_unique` UNIQUE(`role`,`route_path`)
);
--> statement-breakpoint
CREATE TABLE `user_permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`route_path` varchar(255) NOT NULL,
	`route_label` varchar(255),
	`route_category` varchar(100),
	`is_allowed` boolean NOT NULL DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_permissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_permissions_user_id_route_path_unique` UNIQUE(`user_id`,`route_path`)
);
--> statement-breakpoint
CREATE TABLE `push_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` varchar(255) NOT NULL,
	`auth` varchar(255) NOT NULL,
	`user_agent` varchar(500),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `push_subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `health_examinations` MODIFY COLUMN `patient_type` enum('student','teacher','external') DEFAULT 'student';--> statement-breakpoint
ALTER TABLE `health_examinations` MODIFY COLUMN `patient_id` int;--> statement-breakpoint
ALTER TABLE `inpatients` MODIFY COLUMN `patient_type` enum('student','teacher','external') DEFAULT 'student';--> statement-breakpoint
ALTER TABLE `inpatients` MODIFY COLUMN `patient_id` int;--> statement-breakpoint
ALTER TABLE `students` ADD `nisn` varchar(20);--> statement-breakpoint
ALTER TABLE `students` ADD `nis_santri` varchar(50);--> statement-breakpoint
ALTER TABLE `rewards_punishments` ADD `rule_id` int;--> statement-breakpoint
ALTER TABLE `health_examinations` ADD `clinic_patient_id` int;--> statement-breakpoint
ALTER TABLE `health_examinations` ADD `history_past_diseases` text;--> statement-breakpoint
ALTER TABLE `health_examinations` ADD `history_family_diseases` text;--> statement-breakpoint
ALTER TABLE `health_examinations` ADD `history_allergies` text;--> statement-breakpoint
ALTER TABLE `health_examinations` ADD `history_current_medications` text;--> statement-breakpoint
ALTER TABLE `health_examinations` ADD `history_habits` text;--> statement-breakpoint
ALTER TABLE `health_examinations` ADD `anamnesis` text;--> statement-breakpoint
ALTER TABLE `health_examinations` ADD `heart_rate` int;--> statement-breakpoint
ALTER TABLE `health_examinations` ADD `respiratory_rate` int;--> statement-breakpoint
ALTER TABLE `health_examinations` ADD `physical_exam` text;--> statement-breakpoint
ALTER TABLE `health_examinations` ADD `lab_results` text;--> statement-breakpoint
ALTER TABLE `health_examinations` ADD `imaging_results` text;--> statement-breakpoint
ALTER TABLE `health_examinations` ADD `diagnosis_code` varchar(50);--> statement-breakpoint
ALTER TABLE `health_examinations` ADD `treatment_plan` text;--> statement-breakpoint
ALTER TABLE `health_examinations` ADD `progress_notes` text;--> statement-breakpoint
ALTER TABLE `health_examinations` ADD `follow_up_instructions` text;--> statement-breakpoint
ALTER TABLE `inpatients` ADD `clinic_patient_id` int;--> statement-breakpoint
ALTER TABLE `inpatients` ADD `room_id` int;--> statement-breakpoint
ALTER TABLE `tahfidz_targets` ADD `target_juz` decimal(4,2);--> statement-breakpoint
ALTER TABLE `point_images` ADD CONSTRAINT `point_images_point_id_rewards_punishments_id_fk` FOREIGN KEY (`point_id`) REFERENCES `rewards_punishments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_warnings` ADD CONSTRAINT `student_warnings_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_warnings` ADD CONSTRAINT `student_warnings_issued_by_users_id_fk` FOREIGN KEY (`issued_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_classes` ADD CONSTRAINT `student_classes_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_classes` ADD CONSTRAINT `student_classes_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_permissions` ADD CONSTRAINT `user_permissions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `push_subscriptions` ADD CONSTRAINT `push_subscriptions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rewards_punishments` ADD CONSTRAINT `rewards_punishments_rule_id_point_rules_id_fk` FOREIGN KEY (`rule_id`) REFERENCES `point_rules`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `health_examinations` ADD CONSTRAINT `health_examinations_clinic_patient_id_clinic_patients_id_fk` FOREIGN KEY (`clinic_patient_id`) REFERENCES `clinic_patients`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inpatients` ADD CONSTRAINT `inpatients_clinic_patient_id_clinic_patients_id_fk` FOREIGN KEY (`clinic_patient_id`) REFERENCES `clinic_patients`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inpatients` ADD CONSTRAINT `inpatients_room_id_clinic_rooms_id_fk` FOREIGN KEY (`room_id`) REFERENCES `clinic_rooms`(`id`) ON DELETE no action ON UPDATE no action;