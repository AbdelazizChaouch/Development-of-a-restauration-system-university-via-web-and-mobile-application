const express = require('express');
const router = express.Router();
const UserModel = require('../models/user.model');
const FoodModel = require('../models/food.model');
const MenuModel = require('../models/menu.model');
const StudentModel = require('../models/student.model');
const OrderModel = require('../models/order.model');
const TicketModel = require('../models/ticket.model');
const BreakfastModel = require('../models/breakfast.model');
const LunchModel = require('../models/lunch.model');
const DinnerModel = require('../models/dinner.model');
const UniversityModel = require('../models/university.model');
const UniversityCardModel = require('../models/university-card.model');
const { pool } = require('../config/db');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Import controllers
const UniversityCardController = require('../controllers/university-card.controller');
const TicketController = require('../controllers/ticket.controller');
const StudentController = require('../controllers/student.controller');
const ReclamationController = require('../controllers/reclamation.controller');

// Sample route for testing
router.get('/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Database connection test
router.get('/dbtest', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 as result');
    res.json({ 
      message: 'Database connection successful!',
      result: rows[0].result
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// ===== USER ROUTES =====
router.get('/users', async (req, res) => {
  try {
    const users = await UserModel.findAll();
    res.json({ users });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error retrieving users',
      error: error.message
    });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({
      message: 'Error retrieving user',
      error: error.message
    });
  }
});

router.get('/users/:id/permissions', async (req, res) => {
  try {
    const user = await UserModel.findWithPermissions(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({
      message: 'Error retrieving user permissions',
      error: error.message
    });
  }
});

router.post('/users', async (req, res) => {
  try {
    const newUser = await UserModel.create(req.body);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({
      message: 'Error creating user',
      error: error.message
    });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const updated = await UserModel.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ message: 'User not found or no changes made' });
    }
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({
      message: 'Error updating user',
      error: error.message
    });
  }
});

router.post('/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email, hasPassword: !!password });
    
    if (!email || !password) {
      console.log('Login failed: Email and password are required');
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    const user = await UserModel.authenticate(email, password);
    console.log('Authentication result:', user ? { id: user.id, name: user.name, role: user.role } : 'Failed');
    
    if (!user) {
      console.log('Login failed: Invalid credentials');
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Log the login activity, passing the request object
    await UserModel.logActivity(user.id, 'login', null, null, null, req.ip, req);
    console.log('Login successful for user:', { id: user.id, name: user.name, role: user.role });
    
    res.json({ user });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({
      message: 'Error during login',
      error: error.message
    });
  }
});

// ===== FOOD ROUTES =====
router.get('/food', async (req, res) => {
  try {
    const food = await FoodModel.findAll();
    res.json({ food });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error retrieving food items',
      error: error.message
    });
  }
});

router.get('/food/:id', async (req, res) => {
  try {
    const food = await FoodModel.findById(req.params.id);
    if (!food) {
      return res.status(404).json({ message: 'Food item not found' });
    }
    res.json(food);
  } catch (error) {
    res.status(500).json({
      message: 'Error retrieving food item',
      error: error.message
    });
  }
});

router.post('/food', async (req, res) => {
  try {
    const newFood = await FoodModel.create(req.body);
    res.status(201).json(newFood);
  } catch (error) {
    res.status(500).json({
      message: 'Error creating food item',
      error: error.message
    });
  }
});

// ===== BREAKFAST ROUTES =====
router.get('/breakfast', async (req, res) => {
  try {
    const breakfast = await BreakfastModel.findAll();
    res.json({ breakfast });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error retrieving breakfast items',
      error: error.message
    });
  }
});

router.get('/breakfast/:id', async (req, res) => {
  try {
    const breakfast = await BreakfastModel.findById(req.params.id);
    if (!breakfast) {
      return res.status(404).json({ message: 'Breakfast item not found' });
    }
    res.json(breakfast);
  } catch (error) {
    res.status(500).json({
      message: 'Error retrieving breakfast item',
      error: error.message
    });
  }
});

