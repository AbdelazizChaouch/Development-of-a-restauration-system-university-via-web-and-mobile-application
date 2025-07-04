-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  role_id INT AUTO_INCREMENT PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_roles junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS user_roles (
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE
);

-- Insert default roles
INSERT INTO roles (role_name, description) VALUES
('ADMIN', 'Full system access with all privileges'),
('DASHBOARD_USER', 'Access to dashboard with limited administrative functions'),
('TICKET_MANAGER', 'Can manage and issue tickets'),
('CARD_MANAGER', 'Can manage university cards'),
('STUDENT', 'Regular student user with basic access');

-- Add stored procedure to assign role to user
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS assign_role_to_user(
  IN p_user_id INT,
  IN p_role_name VARCHAR(50)
)
BEGIN
  DECLARE v_role_id INT;
  
  -- Get role ID from name
  SELECT role_id INTO v_role_id FROM roles WHERE role_name = p_role_name;
  
  -- If role exists, assign it to user
  IF v_role_id IS NOT NULL THEN
    INSERT IGNORE INTO user_roles (user_id, role_id)
    VALUES (p_user_id, v_role_id);
    SELECT TRUE as success, CONCAT('Role ', p_role_name, ' assigned to user ', p_user_id) as message;
  ELSE
    SELECT FALSE as success, CONCAT('Role ', p_role_name, ' does not exist') as message;
  END IF;
END //
DELIMITER ;

-- Add function to check if user has role
DELIMITER //
CREATE FUNCTION IF NOT EXISTS user_has_role(
  p_user_id INT,
  p_role_name VARCHAR(50)
) RETURNS BOOLEAN
DETERMINISTIC
BEGIN
  DECLARE has_role BOOLEAN;
  
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.role_id
    WHERE ur.user_id = p_user_id AND r.role_name = p_role_name
  ) INTO has_role;
  
  RETURN has_role;
END //
DELIMITER ; 