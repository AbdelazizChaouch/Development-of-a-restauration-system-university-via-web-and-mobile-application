const { pool } = require('../config/db');

const UniversityModel = {
  // Get all universities
  findAll: async () => {
    try {
      const [rows] = await pool.query('SELECT * FROM university');
      return rows;
    } catch (error) {
      console.error('Error in findAll universities:', error.message);
      throw error;
    }
  },

  // Get university by id
  findById: async (id) => {
    try {
      const [rows] = await pool.query('SELECT * FROM university WHERE university_id = ?', [id]);
      return rows[0];
    } catch (error) {
      console.error(`Error in findById university ${id}:`, error.message);
      throw error;
    }
  },
  
  // Get university with students
  findWithStudents: async (universityId) => {
    try {
      const [university] = await pool.query('SELECT * FROM university WHERE university_id = ?', [universityId]);
      
      if (university.length === 0) {
        return null;
      }
      
      const [students] = await pool.query(
        'SELECT * FROM students WHERE university_id = ?',
        [universityId]
      );
      
      return {
        ...university[0],
        students
      };
    } catch (error) {
      console.error(`Error finding university with students ${universityId}:`, error.message);
      throw error;
    }
  },

  // Create new university
  create: async (universityData) => {
    try {
      const { university_description } = universityData;
      const [result] = await pool.query(
        'INSERT INTO university (university_description) VALUES (?)',
        [university_description]
      );
      return { university_id: result.insertId, ...universityData };
    } catch (error) {
      console.error('Error creating university:', error.message);
      throw error;
    }
  },

  // Update university
  update: async (id, universityData) => {
    try {
      const { university_description } = universityData;
      const [result] = await pool.query(
        'UPDATE university SET university_description = ? WHERE university_id = ?',
        [university_description, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Error updating university ${id}:`, error.message);
      throw error;
    }
  },

  // Delete university
  delete: async (id) => {
    try {
      const [result] = await pool.query('DELETE FROM university WHERE university_id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Error deleting university ${id}:`, error.message);
      throw error;
    }
  }
};

module.exports = UniversityModel; 