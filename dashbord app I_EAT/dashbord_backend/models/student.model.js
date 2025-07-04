const { pool } = require('../config/db');
const UserActivityLogger = require('../utils/userActivityLogger');

const StudentModel = {
  // Get all students with university card info
  findAll: async () => {
    try {
      const [rows] = await pool.query(`
        SELECT s.*, uc.card_number, uc.sold as balance
        FROM students s
        LEFT JOIN university_cards uc ON s.student_id = uc.student_id
      `);
      return rows;
    } catch (error) {
      console.error('Error in findAll students:', error.message);
      throw error;
    }
  },

  // Get student by id with university card info
  findById: async (id) => {
    try {
      const [rows] = await pool.query(`
        SELECT s.*, uc.card_number, uc.sold as balance
        FROM students s
        LEFT JOIN university_cards uc ON s.student_id = uc.student_id
        WHERE s.student_id = ?
      `, [id]);
      return rows[0];
    } catch (error) {
      console.error(`Error in findById student ${id}:`, error.message);
      throw error;
    }
  },
  
  // Get student by cn (consumer number)
  findByCN: async (cn) => {
    try {
      const [rows] = await pool.query('SELECT * FROM students WHERE cn = ?', [cn]);
      return rows[0];
    } catch (error) {
      console.error(`Error finding student by CN ${cn}:`, error.message);
      throw error;
    }
  },
  
  // Get student by card_id
  findByCardId: async (cardId) => {
    try {
      const [rows] = await pool.query('SELECT * FROM students WHERE card_id = ?', [cardId]);
      return rows[0];
    } catch (error) {
      console.error(`Error finding student by card ID ${cardId}:`, error.message);
      throw error;
    }
  },
  
  // Get student with university details including card info
  findWithUniversity: async (studentId) => {
    try {
      const [rows] = await pool.query(`
        SELECT s.*, u.university_description, uc.card_number, uc.sold as balance
        FROM students s
        LEFT JOIN university u ON s.university_id = u.university_id
        LEFT JOIN university_cards uc ON s.student_id = uc.student_id
        WHERE s.student_id = ?
      `, [studentId]);
      return rows[0];
    } catch (error) {
      console.error(`Error finding student with university ${studentId}:`, error.message);
      throw error;
    }
  },
  
  // Get student with tickets
  findWithTickets: async (studentId) => {
    try {
      const [tickets] = await pool.query(`
        SELECT *
        FROM tickets
        WHERE student_id = ?
      `, [studentId]);
      
      const [student] = await pool.query('SELECT * FROM students WHERE student_id = ?', [studentId]);
      
      if (student.length === 0) {
        return null;
      }
      
      return {
        ...student[0],
        tickets
      };
    } catch (error) {
      console.error(`Error finding student with tickets ${studentId}:`, error.message);
      throw error;
    }
  },

  // Create new student with university card
  create: async (studentData) => {
    try {
      console.log('Attempting to create student with data:', JSON.stringify(studentData));
      
      // Validate required fields
      if (!studentData.student_id) {
        throw new Error('Student ID is required');
      }
      
      // Check if a student with this ID already exists
      const [existingStudent] = await pool.query(
        'SELECT * FROM students WHERE student_id = ?', 
        [studentData.student_id]
      );
      
      if (existingStudent.length > 0) {
        console.error(`Duplicate student ID detected: ${studentData.student_id}`);
        throw new Error(`Student with ID ${studentData.student_id} already exists`);
      }
      
      // Also check for duplicate CN if provided
      if (studentData.cn) {
        const [existingCN] = await pool.query(
          'SELECT * FROM students WHERE cn = ?', 
          [studentData.cn]
        );
        
        if (existingCN.length > 0) {
          console.error(`Duplicate CN detected: ${studentData.cn}`);
          throw new Error(`Student with CN ${studentData.cn} already exists`);
        }
      }
      
      // Begin transaction
      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        // Create a university card for this student first so we have the card number
        // Generate a unique card number (4 letters + 5 digits)
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let cardPrefix = '';
        for (let i = 0; i < 4; i++) {
          cardPrefix += letters.charAt(Math.floor(Math.random() * letters.length));
        }
        const cardNumber = `${cardPrefix}${String(Math.floor(10000 + Math.random() * 90000))}`;
        
        // Generate QR code data with student and card information
        const qrData = {
          student_id: studentData.student_id,
          cn: studentData.cn || '',
          full_name: studentData.full_name || '',
          card_number: cardNumber,
          university_id: studentData.university_id || 0
        };
        
        // Convert QR data to JSON string
        const qrCodeString = JSON.stringify(qrData);
        console.log('Generated QR code data:', qrCodeString);
        
        // Insert the student with the QR code data
        // Direct approach to ensure code_qr is included
        const [studentResult] = await connection.query(
          `INSERT INTO students (
            student_id, 
            cn, 
            full_name, 
            profile_img, 
            university_id, 
            code_qr
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            studentData.student_id,
            studentData.cn || null,
            studentData.full_name || null,
            studentData.profile_img || null,
            studentData.university_id || null,
            qrCodeString // Explicitly include the QR code
          ]
        );
        
        console.log('Insert student result:', JSON.stringify(studentResult));
        
        // If MySQL doesn't return the insertId (which can happen if student_id is provided),
        // use the provided student_id
        const studentId = studentResult.insertId || studentData.student_id;
        
        // Insert the university card
        const [cardResult] = await connection.query(
          'INSERT INTO university_cards (student_id, card_number, sold, used) VALUES (?, ?, ?, ?)',
          [studentId, cardNumber, 0, 0] // Initial balance (sold) is 0, card is not used
        );
        
        console.log('University card created with ID:', cardResult.insertId);
        
        // Update the student record with the card_id reference
        await connection.query(
          'UPDATE students SET card_id = ? WHERE student_id = ?',
          [cardResult.insertId, studentId]
        );
        
        console.log(`Updated student with card_id: ${cardResult.insertId}`);
        
        // Double-check that the QR code was saved by verifying the final student record
        const [verifyStudent] = await connection.query(
          'SELECT code_qr FROM students WHERE student_id = ?',
          [studentId]
        );
        
        console.log('Verification of student QR code:', verifyStudent[0]?.code_qr);
        
        // If QR code is still null, try to update it again
        if (!verifyStudent[0]?.code_qr) {
          console.log('QR code is still null, updating it explicitly...');
          await connection.query(
            'UPDATE students SET code_qr = ? WHERE student_id = ?',
            [qrCodeString, studentId]
          );
        }
        
        // Get the complete student with university card info
        const [student] = await connection.query(`
          SELECT s.*, u.university_description, uc.card_number, uc.sold as balance
          FROM students s
          LEFT JOIN university u ON s.university_id = u.university_id
          LEFT JOIN university_cards uc ON s.student_id = uc.student_id
          WHERE s.student_id = ?
        `, [studentId]);
        
        // Commit the transaction
        await connection.commit();
        
        // Return the complete student object with card info
        return student[0] || { 
          student_id: studentId, 
          full_name: studentData.full_name,
          cn: studentData.cn,
          card_number: cardNumber,
          balance: 0,
          code_qr: qrCodeString // Include QR code in the response
        };
      } catch (transactionError) {
        // Roll back the transaction on error
        await connection.rollback();
        
        console.error('Transaction error:', transactionError);
        
        // Add more context to the error
        if (transactionError.code === 'ER_DUP_ENTRY') {
          throw new Error('A student with this ID, CN, or card ID already exists');
        } else if (transactionError.code === 'ER_NO_REFERENCED_ROW_2') {
          throw new Error('Referenced university_id does not exist');
        } else {
          throw transactionError;
        }
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error creating student:', error);
      // Add more context to the error
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('A student with this ID already exists');
      } else {
        throw error;
      }
    }
  },

  // Update student
  update: async (id, studentData) => {
    try {
      // Save the updated_by user ID for logging
      const updatedBy = studentData.updated_by;
      
      // Set the updated_at timestamp if not provided
      if (!studentData.updated_at) {
        studentData.updated_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
      }
      
      const fields = Object.keys(studentData)
        .map(key => `${key} = ?`)
        .join(', ');
      const values = [...Object.values(studentData), id];
      
      // Get a connection for transaction
      const connection = await pool.getConnection();
      await connection.beginTransaction();
      
      try {
        // Get the original student data for comparison
        const [originalStudent] = await connection.query(
          'SELECT * FROM students WHERE student_id = ?',
          [id]
        );
        
        if (originalStudent.length === 0) {
          throw new Error(`Student with ID ${id} not found`);
        }
        
        // Update the student
        const [result] = await connection.query(
          `UPDATE students SET ${fields} WHERE student_id = ?`,
          values
        );
        
        // Log the activity if we have an updated_by user ID
        if (updatedBy && result.affectedRows > 0) {
          // Determine which fields were updated
          const updatedFields = Object.keys(studentData).filter(key => 
            key !== 'updated_by' && key !== 'updated_at'
          );
          
          await UserActivityLogger.log({
            user_id: updatedBy,
            action: 'update',
            entity_type: 'student',
            entity_id: id,
            details: {
              updated_fields: updatedFields
            }
          });
        }
        
        // Commit the transaction
        await connection.commit();
        
        return result.affectedRows > 0;
      } catch (transactionError) {
        // Rollback on error
        await connection.rollback();
        console.error('Error in student update transaction:', transactionError);
        throw transactionError;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error(`Error updating student ${id}:`, error.message);
      throw error;
    }
  },

  // Delete student
  delete: async (id, userId) => {
    try {
      // Get a connection for transaction
      const connection = await pool.getConnection();
      await connection.beginTransaction();
      
      try {
        // Get the student details for logging
        const [studentDetails] = await connection.query(
          'SELECT * FROM students WHERE student_id = ?',
          [id]
        );
        
        if (studentDetails.length === 0) {
          return false; // Student not found
        }
        
        // Get the card ID if it exists
        const cardId = studentDetails[0].card_id;
        
        // Delete the university card if it exists
        if (cardId) {
          await connection.query('DELETE FROM university_cards WHERE card_id = ?', [cardId]);
        }
        
        // Delete the student
        const [result] = await connection.query('DELETE FROM students WHERE student_id = ?', [id]);
        
        // Log the activity if we have a user ID
        if (userId && result.affectedRows > 0) {
          await UserActivityLogger.log({
            user_id: userId,
            action: 'delete',
            entity_type: 'student',
            entity_id: id,
            details: {
              student_id: id,
              full_name: studentDetails[0].full_name,
              cn: studentDetails[0].cn,
              card_id: cardId,
              deleted_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
            }
          });
        }
        
        // Commit the transaction
        await connection.commit();
        
        return result.affectedRows > 0;
      } catch (transactionError) {
        // Rollback on error
        await connection.rollback();
        console.error('Error in student deletion transaction:', transactionError);
        throw transactionError;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error(`Error deleting student ${id}:`, error.message);
      throw error;
    }
  },

  // Get total count of students
  getTotalCount: async () => {
    try {
      const [rows] = await pool.query('SELECT COUNT(*) as total FROM students');
      return rows[0].total;
    } catch (error) {
      console.error('Error getting total student count:', error);
      throw error;
    }
  }
};

module.exports = StudentModel; 