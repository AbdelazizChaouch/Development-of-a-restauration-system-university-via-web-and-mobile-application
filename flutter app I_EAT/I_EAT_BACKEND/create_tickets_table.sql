-- Create tickets table based on ticket_history structure
CREATE TABLE IF NOT EXISTS tickets (
  ticket_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT DEFAULT NULL,
  issue_date DATE NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  order_type VARCHAR(50) NOT NULL,
  used TINYINT(1) NOT NULL DEFAULT 0,
  student_id INT NOT NULL,
  qr_data TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(student_id)
);

-- Insert existing data from ticket_history to tickets table if needed
-- Uncomment and modify if you want to transfer data
/*
INSERT INTO tickets (ticket_id, order_id, issue_date, price, order_type, used, student_id, qr_data)
SELECT 
  ticket_id, 
  order_id, 
  issue_date, 
  price, 
  order_type, 
  used, 
  student_id, 
  qr_data
FROM ticket_history
WHERE ticket_id IS NOT NULL
ON DUPLICATE KEY UPDATE
  ticket_id = VALUES(ticket_id);
*/

-- Example of inserting a ticket manually
INSERT INTO tickets (issue_date, price, order_type, used, student_id, qr_data)
VALUES (
  '2025-03-03', 
  10.00, 
  'Breakfast', 
  0, 
  1, 
  '{"student_id":1,"order_type":"Breakfast","date":"2025-03-03","timestamp":1741008535978,"random":"nve408"}'
); 