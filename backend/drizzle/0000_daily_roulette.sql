CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`role` enum('admin','teacher','student','parent','staff','clinic') NOT NULL DEFAULT 'student',
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `parents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`father_name` varchar(255),
	`mother_name` varchar(255),
	`father_occupation` varchar(255),
	`mother_occupation` varchar(255),
	`phone` varchar(20),
	`address` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `parents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`nis` varchar(50) NOT NULL,
	`full_name` varchar(255) NOT NULL,
	`birth_date` date,
	`birth_place` varchar(255),
	`gender` enum('male','female'),
	`address` text,
	`phone` varchar(20),
	`parent_id` int,
	`class_id` int,
	`room_id` int,
	`enrollment_date` date,
	`status` enum('active','graduated','transferred','dropped') DEFAULT 'active',
	`photo` varchar(500),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `students_id` PRIMARY KEY(`id`),
	CONSTRAINT `students_nis_unique` UNIQUE(`nis`)
);
--> statement-breakpoint
CREATE TABLE `teachers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`nip` varchar(50),
	`full_name` varchar(255) NOT NULL,
	`birth_date` date,
	`birth_place` varchar(255),
	`gender` enum('male','female'),
	`address` text,
	`phone` varchar(20),
	`email` varchar(255),
	`position` varchar(255),
	`department` varchar(255),
	`employee_type` enum('teacher','staff') DEFAULT 'teacher',
	`join_date` date,
	`status` enum('active','inactive','retired') DEFAULT 'active',
	`photo` varchar(500),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teachers_id` PRIMARY KEY(`id`),
	CONSTRAINT `teachers_nip_unique` UNIQUE(`nip`)
);
--> statement-breakpoint
CREATE TABLE `quran_memorizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`student_id` int NOT NULL,
	`surah_number` int NOT NULL,
	`surah_name` varchar(100) NOT NULL,
	`juz` int,
	`start_ayah` int NOT NULL,
	`end_ayah` int NOT NULL,
	`status` enum('memorizing','completed','reviewing','need_improvement') DEFAULT 'memorizing',
	`grade` varchar(10),
	`score` int,
	`teacher_id` int,
	`memorized_at` date,
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quran_memorizations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_attendances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`student_id` int NOT NULL,
	`date` date NOT NULL,
	`status` enum('present','absent','sick','permitted','late') NOT NULL,
	`notes` text,
	`created_by` int,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `student_attendances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teacher_attendances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teacher_id` int NOT NULL,
	`date` date NOT NULL,
	`check_in` time,
	`check_out` time,
	`check_in_latitude` decimal(10,8),
	`check_in_longitude` decimal(11,8),
	`check_out_latitude` decimal(10,8),
	`check_out_longitude` decimal(11,8),
	`status` enum('present','absent','sick','permitted','late') NOT NULL,
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `teacher_attendances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rewards_punishments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`student_id` int NOT NULL,
	`type` enum('reward','punishment') NOT NULL,
	`category` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`points` int DEFAULT 0,
	`date` date NOT NULL,
	`given_by` int,
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rewards_punishments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `health_examinations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patient_type` enum('student','teacher') NOT NULL,
	`patient_id` int NOT NULL,
	`examination_date` date NOT NULL,
	`examination_time` varchar(10),
	`symptoms` text,
	`diagnosis` text,
	`treatment` text,
	`prescribed_medicines` text,
	`blood_pressure` varchar(20),
	`temperature` decimal(4,1),
	`weight` decimal(5,2),
	`height` decimal(5,2),
	`examiner` int,
	`is_inpatient` boolean DEFAULT false,
	`inpatient_id` int,
	`follow_up_date` date,
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `health_examinations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inpatients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patient_type` enum('student','teacher') NOT NULL,
	`patient_id` int NOT NULL,
	`room_number` varchar(50),
	`bed_number` varchar(50),
	`admission_date` date NOT NULL,
	`admission_time` varchar(10),
	`discharge_date` date,
	`discharge_time` varchar(10),
	`diagnosis` text,
	`treatment` text,
	`status` enum('admitted','discharged','transferred') DEFAULT 'admitted',
	`attending_doctor` varchar(255),
	`notes` text,
	`created_by` int,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inpatients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `medicine_usages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`medicine_id` int NOT NULL,
	`examination_id` int,
	`quantity` int NOT NULL,
	`notes` text,
	`used_by` int,
	`used_at` timestamp DEFAULT (now()),
	CONSTRAINT `medicine_usages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `medicines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`generic_name` varchar(255),
	`type` varchar(100),
	`category` varchar(100),
	`stock` int NOT NULL DEFAULT 0,
	`unit` varchar(50) NOT NULL DEFAULT 'pcs',
	`min_stock` int DEFAULT 10,
	`price` decimal(10,2) DEFAULT '0',
	`expiry_date` date,
	`manufacturer` varchar(255),
	`description` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `medicines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `classes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`grade` int NOT NULL,
	`academic_year` varchar(20) NOT NULL,
	`homeroom_teacher_id` int,
	`capacity` int DEFAULT 30,
	`description` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `classes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `grades` (
	`id` int AUTO_INCREMENT NOT NULL,
	`student_id` int NOT NULL,
	`subject_id` int NOT NULL,
	`class_id` int,
	`academic_year` varchar(20) NOT NULL,
	`semester` int NOT NULL,
	`daily_score` decimal(5,2),
	`homework_score` decimal(5,2),
	`midterm_score` decimal(5,2),
	`final_score` decimal(5,2),
	`practice_score` decimal(5,2),
	`average_score` decimal(5,2),
	`letter_grade` varchar(5),
	`predicate` varchar(50),
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `grades_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`student_id` int NOT NULL,
	`class_id` int,
	`academic_year` varchar(20) NOT NULL,
	`semester` int NOT NULL,
	`total_score` decimal(10,2),
	`average_score` decimal(5,2),
	`ranking` int,
	`total_students` int,
	`attendance_summary` text,
	`quran_progress` text,
	`reward_points` int DEFAULT 0,
	`punishment_points` int DEFAULT 0,
	`behavior_notes` text,
	`teacher_notes` text,
	`principal_notes` text,
	`status` enum('draft','published','archived') DEFAULT 'draft',
	`published_at` timestamp,
	`generated_at` timestamp DEFAULT (now()),
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`class_id` int NOT NULL,
	`subject_id` int NOT NULL,
	`teacher_id` int NOT NULL,
	`day_of_week` int NOT NULL,
	`start_time` time NOT NULL,
	`end_time` time NOT NULL,
	`room` varchar(100),
	`academic_year` varchar(20),
	`semester` int,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `schedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subjects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`code` varchar(20),
	`category` varchar(100),
	`description` text,
	`credit_hours` int DEFAULT 2,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subjects_id` PRIMARY KEY(`id`),
	CONSTRAINT `subjects_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `halaqah_groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`schedule` varchar(255),
	`location` varchar(255),
	`status` enum('active','inactive') DEFAULT 'active',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `halaqah_groups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `halaqah_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`halaqah_id` int NOT NULL,
	`student_id` int NOT NULL,
	`joined_at` date,
	`status` enum('active','inactive','graduated') DEFAULT 'active',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `halaqah_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `halaqah_members_halaqah_id_student_id_unique` UNIQUE(`halaqah_id`,`student_id`)
);
--> statement-breakpoint
CREATE TABLE `halaqah_mentors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`halaqah_id` int NOT NULL,
	`teacher_id` int NOT NULL,
	`role` enum('lead','assistant') DEFAULT 'assistant',
	`assigned_at` date,
	`status` enum('active','inactive') DEFAULT 'active',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `halaqah_mentors_id` PRIMARY KEY(`id`),
	CONSTRAINT `halaqah_mentors_halaqah_id_teacher_id_unique` UNIQUE(`halaqah_id`,`teacher_id`)
);
--> statement-breakpoint
CREATE TABLE `student_parents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`student_id` int NOT NULL,
	`parent_id` int NOT NULL,
	`is_primary` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_parents_id` PRIMARY KEY(`id`),
	CONSTRAINT `student_parents_student_id_parent_id_unique` UNIQUE(`student_id`,`parent_id`)
);
--> statement-breakpoint
CREATE TABLE `room_supervisors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`room_id` int NOT NULL,
	`teacher_id` int NOT NULL,
	`role` enum('lead','assistant') DEFAULT 'assistant',
	`assigned_at` timestamp DEFAULT (now()),
	`status` enum('active','inactive') DEFAULT 'active',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `room_supervisors_id` PRIMARY KEY(`id`),
	CONSTRAINT `room_supervisors_room_id_teacher_id_unique` UNIQUE(`room_id`,`teacher_id`)
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`building` varchar(255),
	`floor` varchar(50),
	`capacity` int,
	`description` text,
	`status` enum('active','maintenance','inactive') DEFAULT 'active',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rooms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversation_participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversation_id` int NOT NULL,
	`user_id` int NOT NULL,
	`role` enum('admin','member') NOT NULL DEFAULT 'member',
	`nickname` varchar(100),
	`is_muted` boolean NOT NULL DEFAULT false,
	`joined_at` timestamp DEFAULT (now()),
	`left_at` timestamp,
	CONSTRAINT `conversation_participants_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_participant` UNIQUE(`conversation_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('private','group') NOT NULL DEFAULT 'private',
	`name` varchar(255),
	`avatar_url` varchar(500),
	`created_by` int NOT NULL,
	`last_message_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `message_attachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`message_id` int NOT NULL,
	`file_type` enum('image','document','audio','video') NOT NULL,
	`file_name` varchar(255) NOT NULL,
	`original_name` varchar(255) NOT NULL,
	`file_path` varchar(500) NOT NULL,
	`file_size` bigint NOT NULL,
	`mime_type` varchar(100) NOT NULL,
	`width` int,
	`height` int,
	`thumbnail_path` varchar(500),
	`duration` int,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `message_attachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `message_reactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`message_id` int NOT NULL,
	`user_id` int NOT NULL,
	`emoji` varchar(50) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `message_reactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_reaction` UNIQUE(`message_id`,`user_id`,`emoji`)
);
--> statement-breakpoint
CREATE TABLE `message_read_status` (
	`id` int AUTO_INCREMENT NOT NULL,
	`message_id` int NOT NULL,
	`user_id` int NOT NULL,
	`read_at` timestamp DEFAULT (now()),
	CONSTRAINT `message_read_status_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_read_status` UNIQUE(`message_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversation_id` int NOT NULL,
	`sender_id` int NOT NULL,
	`content` text,
	`message_type` enum('text','image','document','audio','video','mixed') NOT NULL DEFAULT 'text',
	`reply_to_id` int,
	`is_deleted` boolean NOT NULL DEFAULT false,
	`deleted_at` timestamp,
	`is_edited` boolean NOT NULL DEFAULT false,
	`edited_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `parents` ADD CONSTRAINT `parents_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `students` ADD CONSTRAINT `students_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `students` ADD CONSTRAINT `students_parent_id_parents_id_fk` FOREIGN KEY (`parent_id`) REFERENCES `parents`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `teachers` ADD CONSTRAINT `teachers_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quran_memorizations` ADD CONSTRAINT `quran_memorizations_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quran_memorizations` ADD CONSTRAINT `quran_memorizations_teacher_id_teachers_id_fk` FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_attendances` ADD CONSTRAINT `student_attendances_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_attendances` ADD CONSTRAINT `student_attendances_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `teacher_attendances` ADD CONSTRAINT `teacher_attendances_teacher_id_teachers_id_fk` FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rewards_punishments` ADD CONSTRAINT `rewards_punishments_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rewards_punishments` ADD CONSTRAINT `rewards_punishments_given_by_users_id_fk` FOREIGN KEY (`given_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `health_examinations` ADD CONSTRAINT `health_examinations_examiner_users_id_fk` FOREIGN KEY (`examiner`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `health_examinations` ADD CONSTRAINT `health_examinations_inpatient_id_inpatients_id_fk` FOREIGN KEY (`inpatient_id`) REFERENCES `inpatients`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inpatients` ADD CONSTRAINT `inpatients_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `medicine_usages` ADD CONSTRAINT `medicine_usages_medicine_id_medicines_id_fk` FOREIGN KEY (`medicine_id`) REFERENCES `medicines`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `medicine_usages` ADD CONSTRAINT `medicine_usages_examination_id_health_examinations_id_fk` FOREIGN KEY (`examination_id`) REFERENCES `health_examinations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `medicine_usages` ADD CONSTRAINT `medicine_usages_used_by_users_id_fk` FOREIGN KEY (`used_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `classes` ADD CONSTRAINT `classes_homeroom_teacher_id_teachers_id_fk` FOREIGN KEY (`homeroom_teacher_id`) REFERENCES `teachers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `grades` ADD CONSTRAINT `grades_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `grades` ADD CONSTRAINT `grades_subject_id_subjects_id_fk` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `grades` ADD CONSTRAINT `grades_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reports` ADD CONSTRAINT `reports_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reports` ADD CONSTRAINT `reports_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `schedules` ADD CONSTRAINT `schedules_class_id_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `schedules` ADD CONSTRAINT `schedules_subject_id_subjects_id_fk` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `schedules` ADD CONSTRAINT `schedules_teacher_id_teachers_id_fk` FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `halaqah_members` ADD CONSTRAINT `halaqah_members_halaqah_id_halaqah_groups_id_fk` FOREIGN KEY (`halaqah_id`) REFERENCES `halaqah_groups`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `halaqah_members` ADD CONSTRAINT `halaqah_members_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `halaqah_mentors` ADD CONSTRAINT `halaqah_mentors_halaqah_id_halaqah_groups_id_fk` FOREIGN KEY (`halaqah_id`) REFERENCES `halaqah_groups`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `halaqah_mentors` ADD CONSTRAINT `halaqah_mentors_teacher_id_teachers_id_fk` FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_parents` ADD CONSTRAINT `student_parents_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_parents` ADD CONSTRAINT `student_parents_parent_id_parents_id_fk` FOREIGN KEY (`parent_id`) REFERENCES `parents`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `room_supervisors` ADD CONSTRAINT `room_supervisors_room_id_rooms_id_fk` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `room_supervisors` ADD CONSTRAINT `room_supervisors_teacher_id_teachers_id_fk` FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversation_participants` ADD CONSTRAINT `conversation_participants_conversation_id_conversations_id_fk` FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversation_participants` ADD CONSTRAINT `conversation_participants_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `message_attachments` ADD CONSTRAINT `message_attachments_message_id_messages_id_fk` FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `message_reactions` ADD CONSTRAINT `message_reactions_message_id_messages_id_fk` FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `message_reactions` ADD CONSTRAINT `message_reactions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `message_read_status` ADD CONSTRAINT `message_read_status_message_id_messages_id_fk` FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `message_read_status` ADD CONSTRAINT `message_read_status_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_conversation_id_conversations_id_fk` FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_sender_id_users_id_fk` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;