router.post('/breakfast', async (req, res) => {
  try {
    const newBreakfast = await BreakfastModel.create(req.body);
    res.status(201).json(newBreakfast);
  } catch (error) {
    res.status(500).json({
      message: 'Error creating breakfast item',
      error: error.message
    });
  }
});

// ===== LUNCH ROUTES =====
router.get('/lunch', async (req, res) => {
  try {
    const lunch = await LunchModel.findAll();
    res.json({ lunch });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error retrieving lunch items',
      error: error.message
    });
  }
});

router.get('/lunch/:id', async (req, res) => {
  try {
    const lunch = await LunchModel.findById(req.params.id);
    if (!lunch) {
      return res.status(404).json({ message: 'Lunch item not found' });
    }
    res.json(lunch);
  } catch (error) {
    res.status(500).json({
      message: 'Error retrieving lunch item',
      error: error.message
    });
  }
});

router.post('/lunch', async (req, res) => {
  try {
    const newLunch = await LunchModel.create(req.body);
    res.status(201).json(newLunch);
  } catch (error) {
    res.status(500).json({
      message: 'Error creating lunch item',
      error: error.message
    });
  }
});

// ===== DINNER ROUTES =====
router.get('/dinner', async (req, res) => {
  try {
    const dinner = await DinnerModel.findAll();
    res.json({ dinner });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error retrieving dinner items',
      error: error.message
    });
  }
});

router.get('/dinner/:id', async (req, res) => {
  try {
    const dinner = await DinnerModel.findById(req.params.id);
    if (!dinner) {
      return res.status(404).json({ message: 'Dinner item not found' });
    }
    res.json(dinner);
  } catch (error) {
    res.status(500).json({
      message: 'Error retrieving dinner item',
      error: error.message
    });
  }
});

router.post('/dinner', async (req, res) => {
  try {
    const newDinner = await DinnerModel.create(req.body);
    res.status(201).json(newDinner);
  } catch (error) {
    res.status(500).json({
      message: 'Error creating dinner item',
      error: error.message
    });
  }
});

// ===== MENU ROUTES =====
router.get('/menu', async (req, res) => {
  try {
    const menu = await MenuModel.findAll();
    res.json({ menu });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error retrieving menu',
      error: error.message
    });
  }
});

router.get('/menu/complete', async (req, res) => {
  try {
    const menu = await MenuModel.getCompleteMenu();
    res.json({ menu });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error retrieving complete menu',
      error: error.message
    });
  }
});

router.get('/menu/:id', async (req, res) => {
  try {
    const menu = await MenuModel.findById(req.params.id);
    if (!menu) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.json(menu);
  } catch (error) {
    res.status(500).json({
      message: 'Error retrieving menu item',
      error: error.message
    });
  }
});

router.post('/menu', async (req, res) => {
  try {
    const newMenu = await MenuModel.create(req.body);
    res.status(201).json(newMenu);
  } catch (error) {
    res.status(500).json({
      message: 'Error creating menu item',
      error: error.message
    });
  }
});

// ===== UNIVERSITY ROUTES =====
router.get('/university', async (req, res) => {
  try {
    const universities = await UniversityModel.findAll();
    res.json({ universities });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error retrieving universities',
      error: error.message
    });
  }
});

router.get('/university/:id', async (req, res) => {
  try {
    const university = await UniversityModel.findById(req.params.id);
    if (!university) {
      return res.status(404).json({ message: 'University not found' });
    }
    res.json(university);
  } catch (error) {
    res.status(500).json({
      message: 'Error retrieving university',
      error: error.message
    });
  }
});

router.get('/university/:id/students', async (req, res) => {
  try {
    const university = await UniversityModel.findWithStudents(req.params.id);
    if (!university) {
      return res.status(404).json({ message: 'University not found' });
    }
    res.json(university);
  } catch (error) {
    res.status(500).json({
      message: 'Error retrieving university students',
      error: error.message
    });
  }
});

