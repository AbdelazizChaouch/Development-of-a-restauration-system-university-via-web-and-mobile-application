const { pool } = require('../config/db');

const UserModel = {
  // Get all users
  findAll: async () => {
    try {
      const [rows] = await pool.query('SELECT * FROM users');
      return rows;
    } catch (error) {
      console.error('Error in findAll users:', error.message);
      throw error;
    }
  },

  // Get user by id
  findById: async (id) => {
    try {
      const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
      return rows[0];
    } catch (error) {
      console.error(`Error in findById user ${id}:`, error.message);
      throw error;
    }
  },

  // Get user by email
  findByEmail: async (email) => {
    try {
      const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
      return rows[0];
    } catch (error) {
      console.error(`Error finding user by email ${email}:`, error.message);
      throw error;
    }
  },

  // Create new user
  create: async (userData) => {
    try {
      const { name, email, password, role = 'viewer', avatar = null } = userData;
      
      // Check if email already exists
      const [existingUser] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
      if (existingUser.length > 0) {
        throw new Error('Email already exists');
      }

      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      
      const [result] = await pool.query(
        `INSERT INTO users (id, name, email, password, role, avatar, created_at, updated_at) 
         VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)`,
        [name, email, password, role, avatar, now, now]
      );

      const [newUser] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
      return newUser[0];
    } catch (error) {
      console.error('Error creating user:', error.message);
      throw error;
    }
  },

  // Update user
  update: async (id, userData) => {
    try {
      const allowedFields = ['name', 'email', 'password', 'role', 'avatar'];
      const updates = [];
      const values = [];

      // Build update query dynamically based on provided fields
      Object.keys(userData).forEach(key => {
        if (allowedFields.includes(key) && userData[key] !== undefined) {
          updates.push(`${key} = ?`);
          values.push(userData[key]);
        }
      });

      if (updates.length === 0) {
        return null;
      }

      // Add updated_at timestamp
      updates.push('updated_at = ?');
      values.push(new Date().toISOString().slice(0, 19).replace('T', ' '));

      // Add id to values array
      values.push(id);

      const query = `
        UPDATE users 
        SET ${updates.join(', ')} 
        WHERE id = ?
      `;

      const [result] = await pool.query(query, values);
      
      if (result.affectedRows === 0) {
        return null;
      }

      const [updatedUser] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
      return updatedUser[0];
    } catch (error) {
      console.error(`Error updating user ${id}:`, error.message);
      throw error;
    }
  },

  // Delete user
  delete: async (id) => {
    try {
      const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error.message);
      throw error;
    }
  }
};

module.exports = UserModel; 