const { pool } = require('../config/db');

const ReclamationModel = {
  // Get all reclamations with optional filtering
  findAll: async (filters = {}) => {
    try {
      let query = `
        SELECT r.*, u.name as staff_name, us.name as admin_name
        FROM reclamations r
        LEFT JOIN users u ON r.staff_id = u.id
        LEFT JOIN users us ON r.admin_id = us.id
      `;
      
      const conditions = [];
      const values = [];
      
      if (filters.status) {
        conditions.push('r.status = ?');
        values.push(filters.status);
      }
      
      if (filters.staff_id) {
        conditions.push('r.staff_id = ?');
        values.push(filters.staff_id);
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      query += ' ORDER BY r.created_at DESC';
      
      if (filters.limit) {
        query += ' LIMIT ?';
        values.push(parseInt(filters.limit));
      }
      
      const [rows] = await pool.query(query, values);
      return rows;
    } catch (error) {
      console.error('Error in findAll reclamations:', error.message);
      throw error;
    }
  },

  // Get reclamation by id
  findById: async (id) => {
    try {
      const [rows] = await pool.query(
        `SELECT r.*, u.name as staff_name, us.name as admin_name
         FROM reclamations r
         LEFT JOIN users u ON r.staff_id = u.id
         LEFT JOIN users us ON r.admin_id = us.id
         WHERE r.id = ?`, 
        [id]
      );
      return rows[0];
    } catch (error) {
      console.error(`Error in findById reclamation ${id}:`, error.message);
      throw error;
    }
  },

  // Create new reclamation
  create: async (reclamationData) => {
    try {
      const { 
        staff_id, 
        student_id, 
        amount, 
        reason, 
        evidence = null, 
        status = 'pending' 
      } = reclamationData;
      
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      
      const [result] = await pool.query(
        `INSERT INTO reclamations (
          staff_id, student_id, amount, reason, 
          evidence, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [staff_id, student_id, amount, reason, evidence, status, now, now]
      );

      const [newReclamation] = await pool.query('SELECT * FROM reclamations WHERE id = LAST_INSERT_ID()');
      return newReclamation[0];
    } catch (error) {
      console.error('Error creating reclamation:', error.message);
      throw error;
    }
  },

  // Update reclamation
  update: async (id, reclamationData) => {
    try {
      const allowedFields = ['admin_id', 'status', 'admin_notes', 'processed_at'];
      const updates = [];
      const values = [];

      // Build update query dynamically based on provided fields
      Object.keys(reclamationData).forEach(key => {
        if (allowedFields.includes(key) && reclamationData[key] !== undefined) {
          updates.push(`${key} = ?`);
          values.push(reclamationData[key]);
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
        UPDATE reclamations 
        SET ${updates.join(', ')} 
        WHERE id = ?
      `;

      const [result] = await pool.query(query, values);
      
      if (result.affectedRows === 0) {
        return null;
      }

      const [updatedReclamation] = await pool.query('SELECT * FROM reclamations WHERE id = ?', [id]);
      return updatedReclamation[0];
    } catch (error) {
      console.error(`Error updating reclamation ${id}:`, error.message);
      throw error;
    }
  },

  // Delete reclamation
  delete: async (id) => {
    try {
      const [result] = await pool.query('DELETE FROM reclamations WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Error deleting reclamation ${id}:`, error.message);
      throw error;
    }
  },

  // Get reclamation count by status
  getCountByStatus: async () => {
    try {
      const [rows] = await pool.query(`
        SELECT status, COUNT(*) as count
        FROM reclamations
        GROUP BY status
      `);
      
      // Transform into an object with status as keys
      const counts = {
        pending: 0,
        approved: 0,
        rejected: 0,
        processed: 0
      };
      
      rows.forEach(row => {
        counts[row.status] = row.count;
      });
      
      return counts;
    } catch (error) {
      console.error('Error getting reclamation counts:', error.message);
      throw error;
    }
  }
};

module.exports = ReclamationModel; 