const { pool } = require('../config/db');

/**
 * UserActivityLogger - Utility for logging user actions in the system
 * This helps track who did what and when for auditing purposes
 */
const UserActivityLogger = {
  /**
   * Log a user activity
   * @param {Object} logData - Data for the activity log
   * @param {string} logData.user_id - ID of the user performing the action
   * @param {string} logData.action - The action being performed (create, update, delete, etc.)
   * @param {string} logData.entity_type - Type of entity (student, university_card, etc.)
   * @param {string|number} logData.entity_id - ID of the entity being acted upon
   * @param {Object} [logData.details] - Additional details about the action
   * @param {string} [logData.ip_address] - IP address of the user (for security auditing)
   * @param {Object} [req] - Express request object (optional)
   * @returns {Promise<boolean>} - Success indicator
   */
  log: async (logData, req = null) => {
    try {
      // Check if no-log header is present in the request
      if (req && (req.headers['x-no-log'] === 'true' || req.skipLogging)) {
        console.log('Skipping activity logging due to X-No-Log header');
        return true;
      }
      
      // Check if details contains any message about revenue
      if (logData.details && 
          typeof logData.details === 'object' && 
          logData.details.message && 
          typeof logData.details.message === 'string' &&
          (logData.details.message.includes('revenue') || 
           logData.details.message.includes('Revenue'))) {
        console.log('Skipping activity logging for revenue-related view: ', logData.details.message);
        return true;
      }
      
      // Skip all view actions on university cards
      if (logData.entity_type === 'university_card' && 
          logData.action === 'view') {
        console.log('Skipping activity logging for university card view action');
        return true;
      }
      
      // Validate required fields
      if (!logData.user_id) {
        console.error('user_id is required for activity logging');
        return false;
      }
      
      if (!logData.action) {
        console.error('action is required for activity logging');
        return false;
      }
      
      if (!logData.entity_type) {
        console.error('entity_type is required for activity logging');
        return false;
      }
      
      // Generate a UUID for the log ID
      const [uuidResult] = await pool.query('SELECT UUID() as uuid');
      const logId = uuidResult[0].uuid;
      
      // Insert the activity log
      await pool.query(
        `INSERT INTO user_activity_logs 
         (id, user_id, action, entity_type, entity_id, details, ip_address) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          logId,
          logData.user_id,
          logData.action,
          logData.entity_type,
          logData.entity_id?.toString() || null,
          logData.details ? JSON.stringify(logData.details) : null,
          logData.ip_address || null
        ]
      );
      
      console.log(`Activity logged: ${logData.action} on ${logData.entity_type} ${logData.entity_id} by user ${logData.user_id}`);
      return true;
    } catch (error) {
      console.error('Error logging user activity:', error);
      return false;
    }
  },
  
  /**
   * Get activity logs for a specific user
   * @param {string} userId - ID of the user
   * @param {Object} [options] - Query options
   * @param {number} [options.limit=50] - Maximum number of logs to return
   * @param {number} [options.offset=0] - Offset for pagination
   * @returns {Promise<Array>} - Array of activity logs
   */
  getUserActivityLogs: async (userId, options = {}) => {
    try {
      const limit = options.limit || 50;
      const offset = options.offset || 0;
      
      const [rows] = await pool.query(
        `SELECT * FROM user_activity_logs 
         WHERE user_id = ? 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
        [userId, limit, offset]
      );
      
      return rows;
    } catch (error) {
      console.error(`Error getting activity logs for user ${userId}:`, error);
      throw error;
    }
  },
  
  /**
   * Get activity logs for a specific entity
   * @param {string} entityType - Type of entity
   * @param {string|number} entityId - ID of the entity
   * @param {Object} [options] - Query options
   * @param {number} [options.limit=50] - Maximum number of logs to return
   * @param {number} [options.offset=0] - Offset for pagination
   * @returns {Promise<Array>} - Array of activity logs
   */
  getEntityActivityLogs: async (entityType, entityId, options = {}) => {
    try {
      const limit = options.limit || 50;
      const offset = options.offset || 0;
      
      const [rows] = await pool.query(
        `SELECT l.*, u.name as user_name 
         FROM user_activity_logs l
         JOIN users u ON l.user_id = u.id
         WHERE l.entity_type = ? AND l.entity_id = ? 
         ORDER BY l.created_at DESC 
         LIMIT ? OFFSET ?`,
        [entityType, entityId.toString(), limit, offset]
      );
      
      return rows;
    } catch (error) {
      console.error(`Error getting activity logs for ${entityType} ${entityId}:`, error);
      throw error;
    }
  },
  
  /**
   * Get all activity logs for university cards with filtering options
   * @param {Object} [filters] - Filter options
   * @param {string} [filters.userId] - Filter by user ID
   * @param {string} [filters.startDate] - Filter by start date (YYYY-MM-DD)
   * @param {string} [filters.endDate] - Filter by end date (YYYY-MM-DD)
   * @param {string} [filters.action] - Filter by action type (add_funds, subtract_funds, etc.)
   * @param {Object} [options] - Query options
   * @param {number} [options.limit=100] - Maximum number of logs to return
   * @param {number} [options.offset=0] - Offset for pagination
   * @returns {Promise<Array>} - Array of activity logs
   */
  getUniversityCardLogs: async (filters = {}, options = {}) => {
    try {
      const limit = options.limit || 100;
      const offset = options.offset || 0;
      
      let query = `
        SELECT l.*, u.name as user_name, u.role as user_role, 
               uc.card_number, uc.student_id, s.full_name
        FROM user_activity_logs l
        JOIN users u ON l.user_id = u.id
        LEFT JOIN university_cards uc ON l.entity_id = uc.card_id AND l.entity_type = 'university_card'
        LEFT JOIN students s ON uc.student_id = s.student_id
        WHERE l.entity_type = 'university_card'
      `;
      
      const queryParams = [];
      
      // Add filters
      if (filters.userId) {
        query += ' AND l.user_id = ?';
        queryParams.push(filters.userId);
      }
      
      if (filters.startDate) {
        query += ' AND l.created_at >= ?';
        queryParams.push(`${filters.startDate} 00:00:00`);
      }
      
      if (filters.endDate) {
        query += ' AND l.created_at <= ?';
        queryParams.push(`${filters.endDate} 23:59:59`);
      }
      
      if (filters.action) {
        query += ' AND l.action = ?';
        queryParams.push(filters.action);
      }
      
      // Add order by and limit
      query += ' ORDER BY l.created_at DESC LIMIT ? OFFSET ?';
      queryParams.push(limit, offset);
      
      console.log('Executing query:', query, 'with params:', queryParams);
      
      const [rows] = await pool.query(query, queryParams);
      console.log(`Found ${rows.length} activity logs`);
      
      // Process the results to format the details JSON
      const formattedRows = rows.map(row => {
        try {
          if (row.details && typeof row.details === 'string') {
            try {
              row.details = JSON.parse(row.details);
              console.log('Successfully parsed details for log:', row.id);
            } catch (e) {
              console.error('Error parsing details JSON for log:', row.id, e);
              // Keep as string if parsing fails
            }
          }
        } catch (e) {
          console.error('Error processing row:', e, row);
        }
        return row;
      });
      
      return formattedRows;
    } catch (error) {
      console.error('Error getting university card activity logs:', error);
      throw error;
    }
  }
};

module.exports = UserActivityLogger; 