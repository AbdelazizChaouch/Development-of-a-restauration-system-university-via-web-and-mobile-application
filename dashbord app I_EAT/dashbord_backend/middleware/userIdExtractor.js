const { pool } = require('../config/db');

/**
 * Middleware to extract user ID and role from request headers
 * and verify against MySQL database
 */
const userIdExtractor = async (req, res, next) => {
  try {
    // Extract user ID and role from headers
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];
    
    console.log('Extracted user info from headers:', { 
      userId, 
      userRole, 
      path: req.path,
      method: req.method
    });
    
    if (!userId) {
      console.log('No user ID found in headers');
      return next();
    }

    try {
      // Verify user exists in database
      const [users] = await pool.query(
        'SELECT id, name, email, role FROM users WHERE id = ?',
        [userId]
      );
      
      if (users.length > 0) {
        // User found in database
        const dbUser = users[0];
        req.user = {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          role: dbUser.role
        };
        console.log('User found in database:', req.user);
      } else {
        // If using mock data, create a minimal user object
        if (process.env.USE_MOCK_DATA === 'true') {
          req.user = {
            id: userId,
            role: userRole || 'viewer'
          };
          console.log('Using mock user data:', req.user);
        } else {
          console.log('User not found in database:', userId);
        }
      }
    } catch (dbError) {
      console.error('Database error in userIdExtractor:', dbError);
      // On database error, still allow the request with header data
      req.user = {
        id: userId,
        role: userRole || 'viewer'
      };
    }
    
    next();
  } catch (error) {
    console.error('Error in userIdExtractor:', error);
    next(error);
  }
};

module.exports = userIdExtractor; 