router.post('/university', async (req, res) => {
  try {
    const newUniversity = await UniversityModel.create(req.body);
    res.status(201).json(newUniversity);
  } catch (error) {
    res.status(500).json({
      message: 'Error creating university',
      error: error.message
    });
  }
});

// ===== UNIVERSITY CARD ROUTES =====
router.get('/cards', authenticate, UniversityCardController.getAll);
router.get('/cards/count/active', authenticate, UniversityCardController.getActiveCardsCount);
router.get('/cards/revenue/total', authenticate, UniversityCardController.getTotalRevenue);
router.get('/cards/revenue/daily', authenticate, UniversityCardController.getDailyRevenue);
router.get('/cards/revenue/trend', authenticate, UniversityCardController.getDailyRevenueTrend);

// Route for getting cards with student details - must be before the :id route
router.get('/cards/details', authenticate, async (req, res) => {
  try {
    console.log('Cards details route hit:', {
      user: req.user,
      headers: req.headers
    });
    
    // Use the controller method to get cards with student details
    await UniversityCardController.getAllWithStudentDetails(req, res);
  } catch (error) {
    console.error('Error in cards/details route:', error);
    res.status(500).json({ 
      message: 'Error retrieving university cards with student details',
      error: error.message
    });
  }
});

router.get('/cards/:id', async (req, res) => {
  try {
    const card = await UniversityCardModel.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ message: 'University card not found' });
    }
    res.json(card);
  } catch (error) {
    res.status(500).json({
      message: 'Error retrieving university card',
      error: error.message
    });
  }
});

router.get('/cards/:id/details', async (req, res) => {
  try {
    const card = await UniversityCardModel.findWithStudentDetails(req.params.id);
    if (!card) {
      return res.status(404).json({ message: 'University card not found' });
    }
    res.json(card);
  } catch (error) {
    res.status(500).json({
      message: 'Error retrieving university card details',
      error: error.message
    });
  }
});

router.post('/cards', async (req, res) => {
  try {
    const newCard = await UniversityCardModel.create(req.body);
    res.status(201).json(newCard);
  } catch (error) {
    res.status(500).json({
      message: 'Error creating university card',
      error: error.message
    });
  }
});

router.put('/cards/:id/used', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    const updated = await UniversityCardModel.markAsUsed(req.params.id, userId);
    if (!updated) {
      return res.status(404).json({ message: 'University card not found' });
    }
    res.json({ message: 'University card marked as used' });
  } catch (error) {
    res.status(500).json({
      message: 'Error marking university card as used',
      error: error.message
    });
  }
});

// ===== STUDENT ROUTES =====
router.get('/students', authenticate, authorize(['admin', 'staff', 'viewer']), async (req, res) => {
  try {
    const students = await StudentModel.findAll();
    res.json(students);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error retrieving students',
      error: error.message
    });
  }
});

// Get total count of students - must be before :id routes
router.get('/students/count', authenticate, authorize(['admin', 'staff', 'viewer']), async (req, res) => {
  try {
    const count = await StudentModel.getTotalCount();
    res.json({ total: count });
  } catch (error) {
    res.status(500).json({
      message: 'Error getting student count',
      error: error.message
    });
  }
});

router.get('/students/:id', authenticate, authorize(['admin', 'staff', 'viewer']), async (req, res) => {
  try {
    const student = await StudentModel.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: 'Student not found' 
      });
    }
    res.json({ 
      success: true,
      data: student 
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving student',
      error: error.message
    });
  }
});

router.get('/students/:id/university', authenticate, authorize(['admin', 'staff', 'viewer']), async (req, res) => {
  try {
    const student = await StudentModel.findWithUniversity(req.params.id);
    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: 'Student not found' 
      });
    }
    res.json({ 
      success: true,
      data: student 
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving student with university',
      error: error.message
    });
  }
});

