CREATE TABLE `settings` (
	`key` varchar(255) NOT NULL,
	`value` text,
	`description` text,
	CONSTRAINT `settings_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `permission_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teacher_id` int NOT NULL,
	`type` enum('sick','permit') NOT NULL,
	`start_date` date NOT NULL,
	`end_date` date NOT NULL,
	`reason` text NOT NULL,
	`attachment` varchar(500),
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`rejection_reason` text,
	`approved_by` int,
	`approved_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `permission_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `custom_allowances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`amount` decimal(15,2) DEFAULT '0.00',
	`is_active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `custom_allowances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `position_allowances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`position` varchar(255) NOT NULL,
	`amount` decimal(15,2) DEFAULT '0.00',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `position_allowances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `salary_grades` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`daily_attendance_rate` decimal(15,2) DEFAULT '0.00',
	`base_salary` decimal(15,2) DEFAULT '0.00',
	`health_allowance` decimal(15,2) DEFAULT '0.00',
	`teaching_hour_rate` decimal(15,2) DEFAULT '0.00',
	`housing_allowance` decimal(15,2) DEFAULT '0.00',
	`transport_allowance` decimal(15,2) DEFAULT '0.00',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `salary_grades_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `salary_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`daily_attendance_rate` decimal(15,2) DEFAULT '0.00',
	`health_allowance` decimal(15,2) DEFAULT '0.00',
	`teaching_hour_rate` decimal(15,2) DEFAULT '0.00',
	`housing_allowance` decimal(15,2) DEFAULT '0.00',
	`transport_allowance` decimal(15,2) DEFAULT '0.00',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `salary_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tenure_allowances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`min_years` int NOT NULL,
	`max_years` int NOT NULL,
	`amount` decimal(15,2) DEFAULT '0.00',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tenure_allowances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tahfidz_deposits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`student_id` int NOT NULL,
	`teacher_id` int NOT NULL,
	`deposit_date` timestamp NOT NULL DEFAULT (now()),
	`type` enum('ziyadah','murajaah','izin','alpha','sakit') NOT NULL,
	`is_late` boolean DEFAULT false,
	`start_surah` int,
	`start_ayat` int,
	`start_page` int,
	`end_surah` int,
	`end_ayat` int,
	`end_page` int,
	`total_lines` int,
	`total_pages` decimal(5,2),
	`juz` int,
	`surah_number` int,
	`surah_name` varchar(100),
	`ayat_start` int,
	`ayat_end` int,
	`page_number` int,
	`fluency` enum('lancar','kurang_lancar','mengulang'),
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tahfidz_deposits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tahfidz_exam_types` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(150) NOT NULL,
	`category` enum('UPK','UKJ','UA','Suluk','Other') NOT NULL DEFAULT 'Other',
	`description` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tahfidz_exam_types_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tahfidz_exams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`student_id` int NOT NULL,
	`examiner_id` int NOT NULL,
	`exam_date` date NOT NULL,
	`exam_type` varchar(50) NOT NULL,
	`exam_category` enum('UPK','UKJ','UA','Suluk','Other') DEFAULT 'Other',
	`juz` int,
	`start_page` int,
	`end_page` int,
	`score_fluency` int,
	`score_tajwid` int,
	`score_makhraj` int,
	`score_adab` int,
	`final_score` int NOT NULL,
	`verdict` enum('pass','fail','conditional') NOT NULL,
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tahfidz_exams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tahfidz_report_cards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`student_id` int NOT NULL,
	`academic_year` varchar(20),
	`semester` enum('1','2','ganjil','genap'),
	`notes` text,
	`result` varchar(50),
	`sick_count` int DEFAULT 0,
	`permission_count` int DEFAULT 0,
	`alpha_count` int DEFAULT 0,
	`generated_at` timestamp DEFAULT (now()),
	CONSTRAINT `tahfidz_report_cards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tahfidz_report_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`institution_name` varchar(255) NOT NULL,
	`institution_address` text,
	`institution_logo` varchar(255),
	`contact_info` varchar(255),
	`headmaster_name` varchar(100),
	`tahfidz_head_name` varchar(100),
	`tahfidz_head_name_akhwat` varchar(100),
	`city_date` varchar(100),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tahfidz_report_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tahfidz_targets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`level` varchar(50) NOT NULL,
	`target_pages` int NOT NULL,
	`description` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tahfidz_targets_id` PRIMARY KEY(`id`),
	CONSTRAINT `tahfidz_targets_level_unique` UNIQUE(`level`)
);
--> statement-breakpoint
ALTER TABLE `students` MODIFY COLUMN `status` enum('active','inactive','graduated','transferred','dropped') DEFAULT 'active';--> statement-breakpoint
ALTER TABLE `teacher_attendances` MODIFY COLUMN `status` enum('present','absent','sick','permitted','late','sick_deduct','sick_no_deduct','permit_deduct','permit_no_deduct') NOT NULL;--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `type` varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE `students` ADD `province` text;--> statement-breakpoint
ALTER TABLE `students` ADD `regency` text;--> statement-breakpoint
ALTER TABLE `students` ADD `district` text;--> statement-breakpoint
ALTER TABLE `students` ADD `village` text;--> statement-breakpoint
ALTER TABLE `students` ADD `address_detail` text;--> statement-breakpoint
ALTER TABLE `students` ADD `postal_code` varchar(10);--> statement-breakpoint
ALTER TABLE `teachers` ADD `province` text;--> statement-breakpoint
ALTER TABLE `teachers` ADD `regency` text;--> statement-breakpoint
ALTER TABLE `teachers` ADD `district` text;--> statement-breakpoint
ALTER TABLE `teachers` ADD `village` text;--> statement-breakpoint
ALTER TABLE `teachers` ADD `address_detail` text;--> statement-breakpoint
ALTER TABLE `teachers` ADD `postal_code` varchar(10);--> statement-breakpoint
ALTER TABLE `teachers` ADD `division_id` int;--> statement-breakpoint
ALTER TABLE `teachers` ADD `salary_grade_id` int;--> statement-breakpoint
ALTER TABLE `teachers` ADD `position_allowance_id` int;--> statement-breakpoint
ALTER TABLE `teachers` ADD `teaching_hours` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `teachers` ADD `bank_name` varchar(100);--> statement-breakpoint
ALTER TABLE `teachers` ADD `bank_code` varchar(20);--> statement-breakpoint
ALTER TABLE `teachers` ADD `bank_account_number` varchar(50);--> statement-breakpoint
ALTER TABLE `teachers` ADD `bank_account_name` varchar(255);--> statement-breakpoint
ALTER TABLE `teacher_attendances` ADD `division_id` varchar(100);--> statement-breakpoint
ALTER TABLE `teacher_attendances` ADD `activity` varchar(100);--> statement-breakpoint
ALTER TABLE `teacher_attendances` ADD `is_claim` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `halaqah_groups` ADD `target_level_id` int;--> statement-breakpoint
ALTER TABLE `permission_requests` ADD CONSTRAINT `permission_requests_teacher_id_teachers_id_fk` FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `permission_requests` ADD CONSTRAINT `permission_requests_approved_by_users_id_fk` FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tahfidz_deposits` ADD CONSTRAINT `tahfidz_deposits_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tahfidz_deposits` ADD CONSTRAINT `tahfidz_deposits_teacher_id_teachers_id_fk` FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tahfidz_exams` ADD CONSTRAINT `tahfidz_exams_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tahfidz_exams` ADD CONSTRAINT `tahfidz_exams_examiner_id_teachers_id_fk` FOREIGN KEY (`examiner_id`) REFERENCES `teachers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tahfidz_report_cards` ADD CONSTRAINT `tahfidz_report_cards_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;