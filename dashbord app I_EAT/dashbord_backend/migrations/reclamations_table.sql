-- Table for storing reclamations from staff to admin
CREATE TABLE IF NOT EXISTS reclamations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id VARCHAR(36) NOT NULL,
  student_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  reason TEXT NOT NULL,
  evidence TEXT NULL,
  status ENUM('pending', 'approved', 'rejected', 'processed', 'error') NOT NULL DEFAULT 'pending',
  admin_id VARCHAR(36) NULL,
  admin_notes TEXT NULL,
  processed_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES users(id),
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

-- Index for faster queries
CREATE INDEX idx_reclamations_staff_id ON reclamations(staff_id);
CREATE INDEX idx_reclamations_student_id ON reclamations(student_id);
CREATE INDEX idx_reclamations_status ON reclamations(status);
CREATE INDEX idx_reclamations_created_at ON reclamations(created_at); 