router.get('/students/:id/tickets', authenticate, authorize(['admin', 'staff', 'viewer']), async (req, res) => {
  try {
    const student = await StudentModel.findWithTickets(req.params.id);
    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: 'Student not found' 
      });
    }
    res.json({ 
      success: true,
      data: student 
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving student tickets',
      error: error.message
    });
  }
});

router.post('/students', authenticate, authorize(['admin', 'staff']), async (req, res) => {
  try {
    // Add the authenticated user ID as created_by if available
    if (req.user && req.user.id) {
      // Only set created_by if not already present (allows frontend testing)
      if (!req.body.created_by) {
        req.body.created_by = req.user.id;
      }
    }
    
    const newStudent = await StudentModel.create(req.body);
    res.status(201).json({ 
      success: true,
      message: 'Student created successfully',
      data: newStudent 
    });
  } catch (error) {
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
      message: 'Error creating student',
      error: error.message
    });
  }
});

// Add PUT route for updating students
router.put('/students/:id', authenticate, authorize(['admin', 'staff']), async (req, res) => {
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
    
    // Get the updated student to return in the response
    const updatedStudent = await StudentModel.findById(id);
    
    res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: updatedStudent
    });
  } catch (error) {
    console.error(`Error updating student ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to update student',
      error: error.message
    });
  }
});

// ===== ORDER ROUTES =====
router.get('/orders', async (req, res) => {
  try {
    const orders = await OrderModel.findAll();
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error retrieving orders',
      error: error.message
    });
  }
});

router.get('/orders/recent', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const orders = await OrderModel.getRecent(limit);
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error retrieving recent orders',
      error: error.message
    });
  }
});

router.get('/orders/stats', async (req, res) => {
  try {
    const stats = await OrderModel.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({
      message: 'Error retrieving order statistics',
      error: error.message
    });
  }
});

router.get('/orders/:id', async (req, res) => {
  try {
    const order = await OrderModel.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({
      message: 'Error retrieving order',
      error: error.message
    });
  }
});

router.get('/orders/:id/details', async (req, res) => {
  try {
    const order = await OrderModel.findWithDetails(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({
      message: 'Error retrieving order details',
      error: error.message
    });
  }
});

router.post('/orders', async (req, res) => {
  try {
    const newOrder = await OrderModel.create(req.body);
    res.status(201).json(newOrder);
  } catch (error) {
    res.status(500).json({
      message: 'Error creating order',
      error: error.message
    });
  }
});

// ===== TICKET ROUTES =====
router.get('/tickets', authenticate, TicketController.getAllTickets);
router.get('/tickets/unused', authenticate, TicketController.getUnusedTickets);
router.get('/tickets/total', authenticate, TicketController.getTotalTickets);
router.get('/tickets/today', authenticate, TicketController.getTodayOrders);
router.get('/tickets/:id', authenticate, TicketController.getTicketById);
router.get('/tickets/:id/history', authenticate, TicketController.getTicketWithHistory);
router.post('/tickets', authenticate, authorize(['admin', 'manager']), TicketController.createTicket);
router.put('/tickets/:id/use', authenticate, authorize(['admin', 'manager', 'staff']), TicketController.markTicketAsUsed);
router.put('/tickets/:id', authenticate, authorize(['admin', 'manager']), TicketController.updateTicket);
router.delete('/tickets/:id', authenticate, authorize(['admin']), TicketController.deleteTicket);

// ===== DASHBOARD ROUTES =====
router.get('/dashboard', async (req, res) => {
  try {
    // Get various statistics for the dashboard
    const [userCount] = await pool.query('SELECT COUNT(*) as count FROM users');
    const [studentCount] = await pool.query('SELECT COUNT(*) as count FROM students');
    const [orderCount] = await pool.query('SELECT COUNT(*) as count FROM orders');
    const [ticketCount] = await pool.query('SELECT COUNT(*) as count FROM tickets WHERE used = 0');
    const [universityCount] = await pool.query('SELECT COUNT(*) as count FROM university');
    const [cardCount] = await pool.query('SELECT COUNT(*) as count FROM university_cards');
    
    // Get recent orders
    const [recentOrders] = await pool.query(`
      SELECT o.*, s.full_name as student_name
      FROM orders o
      JOIN students s ON o.student_id = s.student_id
      ORDER BY o.created_at DESC
      LIMIT 5
    `);
    
    // Get recent user activity
    const [recentActivity] = await pool.query(`
      SELECT l.*, u.name as user_name
      FROM user_activity_logs l
      JOIN users u ON l.user_id = u.id
      ORDER BY l.created_at DESC
      LIMIT 10
    `);
    
    // Get ticket usage
    const [ticketUsage] = await pool.query(`
      SELECT 
        SUM(CASE WHEN used = 1 THEN 1 ELSE 0 END) as used_tickets,
        SUM(CASE WHEN used = 0 THEN 1 ELSE 0 END) as unused_tickets
      FROM tickets
    `);
    
    res.json({
      stats: {
        totalUsers: userCount[0].count,
        totalStudents: studentCount[0].count,
        totalOrders: orderCount[0].count,
        activeTickets: ticketCount[0].count,
        universities: universityCount[0].count,
        universityCards: cardCount[0].count,
        ticketUsage: {
          used: ticketUsage[0].used_tickets || 0,
          unused: ticketUsage[0].unused_tickets || 0
        }
      },
      recentOrders,
      recentActivity
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error retrieving dashboard data',
      error: error.message
    });
  }
});

// University Card routes
router.get('/university-cards', authenticate, UniversityCardController.getAll);
router.get('/university-cards/:id', authenticate, UniversityCardController.getById);
router.get('/university-cards/student/:studentId', authenticate, UniversityCardController.getByStudentId);
router.post('/university-cards', authenticate, authorize(['admin']), UniversityCardController.create);
router.put('/university-cards/:id', authenticate, authorize(['admin']), UniversityCardController.update);
router.put('/university-cards/:id/used', authenticate, authorize(['admin']), UniversityCardController.markAsUsed);
router.delete('/university-cards/:id', authenticate, authorize(['admin']), UniversityCardController.delete);
router.get('/university-cards/:id/logs', authenticate, UniversityCardController.getActivityLogs);
router.get('/university-card-logs', authenticate, async (req, res) => {
  console.log('University card logs route hit:', {
    query: req.query,
    user: req.user,
    headers: req.headers
  });
  
  try {
    await UniversityCardController.getAllActivityLogs(req, res);
  } catch (error) {
    console.error('Error in university-card-logs route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve activity logs',
      error: error.message
    });
  }
});

// Route for updating card balance - authentication handled inside controller for fine-grained control
router.put('/university-cards/:id/balance', authenticate, UniversityCardController.updateBalance);

// Test route for authentication
router.get('/auth-test', authenticate, (req, res) => {
  console.log('Auth test route hit:', {
    user: req.user,
    headers: req.headers
  });
  
  res.json({
    success: true,
    message: 'Authentication successful',
    user: {
      id: req.user.id,
      name: req.user.name,
      role: req.user.role
    }
  });
});

// ===== RECLAMATION ROUTES =====
router.get('/reclamations', authenticate, authorize(['admin', 'staff']), ReclamationController.getAll);
router.get('/reclamations/counts', authenticate, authorize(['admin']), ReclamationController.getCounts);
router.get('/reclamations/:id', authenticate, authorize(['admin', 'staff']), ReclamationController.getById);
router.post('/reclamations', authenticate, authorize(['staff']), ReclamationController.create);
router.put('/reclamations/:id/process', authenticate, authorize(['admin']), ReclamationController.process);

module.exports = router; 