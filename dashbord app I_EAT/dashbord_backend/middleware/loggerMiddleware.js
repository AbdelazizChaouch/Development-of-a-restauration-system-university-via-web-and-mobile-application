/**
 * Middleware to handle logging preferences
 * Checks for X-No-Log header and sets a flag on the request object
 * to skip activity logging for this request
 */
const loggerMiddleware = (req, res, next) => {
  // Check if X-No-Log header is present
  if (req.headers['x-no-log'] === 'true') {
    // Set a flag on the request object
    req.skipLogging = true;
    console.log(`No-log flag set for request: ${req.method} ${req.originalUrl}`);
  }
  
  next();
};

module.exports = loggerMiddleware; 