-- Chat Feature Database Migration
-- Run this manually in MySQL to create chat tables

-- Conversations table
CREATE TABLE IF NOT EXISTS `conversations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `type` ENUM('private', 'group') NOT NULL DEFAULT 'private',
  `name` VARCHAR(255) NULL,
  `avatar_url` VARCHAR(500) NULL,
  `created_by` INT NOT NULL,
  `last_message_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`)
);

-- Conversation participants table
CREATE TABLE IF NOT EXISTS `conversation_participants` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `conversation_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `role` ENUM('admin', 'member') NOT NULL DEFAULT 'member',
  `nickname` VARCHAR(100) NULL,
  `is_muted` BOOLEAN NOT NULL DEFAULT FALSE,
  `joined_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `left_at` TIMESTAMP NULL,
  UNIQUE KEY `unique_participant` (`conversation_id`, `user_id`),
  FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- Messages table
CREATE TABLE IF NOT EXISTS `messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `conversation_id` INT NOT NULL,
  `sender_id` INT NOT NULL,
  `content` TEXT NULL,
  `message_type` ENUM('text', 'image', 'document', 'audio', 'video', 'mixed') NOT NULL DEFAULT 'text',
  `reply_to_id` INT NULL,
  `is_deleted` BOOLEAN NOT NULL DEFAULT FALSE,
  `deleted_at` TIMESTAMP NULL,
  `is_edited` BOOLEAN NOT NULL DEFAULT FALSE,
  `edited_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`)
);

-- Message attachments table
CREATE TABLE IF NOT EXISTS `message_attachments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `message_id` INT NOT NULL,
  `file_type` ENUM('image', 'document', 'audio', 'video') NOT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `original_name` VARCHAR(255) NOT NULL,
  `file_path` VARCHAR(500) NOT NULL,
  `file_size` BIGINT NOT NULL,
  `mime_type` VARCHAR(100) NOT NULL,
  `width` INT NULL,
  `height` INT NULL,
  `thumbnail_path` VARCHAR(500) NULL,
  `duration` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON DELETE CASCADE
);

-- Message reactions table
CREATE TABLE IF NOT EXISTS `message_reactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `message_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `emoji` VARCHAR(50) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_reaction` (`message_id`, `user_id`, `emoji`),
  FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- Message read status table
CREATE TABLE IF NOT EXISTS `message_read_status` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `message_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `read_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_read_status` (`message_id`, `user_id`),
  FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- Add indexes for better query performance
CREATE INDEX `idx_conversations_created_by` ON `conversations`(`created_by`);
CREATE INDEX `idx_conversations_last_message_at` ON `conversations`(`last_message_at`);
CREATE INDEX `idx_participants_user` ON `conversation_participants`(`user_id`);
CREATE INDEX `idx_messages_conversation` ON `messages`(`conversation_id`);
CREATE INDEX `idx_messages_sender` ON `messages`(`sender_id`);
CREATE INDEX `idx_messages_created_at` ON `messages`(`created_at`);
CREATE INDEX `idx_attachments_message` ON `message_attachments`(`message_id`);
CREATE INDEX `idx_reactions_message` ON `message_reactions`(`message_id`);
CREATE INDEX `idx_read_status_message` ON `message_read_status`(`message_id`);
CREATE INDEX `idx_read_status_user` ON `message_read_status`(`user_id`);
