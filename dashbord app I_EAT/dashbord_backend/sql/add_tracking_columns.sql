-- Add tracking columns to students table
ALTER TABLE `students`
ADD COLUMN `created_by` INT NULL,
ADD COLUMN `updated_by` INT NULL,
ADD COLUMN `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN `updated_at` TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP;

-- Add tracking columns to university_cards table
ALTER TABLE `university_cards`
ADD COLUMN `created_by` INT NULL,
ADD COLUMN `updated_by` INT NULL,
ADD COLUMN `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN `updated_at` TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP; 