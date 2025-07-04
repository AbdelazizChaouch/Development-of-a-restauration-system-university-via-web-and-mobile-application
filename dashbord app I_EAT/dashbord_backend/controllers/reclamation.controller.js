const ReclamationModel = require('../models/Reclamation');
const StudentModel = require('../models/student.model');
const UniversityCardController = require('./university-card.controller');
const UniversityCardModel = require('../models/university-card.model');

const ReclamationController = {
  // Get all reclamations with optional filtering
  getAll: async (req, res) => {
    try {
      const filters = {
        status: req.query.status,
        staff_id: req.query.staff_id,
        limit: req.query.limit
      };

      const reclamations = await ReclamationModel.findAll(filters);
      res.json({
        success: true,
        data: reclamations
      });
    } catch (error) {
      console.error('Error fetching reclamations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch reclamations',
        error: error.message
      });
    }
  },

  // Get reclamation by ID
  getById: async (req, res) => {
    try {
      const reclamation = await ReclamationModel.findById(req.params.id);
      
      if (!reclamation) {
        return res.status(404).json({
          success: false,
          message: 'Reclamation not found'
        });
      }
      
      res.json({
        success: true,
        data: reclamation
      });
    } catch (error) {
      console.error(`Error fetching reclamation with ID ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch reclamation',
        error: error.message
      });
    }
  },

  // Create new reclamation
  create: async (req, res) => {
    try {
      // Check if student exists
      const student = await StudentModel.findById(req.body.student_id);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found',
          error: 'STUDENT_NOT_FOUND'
        });
      }

      // Staff ID comes from authenticated user
      const reclamationData = {
        ...req.body,
        staff_id: req.user.id
      };
      
      const newReclamation = await ReclamationModel.create(reclamationData);
      
      res.status(201).json({
        success: true,
        message: 'Reclamation created successfully',
        data: newReclamation
      });
    } catch (error) {
      console.error('Error creating reclamation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create reclamation',
        error: error.message
      });
    }
  },

  // Process reclamation (approve or reject)
  process: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, admin_notes } = req.body;
      
      if (!status || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be either "approved" or "rejected"'
        });
      }
      
      // Get the reclamation
      const reclamation = await ReclamationModel.findById(id);
      if (!reclamation) {
        return res.status(404).json({
          success: false,
          message: 'Reclamation not found'
        });
      }
      
      if (reclamation.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: `Reclamation has already been ${reclamation.status}`
        });
      }
      
      // Update reclamation
      const updateData = {
        status,
        admin_id: req.user.id,
        admin_notes,
        processed_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
      };
      
      const updatedReclamation = await ReclamationModel.update(id, updateData);
      
      // If approved, deduct funds from student's card
      if (status === 'approved') {
        try {
          const card = await UniversityCardModel.findByStudentId(reclamation.student_id);
          
          if (!card) {
            return res.status(404).json({
              success: false,
              message: 'Student card not found'
            });
          }
          
          // Deduct funds
          await UniversityCardController.deductFundsAdmin(
            card.id, 
            reclamation.amount, 
            `Funds deducted due to reclamation: ${reclamation.reason}`,
            req.user.id
          );
          
          // Mark reclamation as processed
          await ReclamationModel.update(id, { status: 'processed' });
        } catch (cardError) {
          console.error('Error processing card deduction:', cardError);
          
          // Update reclamation with error
          await ReclamationModel.update(id, { 
            admin_notes: `${admin_notes || ''}\nError processing deduction: ${cardError.message}`,
            status: 'error'
          });
          
          return res.status(500).json({
            success: false,
            message: 'Reclamation approved but failed to deduct funds',
            error: cardError.message
          });
        }
      }
      
      res.json({
        success: true,
        message: `Reclamation ${status} successfully`,
        data: updatedReclamation
      });
    } catch (error) {
      console.error(`Error processing reclamation ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to process reclamation',
        error: error.message
      });
    }
  },

  // Get counts by status
  getCounts: async (req, res) => {
    try {
      const counts = await ReclamationModel.getCountByStatus();
      res.json({
        success: true,
        data: counts
      });
    } catch (error) {
      console.error('Error fetching reclamation counts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch reclamation counts',
        error: error.message
      });
    }
  }
};

module.exports = ReclamationController; 