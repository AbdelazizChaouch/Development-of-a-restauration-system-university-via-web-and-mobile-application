const { pool } = require('../config/db');

const OrderModel = {
  // Get all orders
  findAll: async () => {
    try {
      const [rows] = await pool.query('SELECT * FROM orders');
      return rows;
    } catch (error) {
      console.error('Error in findAll orders:', error.message);
      throw error;
    }
  },

  // Get order by id
  findById: async (id) => {
    try {
      const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
      return rows[0];
    } catch (error) {
      console.error(`Error in findById order ${id}:`, error.message);
      throw error;
    }
  },
  
  // Get orders by student id
  findByStudent: async (studentId) => {
    try {
      const [rows] = await pool.query('SELECT * FROM orders WHERE student_id = ?', [studentId]);
      return rows;
    } catch (error) {
      console.error(`Error getting orders for student ${studentId}:`, error.message);
      throw error;
    }
  },
  
  // Get orders with details
  findWithDetails: async (orderId) => {
    try {
      // This query will need adjusting based on your actual schema
      const [rows] = await pool.query(`
        SELECT o.*, s.name as student_name, f.name as food_name
        FROM orders o
        JOIN students s ON o.student_id = s.id
        JOIN food f ON o.food_id = f.id
        WHERE o.id = ?
      `, [orderId]);
      return rows[0];
    } catch (error) {
      console.error(`Error getting order details for ${orderId}:`, error.message);
      throw error;
    }
  },
  
  // Get recent orders (with limit)
  getRecent: async (limit = 10) => {
    try {
      const [rows] = await pool.query(`
        SELECT o.*, s.name as student_name
        FROM orders o
        JOIN students s ON o.student_id = s.id
        ORDER BY o.created_at DESC
        LIMIT ?
      `, [limit]);
      return rows;
    } catch (error) {
      console.error('Error getting recent orders:', error.message);
      throw error;
    }
  },

  // Create new order
  create: async (orderData) => {
    try {
      const columns = Object.keys(orderData).join(', ');
      const placeholders = Object.keys(orderData).map(() => '?').join(', ');
      const values = Object.values(orderData);

      const [result] = await pool.query(
        `INSERT INTO orders (${columns}) VALUES (${placeholders})`,
        values
      );
      return { id: result.insertId, ...orderData };
    } catch (error) {
      console.error('Error creating order:', error.message);
      throw error;
    }
  },

  // Update order
  update: async (id, orderData) => {
    try {
      const fields = Object.keys(orderData)
        .map(key => `${key} = ?`)
        .join(', ');
      const values = [...Object.values(orderData), id];
      
      const [result] = await pool.query(
        `UPDATE orders SET ${fields} WHERE id = ?`,
        values
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Error updating order ${id}:`, error.message);
      throw error;
    }
  },

  // Delete order
  delete: async (id) => {
    try {
      const [result] = await pool.query('DELETE FROM orders WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Error deleting order ${id}:`, error.message);
      throw error;
    }
  },
  
  // Get orders statistics
  getStats: async () => {
    try {
      const [totalCount] = await pool.query('SELECT COUNT(*) as total FROM orders');
      const [dailyStats] = await pool.query(`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM orders
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `);
      
      return {
        totalOrders: totalCount[0].total,
        dailyStats
      };
    } catch (error) {
      console.error('Error getting order statistics:', error.message);
      throw error;
    }
  }
};

module.exports = OrderModel; 