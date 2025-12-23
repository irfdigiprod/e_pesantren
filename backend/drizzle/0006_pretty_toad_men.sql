CREATE TABLE `divisions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `divisions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teacher_divisions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teacher_id` int NOT NULL,
	`division_id` int NOT NULL,
	`role` varchar(50) DEFAULT 'member',
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `teacher_divisions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `teacher_divisions` ADD CONSTRAINT `teacher_divisions_teacher_id_teachers_id_fk` FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `teacher_divisions` ADD CONSTRAINT `teacher_divisions_division_id_divisions_id_fk` FOREIGN KEY (`division_id`) REFERENCES `divisions`(`id`) ON DELETE no action ON UPDATE no action;