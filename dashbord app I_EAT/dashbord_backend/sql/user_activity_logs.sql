-- Create the user activity logs table
CREATE TABLE IF NOT EXISTS `user_activity_logs` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` INT NOT NULL,
  `action` VARCHAR(50) NOT NULL,
  `entity_type` VARCHAR(50) NOT NULL,
  `entity_id` VARCHAR(50) NULL,
  `details` JSON NULL,
  `ip_address` VARCHAR(45) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_user_activity_logs_user_id` (`user_id`),
  INDEX `idx_user_activity_logs_entity_type_entity_id` (`entity_type`, `entity_id`),
  INDEX `idx_user_activity_logs_created_at` (`created_at`),
  CONSTRAINT `fk_user_activity_logs_user_id`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci; 