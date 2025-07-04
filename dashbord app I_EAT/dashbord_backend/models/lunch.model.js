const { pool } = require('../config/db');

const LunchModel = {
  // Get all lunch items
  findAll: async () => {
    try {
      const [rows] = await pool.query('SELECT * FROM lunch');
      return rows;
    } catch (error) {
      console.error('Error in findAll lunch:', error.message);
      throw error;
    }
  },

  // Get lunch by id
  findById: async (id) => {
    try {
      const [rows] = await pool.query('SELECT * FROM lunch WHERE id = ?', [id]);
      return rows[0];
    } catch (error) {
      console.error(`Error in findById lunch ${id}:`, error.message);
      throw error;
    }
  },
  
  // Get lunch items by menu_id
  findByMenuId: async (menuId) => {
    try {
      const [rows] = await pool.query('SELECT * FROM lunch WHERE menu_id = ?', [menuId]);
      return rows;
    } catch (error) {
      console.error(`Error finding lunch items for menu ${menuId}:`, error.message);
      throw error;
    }
  },
  
  // Get lunch items by ticket_id
  findByTicketId: async (ticketId) => {
    try {
      const [rows] = await pool.query('SELECT * FROM lunch WHERE ticket_id = ?', [ticketId]);
      return rows;
    } catch (error) {
      console.error(`Error finding lunch items for ticket ${ticketId}:`, error.message);
      throw error;
    }
  },

  // Create new lunch item
  create: async (lunchData) => {
    try {
      const { name, description, menu_id, price, ticket_id } = lunchData;
      const [result] = await pool.query(
        'INSERT INTO lunch (name, description, menu_id, price, ticket_id) VALUES (?, ?, ?, ?, ?)',
        [name, description, menu_id, price, ticket_id]
      );
      return { id: result.insertId, ...lunchData };
    } catch (error) {
      console.error('Error creating lunch item:', error.message);
      throw error;
    }
  },

  // Update lunch item
  update: async (id, lunchData) => {
    try {
      const fields = Object.keys(lunchData)
        .map(key => `${key} = ?`)
        .join(', ');
      const values = [...Object.values(lunchData), id];
      
      const [result] = await pool.query(
        `UPDATE lunch SET ${fields} WHERE id = ?`,
        values
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Error updating lunch item ${id}:`, error.message);
      throw error;
    }
  },

  // Delete lunch item
  delete: async (id) => {
    try {
      const [result] = await pool.query('DELETE FROM lunch WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Error deleting lunch item ${id}:`, error.message);
      throw error;
    }
  }
};

module.exports = LunchModel; 