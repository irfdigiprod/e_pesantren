CREATE TABLE `savings_bank_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bank_name` varchar(100) NOT NULL,
	`account_number` varchar(50) NOT NULL,
	`account_name` varchar(150) NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `savings_bank_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `divisions` ADD `latitude` decimal(10,8);--> statement-breakpoint
ALTER TABLE `divisions` ADD `longitude` decimal(11,8);--> statement-breakpoint
ALTER TABLE `divisions` ADD `radius` int;