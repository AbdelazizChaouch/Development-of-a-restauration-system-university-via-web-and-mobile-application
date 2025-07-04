const { pool } = require('../config/db');

/**
 * Authentication middleware
 * Verifies user authentication and adds user data to request
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];
    
    // For simplicity in this example, we'll use a user ID directly from headers
    // In a real app, you would verify a JWT token here
    const userId = req.headers['x-user-id'] || token;
    const userRole = req.headers['x-user-role'];
    
    console.log('Auth middleware received:', { 
      userId, 
      userRole, 
      headers: req.headers,
      path: req.path,
      method: req.method
    });
    
    if (!userId) {
      console.log('Authentication failed - no user ID provided');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Try to get user from database
    try {
      console.log('Looking up user in database:', userId);
      const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
      
      if (users.length > 0) {
        // User found in database
        req.user = users[0];
        console.log('User found in database:', { 
          id: req.user.id, 
          name: req.user.name, 
          role: req.user.role 
        });
      } else {
        console.log('User not found in database, checking if it matches a known user ID');
        
        // Check if the user ID matches one of our known users
        const [allUsers] = await pool.query('SELECT id FROM users');
        console.log('Available user IDs:', allUsers.map(u => u.id));
        
        // User not found in database, but we have an ID from headers
        // Create a minimal user object with the ID and role from headers
        req.user = {
          id: userId,
          role: userRole || 'staff' // Default to staff if role not provided
        };
        console.log('User not found in database, using header data:', req.user);
      }
    } catch (dbError) {
      console.error('Database error in auth middleware:', dbError);
      // If database query fails, still allow the request with the header data
      req.user = {
        id: userId,
        role: userRole || 'staff' // Default to staff if role not provided
      };
      console.log('Database error, using header data:', req.user);
    }
    
    // Ensure user object is properly set
    if (!req.user || !req.user.id) {
      console.error('Failed to set user object properly:', req.user);
      return res.status(401).json({
        success: false,
        message: 'Authentication failed - user object not properly set'
      });
    }
    
    console.log('Authentication successful, proceeding with request');
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
};

/**
 * Role-based authorization middleware
 * @param {string[]} roles - Array of allowed roles
 * @returns {Function} Middleware function
 */
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    console.log('Authorize middleware checking roles:', { 
      userRole: req.user.role, 
      requiredRoles: roles 
    });
    
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action'
      });
    }
    
    next();
  };
};

module.exports = {
  authenticate,
  authorize
}; 