const { pool } = require('../config/db');

const UniversityCardLogModel = {
  // Create a new log entry
  create: async (logData) => {
    try {
      const { 
        card_id, 
        action, 
        amount, 
        previous_balance, 
        new_balance, 
        details = {} 
      } = logData;
      
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const detailsJson = JSON.stringify(details);
      
      const [result] = await pool.query(
        `INSERT INTO university_card_logs (
          id, card_id, action, amount, previous_balance, 
          new_balance, details, created_at
        ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)`,
        [card_id, action, amount, previous_balance, new_balance, detailsJson, now]
      );

      return result.insertId;
    } catch (error) {
      console.error('Error creating university card log:', error.message);
      throw error;
    }
  },

  // Get logs for a specific card
  getByCardId: async (cardId, limit = 50) => {
    try {
      const [rows] = await pool.query(
        `SELECT l.*, u.name as user_name
         FROM university_card_logs l
         LEFT JOIN users u ON JSON_EXTRACT(l.details, '$.admin_id') = u.id
         WHERE l.card_id = ?
         ORDER BY l.created_at DESC
         LIMIT ?`, 
        [cardId, limit]
      );
      
      // Parse the JSON details
      return rows.map(row => ({
        ...row,
        details: JSON.parse(row.details || '{}')
      }));
    } catch (error) {
      console.error(`Error getting logs for card ${cardId}:`, error.message);
      throw error;
    }
  },

  // Get all logs with optional filtering
  getAll: async (filters = {}, options = { limit: 100, offset: 0 }) => {
    try {
      let query = `
        SELECT l.*, 
               u.name as user_name,
               s.full_name as student_name
        FROM university_card_logs l
        LEFT JOIN university_cards c ON l.card_id = c.id
        LEFT JOIN students s ON c.student_id = s.student_id
        LEFT JOIN users u ON JSON_EXTRACT(l.details, '$.admin_id') = u.id
      `;
      
      const conditions = [];
      const values = [];
      
      if (filters.cardId) {
        conditions.push('l.card_id = ?');
        values.push(filters.cardId);
      }
      
      if (filters.action) {
        conditions.push('l.action = ?');
        values.push(filters.action);
      }
      
      if (filters.startDate) {
        conditions.push('l.created_at >= ?');
        values.push(filters.startDate);
      }
      
      if (filters.endDate) {
        conditions.push('l.created_at <= ?');
        values.push(filters.endDate);
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      query += ' ORDER BY l.created_at DESC';
      
      if (options.limit) {
        query += ' LIMIT ? OFFSET ?';
        values.push(parseInt(options.limit), parseInt(options.offset));
      }
      
      const [rows] = await pool.query(query, values);
      
      // Parse the JSON details
      return rows.map(row => ({
        ...row,
        details: JSON.parse(row.details || '{}')
      }));
    } catch (error) {
      console.error('Error getting university card logs:', error.message);
      throw error;
    }
  }
};

module.exports = UniversityCardLogModel; 