-- reclamations_table.sql
-- Create a new table for reclamations

CREATE TABLE `reclamations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `staff_id` VARCHAR(36) NOT NULL,
  `student_id` INT NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `reason` TEXT NOT NULL,
  `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  `comments` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add indexes for faster queries
CREATE INDEX idx_reclamations_staff_id ON reclamations(staff_id);
CREATE INDEX idx_reclamations_student_id ON reclamations(student_id);
CREATE INDEX idx_reclamations_status ON reclamations(status);
CREATE INDEX idx_reclamations_created_at ON reclamations(created_at); 