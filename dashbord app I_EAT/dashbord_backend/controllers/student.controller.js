const StudentModel = require('../models/student.model');
const UserActivityLogger = require('../utils/userActivityLogger');

const StudentController = {
  /**
   * Get all students
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getAll: async (req, res) => {
    try {
      const students = await StudentModel.findAll();
      res.status(200).json({
        success: true,
        data: students
      });
    } catch (error) {
      console.error('Error getting all students:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve students',
        error: error.message
      });
    }
  },

  /**
   * Get student by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const student = await StudentModel.findById(id);
      
      if (!student) {
        return res.status(404).json({
          success: false,
          message: `Student with ID ${id} not found`
        });
      }
      
      res.status(200).json({
        success: true,
        data: student
      });
    } catch (error) {
      console.error(`Error getting student ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve student',
        error: error.message
      });
    }
  },

  /**
   * Create a new student
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  create: async (req, res) => {
    try {
      const studentData = req.body;
      
      // Add the authenticated user ID as created_by if available
      if (req.user && req.user.id) {
        // Only set created_by if not already present (allows frontend testing)
        if (!studentData.created_by) {
          studentData.created_by = req.user.id;
        }
      }
      
      const student = await StudentModel.create(studentData);
      
      // Log the creation activity
      if (req.user && req.user.id) {
        await UserActivityLogger.log({
          user_id: req.user.id,
          action: 'create',
          entity_type: 'student',
          entity_id: student.student_id,
          details: {
            student_id: student.student_id,
            full_name: student.full_name,
            cn: student.cn,
            ip_address: req.ip
          }
        });
      }
      
      res.status(201).json({
        success: true,
        message: 'Student created successfully',
        data: student
      });
    } catch (error) {
      console.error('Error creating student:', error);
      
      // Handle specific error cases
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          message: error.message,
          error: 'DUPLICATE_ENTRY'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to create student',
        error: error.message
      });
    }
  },

  /**
   * Update a student
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const studentData = req.body;
      
      // Add the authenticated user ID as updated_by if available
      if (req.user && req.user.id) {
        studentData.updated_by = req.user.id;
      }
      
      const success = await StudentModel.update(id, studentData);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          message: `Student with ID ${id} not found or no changes made`
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Student updated successfully'
      });
    } catch (error) {
      console.error(`Error updating student ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to update student',
        error: error.message
      });
    }
  },

  /**
   * Delete a student
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id; // Get the authenticated user ID
      
      const success = await StudentModel.delete(id, userId);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          message: `Student with ID ${id} not found`
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Student deleted successfully'
      });
    } catch (error) {
      console.error(`Error deleting student ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete student',
        error: error.message
      });
    }
  },

  // Get total count of students
  getTotalCount: async (req, res) => {
    try {
      const total = await StudentModel.getTotalCount();
      res.status(200).json({
        success: true,
        data: { total }
      });
    } catch (error) {
      console.error('Error getting total student count:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get total student count',
        error: error.message
      });
    }
  }
};

module.exports = StudentController; 