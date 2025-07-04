const { pool } = require('../config/db');

const FoodModel = {
  // Get all food items
  findAll: async () => {
    try {
      const [rows] = await pool.query('SELECT * FROM food');
      return rows;
    } catch (error) {
      console.error('Error in findAll food:', error.message);
      throw error;
    }
  },

  // Get food by id
  findById: async (id) => {
    try {
      const [rows] = await pool.query('SELECT * FROM food WHERE id = ?', [id]);
      return rows[0];
    } catch (error) {
      console.error(`Error in findById food ${id}:`, error.message);
      throw error;
    }
  },

  // Create new food item
  create: async (foodData) => {
    try {
      const columns = Object.keys(foodData).join(', ');
      const placeholders = Object.keys(foodData).map(() => '?').join(', ');
      const values = Object.values(foodData);

      const [result] = await pool.query(
        `INSERT INTO food (${columns}) VALUES (${placeholders})`,
        values
      );
      return { id: result.insertId, ...foodData };
    } catch (error) {
      console.error('Error creating food:', error.message);
      throw error;
    }
  },

  // Update food item
  update: async (id, foodData) => {
    try {
      const fields = Object.keys(foodData)
        .map(key => `${key} = ?`)
        .join(', ');
      const values = [...Object.values(foodData), id];
      
      const [result] = await pool.query(
        `UPDATE food SET ${fields} WHERE id = ?`,
        values
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Error updating food ${id}:`, error.message);
      throw error;
    }
  },

  // Delete food item
  delete: async (id) => {
    try {
      const [result] = await pool.query('DELETE FROM food WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Error deleting food ${id}:`, error.message);
      throw error;
    }
  }
};

module.exports = FoodModel; 