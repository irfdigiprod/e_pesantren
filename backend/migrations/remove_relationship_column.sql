-- Update student_parents table - remove relationship column
-- Run this in phpMyAdmin

ALTER TABLE student_parents DROP COLUMN IF EXISTS relationship;
