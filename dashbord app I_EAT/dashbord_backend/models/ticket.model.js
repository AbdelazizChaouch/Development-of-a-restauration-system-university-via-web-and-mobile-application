const { pool } = require('../config/db');

const TicketModel = {
  // Get all tickets
  findAll: async () => {
    try {
      const [rows] = await pool.query('SELECT * FROM tickets');
      return rows;
    } catch (error) {
      console.error('Error in findAll tickets:', error.message);
      throw error;
    }
  },

  // Get ticket by id
  findById: async (id) => {
    try {
      const [rows] = await pool.query('SELECT * FROM tickets WHERE ticket_id = ?', [id]);
      return rows[0];
    } catch (error) {
      console.error(`Error in findById ticket ${id}:`, error.message);
      throw error;
    }
  },
  
  // Get tickets by student id
  findByStudent: async (studentId) => {
    try {
      const [rows] = await pool.query('SELECT * FROM tickets WHERE student_id = ?', [studentId]);
      return rows;
    } catch (error) {
      console.error(`Error getting tickets for student ${studentId}:`, error.message);
      throw error;
    }
  },
  
  // Get tickets by order id
  findByOrder: async (orderId) => {
    try {
      const [rows] = await pool.query('SELECT * FROM tickets WHERE order_id = ?', [orderId]);
      return rows;
    } catch (error) {
      console.error(`Error getting tickets for order ${orderId}:`, error.message);
      throw error;
    }
  },
  
  // Get tickets with history
  findWithHistory: async (ticketId) => {
    try {
      const [ticket] = await pool.query('SELECT * FROM tickets WHERE ticket_id = ?', [ticketId]);
      
      if (ticket.length === 0) {
        return null;
      }
      
      const [history] = await pool.query(
        'SELECT * FROM ticket_history WHERE ticket_id = ? ORDER BY created_at DESC',
        [ticketId]
      );
      
      return {
        ...ticket[0],
        history
      };
    } catch (error) {
      console.error(`Error getting ticket with history ${ticketId}:`, error.message);
      throw error;
    }
  },
  
  // Get unused tickets
  getUnused: async () => {
    try {
      const [rows] = await pool.query(`
        SELECT t.*, s.full_name as student_name
        FROM tickets t
        JOIN students s ON t.student_id = s.student_id
        WHERE t.used = 0
      `);
      return rows;
    } catch (error) {
      console.error('Error getting unused tickets:', error.message);
      throw error;
    }
  },

  // Create new ticket
  create: async (ticketData) => {
    try {
      // Start a transaction
      const connection = await pool.getConnection();
      await connection.beginTransaction();
      
      try {
        const { order_id, issue_date, price, order_type, student_id, qr_data = null } = ticketData;
        
        const [result] = await connection.query(
          'INSERT INTO tickets (order_id, issue_date, price, order_type, used, student_id, qr_data) VALUES (?, ?, ?, ?, 0, ?, ?)',
          [order_id, issue_date, price, order_type, student_id, qr_data]
        );
        
        const ticketId = result.insertId;
        
        // Create initial history entry
        await connection.query(
          'INSERT INTO ticket_history (ticket_id, action, notes, order_id, issue_date, price, order_type, used, student_id, qr_data) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)',
          [ticketId, 'created', 'Ticket created', order_id, issue_date, price, order_type, student_id, qr_data]
        );
        
        await connection.commit();
        return { ticket_id: ticketId, ...ticketData, used: 0 };
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error creating ticket:', error.message);
      throw error;
    }
  },

  // Update ticket
  update: async (id, ticketData, action = 'updated', notes = 'Ticket updated') => {
    try {
      // Start a transaction
      const connection = await pool.getConnection();
      await connection.beginTransaction();
      
      try {
        const fields = Object.keys(ticketData)
          .map(key => `${key} = ?`)
          .join(', ');
        const values = [...Object.values(ticketData), id];
        
        const [result] = await connection.query(
          `UPDATE tickets SET ${fields} WHERE ticket_id = ?`,
          values
        );
        
        // Get the updated ticket data for history entry
        const [ticket] = await connection.query('SELECT * FROM tickets WHERE ticket_id = ?', [id]);
        
        if (ticket.length === 0) {
          throw new Error('Ticket not found after update');
        }
        
        // Add history entry
        await connection.query(
          'INSERT INTO ticket_history (ticket_id, action, notes, order_id, issue_date, price, order_type, used, student_id, qr_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            id, 
            action, 
            notes, 
            ticket[0].order_id,
            ticket[0].issue_date,
            ticket[0].price,
            ticket[0].order_type,
            ticket[0].used,
            ticket[0].student_id,
            ticket[0].qr_data
          ]
        );
        
        await connection.commit();
        return result.affectedRows > 0;
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error(`Error updating ticket ${id}:`, error.message);
      throw error;
    }
  },
  
  // Mark ticket as used
  markAsUsed: async (id, notes = 'Ticket marked as used') => {
    return await TicketModel.update(id, { used: 1 }, 'used', notes);
  },

  // Delete ticket
  delete: async (id) => {
    try {
      // Start a transaction
      const connection = await pool.getConnection();
      await connection.beginTransaction();
      
      try {
        // Delete history first (due to foreign key constraints)
        await connection.query('DELETE FROM ticket_history WHERE ticket_id = ?', [id]);
        
        // Then delete the ticket
        const [result] = await connection.query('DELETE FROM tickets WHERE ticket_id = ?', [id]);
        
        await connection.commit();
        return result.affectedRows > 0;
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error(`Error deleting ticket ${id}:`, error.message);
      throw error;
    }
  },

  // Find tickets by date range
  findByDateRange: async (startDate, endDate) => {
    try {
      let query = `
        SELECT t.*, s.full_name as student_name
        FROM tickets t
        LEFT JOIN students s ON t.student_id = s.student_id
        WHERE 1=1
      `;
      
      const params = [];
      
      if (startDate) {
        query += ' AND t.issue_date >= ?';
        params.push(startDate);
      }
      
      if (endDate) {
        query += ' AND t.issue_date <= ?';
        params.push(endDate);
      }
      
      query += ' ORDER BY t.issue_date DESC';
      
      const [rows] = await pool.query(query, params);
      return rows;
    } catch (error) {
      console.error(`Error finding tickets by date range:`, error.message);
      throw error;
    }
  },
};

module.exports = TicketModel; 