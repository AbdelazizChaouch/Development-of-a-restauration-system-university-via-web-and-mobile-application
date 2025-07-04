const UniversityCardModel = require('../models/university-card.model');
const UserActivityLogger = require('../utils/userActivityLogger');
const { pool } = require('../config/db');
const UniversityCardLogModel = require('../models/university-card-log.model');

const UniversityCardController = {
  /**
   * Get all university cards
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getAll: async (req, res) => {
    try {
      const cards = await UniversityCardModel.findAll();
      res.status(200).json({
        success: true,
        data: cards
      });
    } catch (error) {
      console.error('Error getting all university cards:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve university cards',
        error: error.message
      });
    }
  },

  /**
   * Get university card by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const card = await UniversityCardModel.findWithStudentDetails(id);
      
      if (!card) {
        return res.status(404).json({
          success: false,
          message: `University card with ID ${id} not found`
        });
      }
      
      res.status(200).json({
        success: true,
        data: card
      });
    } catch (error) {
      console.error(`Error getting university card ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve university card',
        error: error.message
      });
    }
  },

  /**
   * Get university card by student ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getByStudentId: async (req, res) => {
    try {
      const { studentId } = req.params;
      const card = await UniversityCardModel.findByStudentId(studentId);
      
      if (!card) {
        return res.status(404).json({
          success: false,
          message: `University card for student ${studentId} not found`
        });
      }
      
      res.status(200).json({
        success: true,
        data: card
      });
    } catch (error) {
      console.error(`Error getting university card for student ${req.params.studentId}:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve university card',
        error: error.message
      });
    }
  },

  /**
   * Create a new university card
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  create: async (req, res) => {
    try {
      const cardData = req.body;
      
      // Add the authenticated user ID as created_by if available
      if (req.user && req.user.id) {
        // Only set created_by if not already present (allows frontend testing)
        if (!cardData.created_by) {
          cardData.created_by = req.user.id;
        }
      }
      
      const card = await UniversityCardModel.create(cardData);
      
      res.status(201).json({
        success: true,
        message: 'University card created successfully',
        data: card
      });
    } catch (error) {
      console.error('Error creating university card:', error);
      
      // Handle specific error cases
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          message: error.message,
          error: 'DUPLICATE_ENTRY'
        });
      } else if (error.message.includes('does not exist')) {
        return res.status(404).json({
          success: false,
          message: error.message,
          error: 'STUDENT_NOT_FOUND'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to create university card',
        error: error.message
      });
    }
  },

  /**
   * Update a university card
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const cardData = req.body;
      
      // Add the authenticated user ID as updated_by if available
      if (req.user && req.user.id) {
        cardData.updated_by = req.user.id;
      }
      
      const success = await UniversityCardModel.update(id, cardData);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          message: `University card with ID ${id} not found or no changes made`
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'University card updated successfully'
      });
    } catch (error) {
      console.error(`Error updating university card ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to update university card',
        error: error.message
      });
    }
  },

  /**
   * Mark a university card as used
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  markAsUsed: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id || null; // Get the authenticated user ID
      
      const success = await UniversityCardModel.markAsUsed(id, userId);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          message: `University card with ID ${id} not found`
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'University card marked as used successfully'
      });
    } catch (error) {
      console.error(`Error marking university card ${req.params.id} as used:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark university card as used',
        error: error.message
      });
    }
  },

  /**
   * Delete a university card
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id; // Get the authenticated user ID
      
      const success = await UniversityCardModel.delete(id, userId);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          message: `University card with ID ${id} not found`
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'University card deleted successfully'
      });
    } catch (error) {
      console.error(`Error deleting university card ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete university card',
        error: error.message
      });
    }
  },
  
  /**
   * Get activity logs for a university card
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getActivityLogs: async (req, res) => {
    try {
      const { id } = req.params;
      const { limit = 50, offset = 0 } = req.query;
      
      // First check if the card exists
      const card = await UniversityCardModel.findById(id);
      
      if (!card) {
        return res.status(404).json({
          success: false,
          message: `University card with ID ${id} not found`
        });
      }
      
      const logs = await UserActivityLogger.getEntityActivityLogs(
        'university_card', 
        id, 
        { limit: parseInt(limit), offset: parseInt(offset) }
      );
      
      res.status(200).json({
        success: true,
        data: logs
      });
    } catch (error) {
      console.error(`Error getting activity logs for university card ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve activity logs',
        error: error.message
      });
    }
  },

  /**
   * Update a university card balance
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateBalance: async (req, res) => {
    try {
      const { id } = req.params;
      const { amount, operation = 'add' } = req.body;
      
      console.log(`Received balance update request for card ${id}:`, { 
        amount, 
        operation, 
        user: req.user,
        headers: req.headers,
        body: req.body 
      });
      
      // Validate amount
      if (amount === undefined || isNaN(parseFloat(amount))) {
        return res.status(400).json({
          success: false,
          message: 'Valid amount is required'
        });
      }

      // Convert amount to a number
      const numericAmount = parseFloat(amount);
      
      // Get the authenticated user
      const userId = req.user?.id || req.headers['x-user-id'];
      const userRole = req.user?.role || req.headers['x-user-role'] || 'staff';
      
      console.log('User authentication details:', { 
        userId, 
        userRole, 
        headers: req.headers,
        user: req.user 
      });
      
      // Check if user exists
      if (!userId) {
        console.log('Authentication failed - no user ID:', { 
          userId, 
          userRole, 
          headers: req.headers,
          authHeader: req.headers.authorization
        });
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      // Role-based permission check
      if (operation === 'subtract' && userRole !== 'admin') {
        console.log('Permission denied for subtract operation:', { userRole });
        return res.status(403).json({
          success: false,
          message: 'Only administrators can subtract funds from cards'
        });
      }
      
      if (userRole === 'viewer') {
        console.log('Permission denied for viewer role:', { userRole });
        return res.status(403).json({
          success: false,
          message: 'Viewers cannot modify card balances'
        });
      }
      
      // Get the current card to check its balance
      const currentCard = await UniversityCardModel.findById(id);
      if (!currentCard) {
        return res.status(404).json({
          success: false,
          message: `University card with ID ${id} not found`
        });
      }
      
      console.log(`Current card balance for ${id}:`, currentCard.sold);
      
      // Calculate the new balance
      let newBalance;
      if (operation === 'subtract') {
        // Check if there are sufficient funds
        if (currentCard.sold < numericAmount) {
          return res.status(400).json({
            success: false,
            message: `Insufficient funds on card. Current balance: ${currentCard.sold} DT`
          });
        }
        newBalance = currentCard.sold - numericAmount;
      } else {
        // Default operation is add
        newBalance = currentCard.sold + numericAmount;
      }
      
      console.log(`New balance will be: ${newBalance} DT`);
      
      // Update the card balance
      const updateData = {
        sold: newBalance,
        updated_by: userId
      };
      
      try {
        const success = await UniversityCardModel.update(id, updateData);
        
        if (!success) {
          return res.status(500).json({
            success: false,
            message: 'Failed to update card balance'
          });
        }
        
        // Log the activity
        await UserActivityLogger.log({
          user_id: userId,
          action: operation === 'subtract' ? 'subtract_funds' : 'add_funds',
          entity_type: 'university_card',
          entity_id: id,
          details: {
            previous_balance: `${currentCard.sold} DT`,
            new_balance: `${newBalance} DT`,
            amount: `${numericAmount} DT`,
            operation: operation
          }
        });
        
        console.log(`Successfully updated balance for card ${id} to ${newBalance} DT`);
        
        res.status(200).json({
          success: true,
          message: `Card balance ${operation === 'subtract' ? 'decreased' : 'increased'} successfully`,
          data: {
            card_id: id,
            previous_balance: `${currentCard.sold} DT`,
            new_balance: `${newBalance} DT`,
            amount: `${numericAmount} DT`,
            operation: operation
          }
        });
      } catch (updateError) {
        console.error(`Error updating card balance:`, updateError);
        res.status(500).json({
          success: false,
          message: 'Database error while updating card balance',
          error: updateError.message,
          details: updateError.code || 'Unknown error code'
        });
      }
    } catch (error) {
      console.error(`Error updating balance for university card ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to update card balance',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  },

  /**
   * Get all activity logs for university cards with filtering
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getAllActivityLogs: async (req, res) => {
    try {
      const { 
        userId, 
        startDate, 
        endDate, 
        action,
        limit = 100, 
        offset = 0 
      } = req.query;
      
      console.log('Getting university card activity logs with filters:', {
        userId, startDate, endDate, action, limit, offset
      });
      
      const filters = {};
      if (userId) filters.userId = userId;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      if (action) filters.action = action;
      
      const options = {
        limit: parseInt(limit),
        offset: parseInt(offset)
      };
      
      const logs = await UserActivityLogger.getUniversityCardLogs(filters, options);
      
      res.status(200).json({
        success: true,
        count: logs.length,
        data: logs
      });
    } catch (error) {
      console.error('Error getting all university card activity logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve activity logs',
        error: error.message
      });
    }
  },

  /**
   * Get all university cards with student details
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getAllWithStudentDetails: async (req, res) => {
    try {
      console.log('Getting all university cards with student details:', {
        user: req.user,
        headers: req.headers
      });
      
      // Get all cards with student details including full name
      const [cards] = await pool.query(`
        SELECT uc.*, s.full_name, s.profile_img, s.cn, u.university_description
        FROM university_cards uc
        LEFT JOIN students s ON uc.student_id = s.student_id
        LEFT JOIN university u ON s.university_id = u.university_id
      `);
      
      console.log(`Found ${cards.length} university cards with student details`);
      
      res.status(200).json({
        success: true,
        cards: cards
      });
    } catch (error) {
      console.error('Error getting university cards with student details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve university cards with student details',
        error: error.message
      });
    }
  },

  /**
   * Get count of active university cards
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getActiveCardsCount: async (req, res) => {
    try {
      const [result] = await pool.query(
        'SELECT COUNT(*) as count FROM university_cards WHERE used = 0'
      );
      
      res.status(200).json({
        success: true,
        count: result[0].count
      });
    } catch (error) {
      console.error('Error getting active cards count:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve active cards count',
        error: error.message
      });
    }
  },

  /**
   * Get total revenue from all university cards
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getTotalRevenue: async (req, res) => {
    try {
      const [result] = await pool.query(
        'SELECT SUM(sold) as total_revenue FROM university_cards'
      );
      
      res.status(200).json({
        success: true,
        total: result[0].total_revenue || 0
      });
    } catch (error) {
      console.error('Error getting total revenue:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve total revenue',
        error: error.message
      });
    }
  },

  getDailyRevenue: async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get all cards and filter for today's transactions
      const cards = await UniversityCardModel.findAll();
      const todayRevenue = cards.reduce((total, card) => {
        const cardDate = new Date(card.updated_at || card.created_at);
        if (cardDate >= today) {
          return total + (card.sold || 0);
        }
        return total;
      }, 0);
      
      // Log the activity
      await UserActivityLogger.log({
        user_id: req.user.id,
        action: 'view',
        entity_type: 'university_card',
        entity_id: null,
        details: { message: 'Viewed daily revenue' },
        ip_address: req.ip
      });
      
      return res.status(200).json({
        success: true,
        message: 'Daily revenue retrieved successfully',
        data: { total: todayRevenue }
      });
    } catch (error) {
      console.error('Error in getDailyRevenue:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve daily revenue',
        error: error.message
      });
    }
  },

  /**
   * Get daily revenue data for the last 7 days
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getDailyRevenueTrend: async (req, res) => {
    try {
      // Get all cards and their creation dates
      const [cards] = await pool.query(`
        SELECT 
          DATE(created_at) as date,
          sold as amount
        FROM university_cards
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        ORDER BY created_at ASC
      `);

      // Group by date and sum the amounts
      const dailyTotals = cards.reduce((acc, card) => {
        const date = card.date.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + Number(card.amount);
        return acc;
      }, {});

      // Fill in missing days with 0 revenue
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      const revenueData = last7Days.map(date => ({
        date,
        revenue: dailyTotals[date] || 0
      }));

      res.status(200).json({
        success: true,
        data: revenueData
      });
    } catch (error) {
      console.error('Error getting daily revenue trend:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve daily revenue trend',
        error: error.message
      });
    }
  },

  // Method for admin to deduct funds (for reclamations)
  deductFundsAdmin: async (cardId, amount, reason, adminId) => {
    try {
      // Get card
      const card = await UniversityCardModel.findById(cardId);
      
      if (!card) {
        throw new Error('Card not found');
      }
      
      // Check if enough balance
      if (card.balance < amount) {
        throw new Error('Insufficient funds');
      }
      
      // Calculate new balance
      const newBalance = parseFloat(card.balance) - parseFloat(amount);
      
      // Update card balance
      const updated = await UniversityCardModel.update(cardId, { balance: newBalance });
      
      if (!updated) {
        throw new Error('Failed to update card balance');
      }
      
      // Log transaction
      await UniversityCardLogModel.create({
        card_id: cardId,
        action: 'deduct_funds_admin',
        amount: amount,
        previous_balance: card.balance,
        new_balance: newBalance,
        details: {
          reason,
          admin_id: adminId
        }
      });
      
      return { success: true, balance: newBalance };
    } catch (error) {
      console.error(`Error in deductFundsAdmin for card ${cardId}:`, error);
      throw error;
    }
  },
};

module.exports = UniversityCardController; 