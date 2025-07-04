const { pool } = require('../config/db');

// User model for MySQL
const UserModel = {
  // Get all users
  findAll: async () => {
    try {
      const [rows] = await pool.query('SELECT id, name, email, role, avatar, created_at, updated_at FROM users');
      return rows;
    } catch (error) {
      console.error('Error in findAll users:', error.message);
      throw error;
    }
  },

  // Get user by id
  findById: async (id) => {
    try {
      const [rows] = await pool.query('SELECT id, name, email, role, avatar, created_at, updated_at FROM users WHERE id = ?', [id]);
      return rows[0];
    } catch (error) {
      console.error(`Error in findById user ${id}:`, error.message);
      throw error;
    }
  },
  
  // Get user by email
  findByEmail: async (email) => {
    try {
      const [rows] = await pool.query('SELECT id, name, email, role, avatar, created_at, updated_at FROM users WHERE email = ?', [email]);
      return rows[0];
    } catch (error) {
      console.error(`Error finding user by email ${email}:`, error.message);
      throw error;
    }
  },
  
  // Get user with permissions
  findWithPermissions: async (userId) => {
    try {
      const [rows] = await pool.query(`
        SELECT u.id, u.name, u.email, u.role, u.avatar, u.created_at, u.updated_at,
               p.id as permission_id, p.name as permission_name, p.description as permission_description
        FROM users u
        JOIN role_permissions rp ON u.role = rp.role
        JOIN permissions p ON rp.permission_id = p.id
        WHERE u.id = ?
      `, [userId]);
      
      if (rows.length === 0) {
        return null;
      }
      
      // Format the result to group permissions
      const user = {
        id: rows[0].id,
        name: rows[0].name,
        email: rows[0].email,
        role: rows[0].role,
        avatar: rows[0].avatar,
        created_at: rows[0].created_at,
        updated_at: rows[0].updated_at,
        permissions: rows.map(row => ({
          id: row.permission_id,
          name: row.permission_name,
          description: row.permission_description
        }))
      };
      
      return user;
    } catch (error) {
      console.error(`Error finding user with permissions ${userId}:`, error.message);
      throw error;
    }
  },
  
  // Authenticate user (for login)
  authenticate: async (email, password) => {
    try {
      console.log(`Attempting to authenticate user with email: ${email}`);
      
      const [rows] = await pool.query('SELECT id, name, email, password, role, avatar FROM users WHERE email = ?', [email]);
      console.log(`Found ${rows.length} users with email ${email}`);
      
      if (rows.length === 0) {
        console.log(`No user found with email: ${email}`);
        return null;
      }
      
      const user = rows[0];
      console.log(`User found: ${user.name} (${user.role})`);
      
      // You would normally use a proper password verification method here
      // like bcrypt.compare(password, user.password)
      // But for now we'll do a direct comparison
      if (user.password === password) {
        console.log(`Password match for user: ${user.name}`);
        // Don't return the password in the response
        delete user.password;
        return user;
      }
      
      console.log(`Password mismatch for user: ${user.name}`);
      return null;
    } catch (error) {
      console.error('Error authenticating user:', error.message);
      throw error;
    }
  },

  // Create new user
  create: async (userData) => {
    try {
      const { name, email, password, role = 'viewer', avatar = null } = userData;
      
      // Check if email already exists
      const [existingUsers] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
      if (existingUsers.length > 0) {
        throw new Error('Email already exists');
      }
      
      // Generate a UUID for the user ID
      const [uuidResult] = await pool.query('SELECT UUID() as uuid');
      const userId = uuidResult[0].uuid;
      
      // Insert the new user
      await pool.query(
        'INSERT INTO users (id, name, email, password, role, avatar) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, name, email, password, role, avatar]
      );
      
      return { 
        id: userId, 
        name, 
        email, 
        role, 
        avatar 
      };
    } catch (error) {
      console.error('Error creating user:', error.message);
      throw error;
    }
  },

  // Update user
  update: async (id, userData) => {
    try {
      const allowedFields = ['name', 'email', 'password', 'role', 'avatar'];
      const updateData = {};
      
      // Filter only allowed fields
      Object.keys(userData).forEach(key => {
        if (allowedFields.includes(key)) {
          updateData[key] = userData[key];
        }
      });
      
      if (Object.keys(updateData).length === 0) {
        return false;
      }
      
      const fields = Object.keys(updateData)
        .map(key => `${key} = ?`)
        .join(', ');
      const values = [...Object.values(updateData), id];
      
      const [result] = await pool.query(
        `UPDATE users SET ${fields} WHERE id = ?`,
        values
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Error updating user ${id}:`, error.message);
      throw error;
    }
  },

  // Delete user
  delete: async (id) => {
    try {
      // Check for activity logs and handle accordingly
      const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error.message);
      throw error;
    }
  },
  
  // Log user activity
  logActivity: async (userId, action, entityType = null, entityId = null, details = null, ipAddress = null, req = null) => {
    try {
      // Skip logging if the request has the skipLogging flag or X-No-Log header
      if (req && (req.skipLogging || req.headers['x-no-log'] === 'true')) {
        console.log('Skipping user activity logging due to X-No-Log header');
        return true;
      }
      
      // Generate a UUID for the log ID
      const [uuidResult] = await pool.query('SELECT UUID() as uuid');
      const logId = uuidResult[0].uuid;
      
      await pool.query(
        'INSERT INTO user_activity_logs (id, user_id, action, entity_type, entity_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [logId, userId, action, entityType, entityId, details ? JSON.stringify(details) : null, ipAddress]
      );
      
      return true;
    } catch (error) {
      console.error('Error logging user activity:', error.message);
      // Don't throw the error, just log it to avoid breaking main operations
      return false;
    }
  }
};

module.exports = UserModel; 