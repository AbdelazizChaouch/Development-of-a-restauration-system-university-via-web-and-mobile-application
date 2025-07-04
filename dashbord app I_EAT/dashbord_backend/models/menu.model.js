const { pool } = require('../config/db');

const MenuModel = {
  // Get all menu items
  findAll: async () => {
    try {
      const [rows] = await pool.query('SELECT * FROM menu');
      return rows;
    } catch (error) {
      console.error('Error in findAll menu:', error.message);
      throw error;
    }
  },
  
  // Get menu by id
  findById: async (id) => {
    try {
      const [rows] = await pool.query('SELECT * FROM menu WHERE id = ?', [id]);
      return rows[0];
    } catch (error) {
      console.error(`Error in findById menu ${id}:`, error.message);
      throw error;
    }
  },
  
  // Get complete menu with food details
  getCompleteMenu: async () => {
    try {
      // This query will need to be adjusted based on your actual schema
      const [rows] = await pool.query(`
        SELECT m.*, 
               b.name as breakfast_name,
               l.name as lunch_name,
               d.name as dinner_name
        FROM menu m
        LEFT JOIN breakfast b ON m.breakfast_id = b.id
        LEFT JOIN lunch l ON m.lunch_id = l.id
        LEFT JOIN dinner d ON m.dinner_id = d.id
      `);
      return rows;
    } catch (error) {
      console.error('Error getting complete menu:', error.message);
      throw error;
    }
  },
  
  // Get menu for a specific date
  getMenuByDate: async (date) => {
    try {
      const [rows] = await pool.query('SELECT * FROM menu WHERE date = ?', [date]);
      return rows;
    } catch (error) {
      console.error(`Error getting menu for date ${date}:`, error.message);
      throw error;
    }
  },
  
  // Create new menu item
  create: async (menuData) => {
    try {
      const columns = Object.keys(menuData).join(', ');
      const placeholders = Object.keys(menuData).map(() => '?').join(', ');
      const values = Object.values(menuData);

      const [result] = await pool.query(
        `INSERT INTO menu (${columns}) VALUES (${placeholders})`,
        values
      );
      return { id: result.insertId, ...menuData };
    } catch (error) {
      console.error('Error creating menu:', error.message);
      throw error;
    }
  },
  
  // Update menu item
  update: async (id, menuData) => {
    try {
      const fields = Object.keys(menuData)
        .map(key => `${key} = ?`)
        .join(', ');
      const values = [...Object.values(menuData), id];
      
      const [result] = await pool.query(
        `UPDATE menu SET ${fields} WHERE id = ?`,
        values
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Error updating menu ${id}:`, error.message);
      throw error;
    }
  },
  
  // Delete menu item
  delete: async (id) => {
    try {
      const [result] = await pool.query('DELETE FROM menu WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Error deleting menu ${id}:`, error.message);
      throw error;
    }
  }
};

module.exports = MenuModel; 