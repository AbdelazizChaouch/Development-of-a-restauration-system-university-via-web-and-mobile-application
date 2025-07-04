const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const { testConnection } = require('./config/db');
const userIdExtractor = require('./middleware/userIdExtractor');
const loggerMiddleware = require('./middleware/loggerMiddleware');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(helmet()); // Security headers
app.use(morgan('dev')); // Logging
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// Add user ID extractor middleware
app.use(userIdExtractor);

// Add logger middleware to handle X-No-Log header
app.use(loggerMiddleware);

// Routes setup
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Dashboard Backend API' });
});

// API routes will be added here
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  
  // Test database connection
  await testConnection();
});

// Connect to MongoDB (commented out as we're using MySQL now)
/* 
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('MongoDB connection error:', err));
*/

module.exports = app;

