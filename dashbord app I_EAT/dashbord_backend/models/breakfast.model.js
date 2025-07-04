const { pool } = require('../config/db');

const BreakfastModel = {
  // Get all breakfast items
  findAll: async () => {
    try {
      const [rows] = await pool.query('SELECT * FROM breakfast');
      return rows;
    } catch (error) {
      console.error('Error in findAll breakfast:', error.message);
      throw error;
    }
  },

  // Get breakfast by id
  findById: async (id) => {
    try {
      const [rows] = await pool.query('SELECT * FROM breakfast WHERE id = ?', [id]);
      return rows[0];
    } catch (error) {
      console.error(`Error in findById breakfast ${id}:`, error.message);
      throw error;
    }
  },
  
  // Get breakfast items by menu_id
  findByMenuId: async (menuId) => {
    try {
      const [rows] = await pool.query('SELECT * FROM breakfast WHERE menu_id = ?', [menuId]);
      return rows;
    } catch (error) {
      console.error(`Error finding breakfast items for menu ${menuId}:`, error.message);
      throw error;
    }
  },
  
  // Get breakfast items by ticket_id
  findByTicketId: async (ticketId) => {
    try {
      const [rows] = await pool.query('SELECT * FROM breakfast WHERE ticket_id = ?', [ticketId]);
      return rows;
    } catch (error) {
      console.error(`Error finding breakfast items for ticket ${ticketId}:`, error.message);
      throw error;
    }
  },

  // Create new breakfast item
  create: async (breakfastData) => {
    try {
      const { name, description, menu_id, price, ticket_id } = breakfastData;
      const [result] = await pool.query(
        'INSERT INTO breakfast (name, description, menu_id, price, ticket_id) VALUES (?, ?, ?, ?, ?)',
        [name, description, menu_id, price, ticket_id]
      );
      return { id: result.insertId, ...breakfastData };
    } catch (error) {
      console.error('Error creating breakfast item:', error.message);
      throw error;
    }
  },

  // Update breakfast item
  update: async (id, breakfastData) => {
    try {
      const fields = Object.keys(breakfastData)
        .map(key => `${key} = ?`)
        .join(', ');
      const values = [...Object.values(breakfastData), id];
      
      const [result] = await pool.query(
        `UPDATE breakfast SET ${fields} WHERE id = ?`,
        values
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Error updating breakfast item ${id}:`, error.message);
      throw error;
    }
  },

  // Delete breakfast item
  delete: async (id) => {
    try {
      const [result] = await pool.query('DELETE FROM breakfast WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Error deleting breakfast item ${id}:`, error.message);
      throw error;
    }
  }
};

module.exports = BreakfastModel; 