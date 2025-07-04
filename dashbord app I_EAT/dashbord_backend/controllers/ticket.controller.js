const TicketModel = require('../models/ticket.model');
const UserActivityLogger = require('../utils/userActivityLogger');

/**
 * Controller for ticket-related operations
 */
const TicketController = {
  /**
   * Get all tickets
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getAllTickets: async (req, res) => {
    try {
      // Extract filter parameters from query
      const { startDate, endDate } = req.query;
      
      let tickets;
      
      // If date filters are provided, use them
      if (startDate || endDate) {
        tickets = await TicketModel.findByDateRange(startDate, endDate);
      } else {
        tickets = await TicketModel.findAll();
      }
      
      // Log the activity
      await UserActivityLogger.log({
        user_id: req.user.id,
        action: 'view',
        entity_type: 'ticket',
        entity_id: null,
        details: { 
          message: 'Viewed all tickets',
          filters: { startDate, endDate }
        },
        ip_address: req.ip
      }, req);
      
      return res.status(200).json({
        success: true,
        message: 'Tickets retrieved successfully',
        data: tickets
      });
    } catch (error) {
      console.error('Error in getAllTickets:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve tickets',
        error: error.message
      });
    }
  },
  
  /**
   * Get unused tickets
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getUnusedTickets: async (req, res) => {
    try {
      const tickets = await TicketModel.getUnused();
      
      // Log the activity
      await UserActivityLogger.log({
        user_id: req.user.id,
        action: 'view',
        entity_type: 'ticket',
        entity_id: null,
        details: { message: 'Viewed unused tickets' },
        ip_address: req.ip
      }, req);
      
      return res.status(200).json({
        success: true,
        message: 'Unused tickets retrieved successfully',
        data: tickets
      });
    } catch (error) {
      console.error('Error in getUnusedTickets:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve unused tickets',
        error: error.message
      });
    }
  },
  
  /**
   * Get ticket by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getTicketById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const ticket = await TicketModel.findById(id);
      
      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: `Ticket with ID ${id} not found`
        });
      }
      
      // Log the activity
      await UserActivityLogger.log({
        user_id: req.user.id,
        action: 'view',
        entity_type: 'ticket',
        entity_id: id,
        details: { message: `Viewed ticket ${id}` },
        ip_address: req.ip
      }, req);
      
      return res.status(200).json({
        success: true,
        message: 'Ticket retrieved successfully',
        data: ticket
      });
    } catch (error) {
      console.error(`Error in getTicketById for ID ${req.params.id}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve ticket',
        error: error.message
      });
    }
  },
  
  /**
   * Get ticket with history
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getTicketWithHistory: async (req, res) => {
    try {
      const { id } = req.params;
      
      const ticketWithHistory = await TicketModel.findWithHistory(id);
      
      if (!ticketWithHistory) {
        return res.status(404).json({
          success: false,
          message: `Ticket with ID ${id} not found`
        });
      }
      
      // Log the activity
      await UserActivityLogger.log({
        user_id: req.user.id,
        action: 'view',
        entity_type: 'ticket',
        entity_id: id,
        details: { message: `Viewed ticket history for ${id}` },
        ip_address: req.ip
      }, req);
      
      return res.status(200).json({
        success: true,
        message: 'Ticket with history retrieved successfully',
        data: ticketWithHistory
      });
    } catch (error) {
      console.error(`Error in getTicketWithHistory for ID ${req.params.id}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve ticket with history',
        error: error.message
      });
    }
  },
  
  /**
   * Create a new ticket
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  createTicket: async (req, res) => {
    try {
      const { order_id, issue_date, price, order_type, student_id, qr_data } = req.body;
      
      // Validate required fields
      if (!order_id || !issue_date || !price || !order_type || !student_id) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }
      
      const newTicket = await TicketModel.create({
        order_id,
        issue_date,
        price,
        order_type,
        student_id,
        qr_data
      });
      
      // Log the activity
      await UserActivityLogger.log({
        user_id: req.user.id,
        action: 'create',
        entity_type: 'ticket',
        entity_id: newTicket.ticket_id,
        details: { 
          message: 'Created new ticket',
          ticket: newTicket
        },
        ip_address: req.ip
      }, req);
      
      return res.status(201).json({
        success: true,
        message: 'Ticket created successfully',
        data: newTicket
      });
    } catch (error) {
      console.error('Error in createTicket:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create ticket',
        error: error.message
      });
    }
  },
  
  /**
   * Update a ticket
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateTicket: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // Check if ticket exists
      const existingTicket = await TicketModel.findById(id);
      
      if (!existingTicket) {
        return res.status(404).json({
          success: false,
          message: `Ticket with ID ${id} not found`
        });
      }
      
      const updated = await TicketModel.update(id, updateData);
      
      if (!updated) {
        return res.status(400).json({
          success: false,
          message: 'Failed to update ticket'
        });
      }
      
      // Get the updated ticket
      const updatedTicket = await TicketModel.findById(id);
      
      // Log the activity
      await UserActivityLogger.log({
        user_id: req.user.id,
        action: 'update',
        entity_type: 'ticket',
        entity_id: id,
        details: { 
          message: `Updated ticket ${id}`,
          changes: updateData
        },
        ip_address: req.ip
      }, req);
      
      return res.status(200).json({
        success: true,
        message: 'Ticket updated successfully',
        data: updatedTicket
      });
    } catch (error) {
      console.error(`Error in updateTicket for ID ${req.params.id}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update ticket',
        error: error.message
      });
    }
  },
  
  /**
   * Mark a ticket as used
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  markTicketAsUsed: async (req, res) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      
      // Check if ticket exists
      const existingTicket = await TicketModel.findById(id);
      
      if (!existingTicket) {
        return res.status(404).json({
          success: false,
          message: `Ticket with ID ${id} not found`
        });
      }
      
      // Check if ticket is already used
      if (existingTicket.used === 1) {
        return res.status(400).json({
          success: false,
          message: `Ticket with ID ${id} is already marked as used`
        });
      }
      
      const updated = await TicketModel.markAsUsed(id, notes || 'Ticket marked as used');
      
      if (!updated) {
        return res.status(400).json({
          success: false,
          message: 'Failed to mark ticket as used'
        });
      }
      
      // Get the updated ticket
      const updatedTicket = await TicketModel.findById(id);
      
      // Log the activity
      await UserActivityLogger.log({
        user_id: req.user.id,
        action: 'use',
        entity_type: 'ticket',
        entity_id: id,
        details: { 
          message: `Marked ticket ${id} as used`,
          notes: notes || 'Ticket marked as used'
        },
        ip_address: req.ip
      }, req);
      
      return res.status(200).json({
        success: true,
        message: 'Ticket marked as used successfully',
        data: updatedTicket
      });
    } catch (error) {
      console.error(`Error in markTicketAsUsed for ID ${req.params.id}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to mark ticket as used',
        error: error.message
      });
    }
  },
  
  /**
   * Delete a ticket
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteTicket: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if ticket exists
      const existingTicket = await TicketModel.findById(id);
      
      if (!existingTicket) {
        return res.status(404).json({
          success: false,
          message: `Ticket with ID ${id} not found`
        });
      }
      
      const deleted = await TicketModel.delete(id);
      
      if (!deleted) {
        return res.status(400).json({
          success: false,
          message: 'Failed to delete ticket'
        });
      }
      
      // Log the activity
      await UserActivityLogger.log({
        user_id: req.user.id,
        action: 'delete',
        entity_type: 'ticket',
        entity_id: id,
        details: { 
          message: `Deleted ticket ${id}`,
          ticket: existingTicket
        },
        ip_address: req.ip
      }, req);
      
      return res.status(200).json({
        success: true,
        message: 'Ticket deleted successfully'
      });
    } catch (error) {
      console.error(`Error in deleteTicket for ID ${req.params.id}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete ticket',
        error: error.message
      });
    }
  },

  getTotalTickets: async (req, res) => {
    try {
      const tickets = await TicketModel.findAll();
      const totalCount = tickets.length;
      
      // Log the activity
      await UserActivityLogger.log({
        user_id: req.user.id,
        action: 'view',
        entity_type: 'ticket',
        entity_id: null,
        details: { message: 'Viewed total tickets count' },
        ip_address: req.ip
      }, req);
      
      return res.status(200).json({
        success: true,
        message: 'Total tickets count retrieved successfully',
        data: { total: totalCount }
      });
    } catch (error) {
      console.error('Error in getTotalTickets:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve total tickets count',
        error: error.message
      });
    }
  },

  getTodayOrders: async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tickets = await TicketModel.findByDateRange(today, new Date());
      const todayCount = tickets.length;
      
      // Log the activity
      await UserActivityLogger.log({
        user_id: req.user.id,
        action: 'view',
        entity_type: 'ticket',
        entity_id: null,
        details: { message: 'Viewed today\'s orders count' },
        ip_address: req.ip
      }, req);
      
      return res.status(200).json({
        success: true,
        message: 'Today\'s orders count retrieved successfully',
        data: { total: todayCount }
      });
    } catch (error) {
      console.error('Error in getTodayOrders:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve today\'s orders count',
        error: error.message
      });
    }
  }
};

module.exports = TicketController; 