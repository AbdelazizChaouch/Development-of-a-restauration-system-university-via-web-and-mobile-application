const { pool } = require('../config/db');

const DinnerModel = {
  // Get all dinner items
  findAll: async () => {
    try {
      const [rows] = await pool.query('SELECT * FROM dinner');
      return rows;
    } catch (error) {
      console.error('Error in findAll dinner:', error.message);
      throw error;
    }
  },

  // Get dinner by id
  findById: async (id) => {
    try {
      const [rows] = await pool.query('SELECT * FROM dinner WHERE id = ?', [id]);
      return rows[0];
    } catch (error) {
      console.error(`Error in findById dinner ${id}:`, error.message);
      throw error;
    }
  },
  
  // Get dinner items by menu_id
  findByMenuId: async (menuId) => {
    try {
      const [rows] = await pool.query('SELECT * FROM dinner WHERE menu_id = ?', [menuId]);
      return rows;
    } catch (error) {
      console.error(`Error finding dinner items for menu ${menuId}:`, error.message);
      throw error;
    }
  },
  
  // Get dinner items by ticket_id
  findByTicketId: async (ticketId) => {
    try {
      const [rows] = await pool.query('SELECT * FROM dinner WHERE ticket_id = ?', [ticketId]);
      return rows;
    } catch (error) {
      console.error(`Error finding dinner items for ticket ${ticketId}:`, error.message);
      throw error;
    }
  },

  // Create new dinner item
  create: async (dinnerData) => {
    try {
      const { name, description, menu_id, price, ticket_id } = dinnerData;
      const [result] = await pool.query(
        'INSERT INTO dinner (name, description, menu_id, price, ticket_id) VALUES (?, ?, ?, ?, ?)',
        [name, description, menu_id, price, ticket_id]
      );
      return { id: result.insertId, ...dinnerData };
    } catch (error) {
      console.error('Error creating dinner item:', error.message);
      throw error;
    }
  },

  // Update dinner item
  update: async (id, dinnerData) => {
    try {
      const fields = Object.keys(dinnerData)
        .map(key => `${key} = ?`)
        .join(', ');
      const values = [...Object.values(dinnerData), id];
      
      const [result] = await pool.query(
        `UPDATE dinner SET ${fields} WHERE id = ?`,
        values
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Error updating dinner item ${id}:`, error.message);
      throw error;
    }
  },

  // Delete dinner item
  delete: async (id) => {
    try {
      const [result] = await pool.query('DELETE FROM dinner WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Error deleting dinner item ${id}:`, error.message);
      throw error;
    }
  }
};

module.exports = DinnerModel; 