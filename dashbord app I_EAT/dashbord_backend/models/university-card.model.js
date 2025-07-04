const { pool } = require('../config/db');
const UserActivityLogger = require('../utils/userActivityLogger');

const UniversityCardModel = {
  // Get all university cards
  findAll: async () => {
    try {
      const [rows] = await pool.query('SELECT * FROM university_cards');
      return rows;
    } catch (error) {
      console.error('Error in findAll university cards:', error.message);
      throw error;
    }
  },

  // Get university card by id
  findById: async (id) => {
    try {
      const [rows] = await pool.query('SELECT * FROM university_cards WHERE card_id = ?', [id]);
      return rows[0];
    } catch (error) {
      console.error(`Error in findById university card ${id}:`, error.message);
      throw error;
    }
  },
  
  // Get university card by student id
  findByStudentId: async (studentId) => {
    try {
      const [rows] = await pool.query('SELECT * FROM university_cards WHERE student_id = ?', [studentId]);
      return rows[0];
    } catch (error) {
      console.error(`Error finding university card for student ${studentId}:`, error.message);
      throw error;
    }
  },
  
  // Get university card by card number
  findByCardNumber: async (cardNumber) => {
    try {
      const [rows] = await pool.query('SELECT * FROM university_cards WHERE card_number = ?', [cardNumber]);
      return rows[0];
    } catch (error) {
      console.error(`Error finding university card with number ${cardNumber}:`, error.message);
      throw error;
    }
  },
  
  // Get university card with student details
  findWithStudentDetails: async (cardId) => {
    try {
      const [rows] = await pool.query(`
        SELECT uc.*, s.full_name, s.profile_img, s.cn, u.university_description
        FROM university_cards uc
        JOIN students s ON uc.student_id = s.student_id
        LEFT JOIN university u ON s.university_id = u.university_id
        WHERE uc.card_id = ?
      `, [cardId]);
      return rows[0];
    } catch (error) {
      console.error(`Error finding university card details ${cardId}:`, error.message);
      throw error;
    }
  },

  // Create new university card
  create: async (cardData) => {
    try {
      // Check if we have a student_id in the card data, which is required
      if (!cardData.student_id) {
        throw new Error('student_id is required to create a university card');
      }
      
      // Validate the student exists before creating the card
      const [existingStudent] = await pool.query(
        'SELECT * FROM students WHERE student_id = ?', 
        [cardData.student_id]
      );
      
      if (existingStudent.length === 0) {
        throw new Error(`Cannot create card: Student with ID ${cardData.student_id} does not exist`);
      }
      
      // Generate card number if not provided
      if (!cardData.card_number) {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let cardPrefix = '';
        for (let i = 0; i < 4; i++) {
          cardPrefix += letters.charAt(Math.floor(Math.random() * letters.length));
        }
        cardData.card_number = `${cardPrefix}${String(Math.floor(10000 + Math.random() * 90000))}`;
      }
      
      // Initialize sold value if not provided
      if (cardData.sold === undefined) {
        cardData.sold = 0;
      }
      
      // Initialize used value if not provided
      if (cardData.used === undefined) {
        cardData.used = 0;
      }
      
      // Record creation timestamp if not provided
      if (!cardData.created_at) {
        cardData.created_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
      }
      
      // Make sure created_by and updated_by are set if provided
      // Note: These should match user IDs from the users table
      
      // Prepare for insertion
      const columns = Object.keys(cardData).join(', ');
      const placeholders = Object.keys(cardData).map(() => '?').join(', ');
      const values = Object.values(cardData);
      
      console.log(`Creating university card with data:`, cardData);

      // Get a connection for transaction
      const connection = await pool.getConnection();
      await connection.beginTransaction();
      
      try {
        // Insert the university card
        const [result] = await connection.query(
          `INSERT INTO university_cards (${columns}) VALUES (${placeholders})`,
          values
        );
        
        const cardId = result.insertId;
        console.log(`Created university card with ID ${cardId}`);
        
        // Update the student record with the new card_id
        await connection.query(
          'UPDATE students SET card_id = ? WHERE student_id = ?',
          [cardId, cardData.student_id]
        );
        
        console.log(`Updated student ${cardData.student_id} with card_id ${cardId}`);
        
        // Log this activity if we have a created_by user ID
        if (cardData.created_by) {
          try {
            // Generate a UUID for the log ID
            const [uuidResult] = await connection.query('SELECT UUID() as uuid');
            const logId = uuidResult[0].uuid;
            
            // Log the activity
            await connection.query(
              `INSERT INTO user_activity_logs 
               (id, user_id, action, entity_type, entity_id, details) 
               VALUES (?, ?, ?, ?, ?, ?)`,
              [
                logId,
                cardData.created_by,
                'create',
                'university_card',
                cardId,
                JSON.stringify({
                  student_id: cardData.student_id,
                  card_number: cardData.card_number,
                  initial_balance: cardData.sold
                })
              ]
            );
            
            console.log(`Logged card creation activity for user ${cardData.created_by}`);
          } catch (logError) {
            // Just log the error but don't fail the transaction
            console.error('Failed to log card creation activity:', logError);
          }
        }
        
        // Commit the transaction
        await connection.commit();
        
        return { card_id: cardId, ...cardData };
      } catch (transactionError) {
        // Rollback on error
        await connection.rollback();
        console.error('Error in university card creation transaction:', transactionError);
        throw transactionError;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error creating university card:', error.message);
      throw error;
    }
  },

  // Update university card
  update: async (id, cardData) => {
    try {
      // Save the updated_by user ID for logging
      const updatedBy = cardData.updated_by;
      
      // Remove updated_at if it exists in cardData to prevent SQL errors
      if (cardData.updated_at) {
        delete cardData.updated_at;
      }
      
      const fields = Object.keys(cardData)
        .map(key => `${key} = ?`)
        .join(', ');
      const values = [...Object.values(cardData), id];
      
      // Get a connection for transaction
      const connection = await pool.getConnection();
      await connection.beginTransaction();
      
      try {
        // Update the university card
        const [result] = await connection.query(
          `UPDATE university_cards SET ${fields} WHERE card_id = ?`,
          values
        );
        
        // Log the activity if we have an updated_by user ID
        if (updatedBy) {
          await UserActivityLogger.log({
            user_id: updatedBy,
            action: 'update',
            entity_type: 'university_card',
            entity_id: id,
            details: {
              updated_fields: Object.keys(cardData).filter(key => key !== 'updated_by'),
              new_balance: cardData.sold,
            }
          });
        }
        
        // Commit the transaction
        await connection.commit();
        
        return result.affectedRows > 0;
      } catch (transactionError) {
        // Rollback on error
        await connection.rollback();
        console.error('Error in university card update transaction:', transactionError);
        throw transactionError;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error(`Error updating university card ${id}:`, error.message);
      throw error;
    }
  },
  
  // Mark card as used
  markAsUsed: async (id, userId) => {
    try {
      // Don't include updated_at field since it doesn't exist in the table
      const [result] = await pool.query(
        'UPDATE university_cards SET used = 1, updated_by = ? WHERE card_id = ?',
        [userId, id]
      );
      
      // Log the activity if successful and we have a user ID
      if (result.affectedRows > 0 && userId) {
        await UserActivityLogger.log({
          user_id: userId,
          action: 'mark_used',
          entity_type: 'university_card',
          entity_id: id,
          details: {
            marked_used_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
          }
        });
      }
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Error marking university card ${id} as used:`, error.message);
      throw error;
    }
  },

  // Delete university card
  delete: async (id, userId) => {
    try {
      // First, get the card details for logging
      const [cardDetails] = await pool.query('SELECT * FROM university_cards WHERE card_id = ?', [id]);
      
      if (cardDetails.length === 0) {
        return false; // Card not found
      }
      
      // Get a connection for transaction
      const connection = await pool.getConnection();
      await connection.beginTransaction();
      
      try {
        // Update the student record to remove the card_id reference
        await connection.query(
          'UPDATE students SET card_id = NULL WHERE card_id = ?',
          [id]
        );
        
        // Delete the university card
        const [result] = await connection.query('DELETE FROM university_cards WHERE card_id = ?', [id]);
        
        // Log the activity if successful and we have a user ID
        if (result.affectedRows > 0 && userId) {
          await UserActivityLogger.log({
            user_id: userId,
            action: 'delete',
            entity_type: 'university_card',
            entity_id: id,
            details: {
              student_id: cardDetails[0].student_id,
              card_number: cardDetails[0].card_number,
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
        console.error('Error in university card deletion transaction:', transactionError);
        throw transactionError;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error(`Error deleting university card ${id}:`, error.message);
      throw error;
    }
  }
};

module.exports = UniversityCardModel; 