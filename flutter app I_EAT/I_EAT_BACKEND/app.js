const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Add request logging middleware at the top, after CORS
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  next();
});

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: err.message
  });
});

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  maxAge: 86400 // 24 hours
}));

// Increase size limits for JSON and URL-encoded data
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from the 'images' directory
app.use('/images', express.static(path.join(__dirname, 'images')));

// Create images directory if it doesn't exist
const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
  console.log('Created images directory at:', imagesDir);
}

// Database configuration
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "123456",
  database: "i_eat_database", // Ensure this matches the actual DB name
  port: 3306,
};

// Create a MySQL pool
const pool = mysql.createPool(dbConfig);

// Promisify MySQL queries
const query = (sql, params = []) =>
  new Promise((resolve, reject) => {
    pool.query(sql, params, (err, results) => {
      if (err) {
        console.error("Database error:", err);
        reject(err);
      } else {
        resolve(results);
      }
    });
  });

// GET university card by student_id
app.get("/university_cards/:student_id", async (req, res) => {
  const studentId = req.params.student_id;
  console.log(
    `Received request for university card of student_id: ${studentId}`
  );

  try {
    const queryString = `
      SELECT u.card_id, u.student_id, u.sold, u.history, u.used, u.card_number_sold, u.card_number 
      FROM university_cards u 
      WHERE u.card_id = (SELECT s.card_id FROM students s WHERE s.student_id = ?)
    `;

    const results = await query(queryString, [studentId]);

    if (results.length > 0) {
      const universityCard = results[0];
      console.log("University card found:", universityCard);

      // Include all relevant fields in the response
      res.json({
        card_id: universityCard.card_id,
        sold: universityCard.sold,
        history: universityCard.history, // Add history field
        used: universityCard.used,
        cardNumberSold: universityCard.card_number_sold,
        cardNumber: universityCard.card_number,
      });
    } else {
      console.warn(`No university card found for student_id: ${studentId}`);
      res.status(404).json({ message: "No university card found" });
    }
  } catch (err) {
    console.error("Error fetching university card:", err);
    res.status(500).json({ message: "Internal server error", error: err });
  }
});

// Fetch student by student_id
app.get("/student/:student_id", async (req, res) => {
  const studentId = req.params.student_id;
  console.log(`Received request for student_id: ${studentId}`);

  try {
    // Modified query to join with university table to get university description
    const queryString = `
      SELECT s.student_id, s.cn, s.full_name, s.profile_img, s.card_id, 
             s.university_id, s.code_qr, u.university_description
      FROM students s
      LEFT JOIN university u ON s.university_id = u.university_id
      WHERE s.student_id = ?
    `;
    
    const results = await query(queryString, [studentId]);

    if (results.length > 0) {
      const student = results[0];
      console.log("Student found:", student);

      res.json({
        student_id: student.student_id,
        cn: student.cn,
        full_name: student.full_name,
        profile_img: student.profile_img,
        card_id: student.card_id,
        university_id: student.university_id,
        university_description: student.university_description || 'Unknown',
        qr_code: student.code_qr
      });
    } else {
      console.warn(`No student found for student_id: ${studentId}`);
      res.status(404).json({ message: "Student not found" });
    }
  } catch (err) {
    console.error("Error retrieving student:", err);
    res.status(500).json({ message: "Internal server error", error: err });
  }
});

// Get Breakfast by ID
app.get("/breakfast/:id", async (req, res) => {
  const breakfastId = req.params.id;
  console.log(`Received request for breakfast ID: ${breakfastId}`);

  try {
    const queryString = `
      SELECT id, name, description, menu_id, price, ticket_id
      FROM breakfast
      WHERE id = ?;
    `;

    const results = await query(queryString, [breakfastId]);

    if (results.length > 0) {
      const breakfast = results[0];
      console.log("Breakfast found:", breakfast);

      res.json({
        id: breakfast.id,
        name: breakfast.name,
        description: breakfast.description,
        menu_id: breakfast.menu_id,
        price: breakfast.price,
        ticket_id: breakfast.ticket_id,
      });
    } else {
      console.warn(`No breakfast found for ID: ${breakfastId}`);
      res.status(404).json({ message: "Breakfast not found" });
    }
  } catch (err) {
    console.error("Error fetching breakfast:", err);
    res.status(500).json({ message: "Internal server error", error: err });
  }
});
// Get Lunch by ID
app.get("/lunch/:id", async (req, res) => {
  const lunchId = req.params.id;
  console.log(`Received request for lunch ID: ${lunchId}`);

  try {
    const queryString = `SELECT * FROM lunch WHERE id = ?;`;
    const results = await query(queryString, [lunchId]);

    console.log("Query results:", results); // Debugging

    if (results.length > 0) {
      res.json(results[0]); // Send first result
    } else {
      console.warn(`No lunch found for ID: ${lunchId}`);
      res.status(404).json({ message: "Lunch not found" });
    }
  } catch (err) {
    console.error("Error fetching lunch:", err);
    res.status(500).json({ message: "Internal server error", error: err });
  }
});
// Get Dinner by ID
app.get("/dinner/:id", async (req, res) => {
  const dinnerId = req.params.id;
  console.log(`Received request for dinner ID: ${dinnerId}`);

  try {
    const queryString = `SELECT * FROM dinner WHERE id = ?;`;
    const results = await query(queryString, [dinnerId]);

    console.log("Query results:", results); // Debugging

    if (results.length > 0) {
      res.json(results[0]); // Send first result
    } else {
      console.warn(`No dinner found for ID: ${dinnerId}`);
      res.status(404).json({ message: "Dinner not found" });
    }
  } catch (err) {
    console.error("Error fetching dinner:", err);
    res.status(500).json({ message: "Internal server error", error: err });
  }
});

// Get tickets by student_id
app.get("/tickets/student/:student_id", async (req, res) => {
  const studentId = req.params.student_id;

  try {
    // Get all tickets for the student directly
    const ticketQuery = `
      SELECT * FROM tickets 
      WHERE student_id = ? 
      ORDER BY issue_date DESC
    `;
    
    const tickets = await query(ticketQuery, [studentId]);

    if (tickets.length > 0) {
      res.json(tickets);
    } else {
      res.json([]); // Return empty array if no tickets found
    }
  } catch (err) {
    console.error("Error fetching tickets by student_id:", err);
    res.status(500).json({ message: "Internal server error", error: err });
  }
});

// Mark ticket as used
app.put("/tickets/:ticketId/use", async (req, res) => {
  const ticketId = req.params.ticketId;
  console.log(`Marking ticket ${ticketId} as used`);

  try {
    // First check if ticket exists and is not already used
    const checkQuery = "SELECT used FROM tickets WHERE ticket_id = ?";
    const checkResult = await query(checkQuery, [ticketId]);

    if (checkResult.length === 0) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (checkResult[0].used === 1) {
      return res.status(400).json({ message: "Ticket is already used" });
    }

    // Update ticket to mark as used
    const updateQuery = "UPDATE tickets SET used = 1 WHERE ticket_id = ?";
    await query(updateQuery, [ticketId]);

    console.log(`Successfully marked ticket ${ticketId} as used`);
    res.json({ message: "Ticket marked as used successfully" });
  } catch (err) {
    console.error("Error marking ticket as used:", err);
    res.status(500).json({ message: "Failed to mark ticket as used", error: err.message });
  }
});

// 🔵 Route to Update Sold Amount (Deduct Price)
app.put('/university_cards/:studentId', async (req, res) => {
  const { studentId } = req.params;
  const { sold } = req.body;

  if (sold === undefined || isNaN(sold)) {
    return res.status(400).json({ error: 'Invalid sold value' });
  }

  try {
    const updateQuery = 'UPDATE university_cards SET sold = ? WHERE student_id = ?';
    await query(updateQuery, [sold, studentId]); // 🔴 Fixed to use `query`
    res.json({ message: 'Sold amount updated successfully' });
  } catch (err) {
    console.error('Error updating sold amount:', err);
    res.status(500).json({ error: 'Database update failed' });
  }
});

// Create a new ticket
app.post("/tickets", async (req, res) => {
  try {
    console.log("\n=== Ticket Creation Request ===");
    console.log("Headers:", JSON.stringify(req.headers, null, 2));
    console.log("Raw Body:", req.body);
    
    const { order_type, price, student_id, issue_date } = req.body;
    console.log("Parsed values:", {
      order_type: order_type,
      price: price,
      student_id: student_id,
      issue_date: issue_date
    });
    
    // Validate required fields
    if (!order_type || price === undefined || student_id === undefined) {
      return res.status(400).json({ 
        message: "Missing required fields", 
        required: ["order_type", "price", "student_id"]
      });
    }

    // First check if student exists
    const studentQuery = "SELECT student_id FROM students WHERE student_id = ?";
    const studentResult = await query(studentQuery, [student_id]);
    
    if (studentResult.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Use provided date or current date
    let ticketDate;
    let formattedDate;
    
    if (issue_date) {
      // Use the date sent from the frontend
      ticketDate = new Date(issue_date);
      // If date is invalid, use current date
      if (isNaN(ticketDate.getTime())) {
        console.log(`Invalid date received: ${issue_date}, using current date instead`);
        ticketDate = new Date();
      }
    } else {
      // No date provided, use current date
      ticketDate = new Date();
    }

    // Format as YYYY-MM-DD HH:MM:SS for MySQL
    formattedDate = ticketDate.toISOString().slice(0, 19).replace('T', ' ');
    console.log(`Using ticket date: ${formattedDate}`);
    
    // Get just the date part for duplicate checking
    const today = ticketDate.toISOString().split('T')[0];

    // Check if student already has a ticket of this type for today
    const duplicateCheckQuery = `
      SELECT ticket_id 
      FROM tickets 
      WHERE student_id = ? 
      AND order_type = ? 
      AND DATE(issue_date) = ?
    `;
    
    const duplicateResult = await query(duplicateCheckQuery, [student_id, order_type, today]);
    
    if (duplicateResult.length > 0) {
      return res.status(400).json({ 
        message: `You already have a ${order_type} ticket for today`,
        ticket_id: duplicateResult[0].ticket_id
      });
    }

    // Generate QR code data
    const qrData = JSON.stringify({
      student_id,
      order_type,
      date: today,
      datetime: formattedDate,
      timestamp: ticketDate.getTime(),
      random: Math.random().toString(36).substring(7) // Add some randomness
    });

    // If no duplicate, proceed with ticket creation
    const insertQuery = `
      INSERT INTO tickets 
      (order_id, order_type, price, student_id, issue_date, used, qr_data) 
      VALUES (NULL, ?, ?, ?, ?, 0, ?)
    `;
    
    const result = await query(insertQuery, [
      order_type,
      price,
      student_id,
      formattedDate,
      qrData
    ]);

    console.log("Insert result:", result);
    
    // Return the created ticket data
    const createdTicket = {
      ticket_id: result.insertId,
      order_id: null,
      order_type,
      price,
      student_id,
      issue_date: formattedDate,
      used: 0,
      qr_data: qrData
    };

    console.log("Sending response:", createdTicket);
    res.status(201).json(createdTicket);
  } catch (err) {
    console.error("\n=== Ticket Creation Error ===");
    console.error("Error details:", err);
    console.error("SQL Message:", err.sqlMessage);
    res.status(500).json({ 
      message: "Failed to create ticket", 
      error: err.message,
      details: err.sqlMessage || err.toString()
    });
  }
});

// Delete all tickets safely
app.delete("/tickets/clear", async (req, res) => {
  try {
    // First, update all tables that reference tickets
    const updateQueries = [
      "UPDATE breakfast SET ticket_id = NULL WHERE ticket_id IS NOT NULL",
      "UPDATE students SET ticket_id = NULL WHERE ticket_id IS NOT NULL",
      "UPDATE lunch SET ticket_id = NULL WHERE ticket_id IS NOT NULL",
      "UPDATE dinner SET ticket_id = NULL WHERE ticket_id IS NOT NULL",
      "DELETE FROM ticket_history WHERE ticket_id IS NOT NULL"  // Delete ticket history records
    ];

    // Execute all update queries
    for (const updateQuery of updateQueries) {
      await query(updateQuery);
    }
    
    // Then delete all tickets
    const deleteQuery = "DELETE FROM tickets";
    await query(deleteQuery);
    
    console.log("All tickets and related records have been deleted successfully");
    res.json({ message: "All tickets and related records have been deleted successfully" });
  } catch (err) {
    console.error("Error deleting tickets:", err);
    res.status(500).json({ message: "Failed to delete tickets", error: err.message });
  }
});

// Endpoint to get menu with food details
app.get('/menu/with-food', async (req, res) => {
  try {
    const menuQuery = `
      SELECT m.menu_id, m.food_id, f.name, f.price, f.description, f.ingredients, f.image_url, f.type
      FROM menu m
      JOIN food f ON m.food_id = f.food_id
      ORDER BY m.menu_id
    `;
    
    const results = await query(menuQuery); // Use our promisified query function
    console.log('Menu data fetched:', results);
    res.json(results);
  } catch (err) {
    console.error('Error fetching menu with food:', err);
    res.status(500).json({ error: 'Failed to fetch menu data' });
  }
});

// Add endpoint to get menu by type
app.get('/menu/type/:type', async (req, res) => {
  const { type } = req.params;
  try {
    let results = [];
    
    // First try to get items from the food table
    const foodQuery = `
      SELECT m.menu_id, m.food_id, f.name, f.price, f.description, f.ingredients, f.image_url, f.type
      FROM menu m
      JOIN food f ON m.food_id = f.food_id
      WHERE f.type = ?
      ORDER BY m.menu_id
    `;
    
    const foodResults = await query(foodQuery, [type]);
    
    if (foodResults.length > 0) {
      results = foodResults;
    } else {
      // If no results from food table, try the specific meal table
      let mealQuery;
      switch (type.toLowerCase()) {
        case 'breakfast':
          mealQuery = 'SELECT id as menu_id, id as food_id, name, price, description, NULL as ingredients, NULL as image_url, "breakfast" as type FROM breakfast';
          break;
        case 'lunch':
          mealQuery = 'SELECT id as menu_id, id as food_id, name, price, description, NULL as ingredients, NULL as image_url, "lunch" as type FROM lunch';
          break;
        case 'dinner':
          mealQuery = 'SELECT id as menu_id, id as food_id, name, price, description, NULL as ingredients, NULL as image_url, "dinner" as type FROM dinner';
          break;
        default:
          return res.status(400).json({ error: 'Invalid meal type' });
      }
      
      const mealResults = await query(mealQuery);
      results = mealResults;
    }
    
    console.log(`Menu data fetched for type ${type}:`, results);
    res.json(results);
  } catch (err) {
    console.error(`Error fetching menu for type ${type}:`, err);
    res.status(500).json({ error: 'Failed to fetch menu data' });
  }
});

// User roles and permissions
const USER_ROLES = {
  SUPERVISOR: 'supervisor',
  DIRECTOR: 'director',
  DASHBOARD_USER: 'dashboard_user'
};

const ROLE_PERMISSIONS = {
  [USER_ROLES.SUPERVISOR]: {
    canCreateUser: true,
    canDeleteUser: true,
    canModifyUser: true,
    canCreateCard: true,
    canDeleteCard: true,
    canModifyCardBalance: true,
    canViewStatistics: true,
    canGenerateReports: true
  },
  [USER_ROLES.DIRECTOR]: {
    canCreateUser: false,
    canDeleteUser: false,
    canModifyUser: false,
    canCreateCard: false,
    canDeleteCard: false,
    canModifyCardBalance: false,
    canViewStatistics: true,
    canGenerateReports: true
  },
  [USER_ROLES.DASHBOARD_USER]: {
    canCreateUser: true,
    canDeleteUser: false,
    canModifyUser: true,
    canCreateCard: true,
    canDeleteCard: false,
    canModifyCardBalance: true,
    canViewStatistics: true,
    canGenerateReports: true
  }
};

// Middleware to check user role and permissions
const checkPermission = (requiredPermission) => async (req, res, next) => {
  const userRole = req.headers['user-role'];
  if (!userRole || !ROLE_PERMISSIONS[userRole]) {
    return res.status(403).json({ message: 'Unauthorized access' });
  }
  
  if (!ROLE_PERMISSIONS[userRole][requiredPermission]) {
    return res.status(403).json({ message: 'Permission denied' });
  }
  
  next();
};

// User Management Endpoints
app.post('/users', checkPermission('canCreateUser'), async (req, res) => {
  try {
    const { username, password, role, full_name } = req.body;
    const insertQuery = `
      INSERT INTO users (username, password, role, full_name)
      VALUES (?, ?, ?, ?)
    `;
    const result = await query(insertQuery, [username, password, role, full_name]);
    res.status(201).json({ id: result.insertId, message: 'User created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create user', error: err.message });
  }
});

app.delete('/users/:id', checkPermission('canDeleteUser'), async (req, res) => {
  try {
    const userId = req.params.id;
    await query('DELETE FROM users WHERE id = ?', [userId]);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user', error: err.message });
  }
});

// Card Management Endpoints
app.get('/cards', async (req, res) => {
  try {
    const results = await query(
      'SELECT card_id, student_id, sold, history, used, card_number_sold, card_number FROM university_cards ORDER BY card_id DESC'
    );
    res.json(results);
  } catch (error) {
    console.error('Error fetching cards:', error);
    res.status(500).json({ message: 'Failed to fetch cards' });
  }
});

app.post('/cards', async (req, res) => {
  const { student_id, card_number, sold, history, used, card_number_sold } = req.body;
  
  try {
    // Check if student exists
    const students = await query('SELECT student_id FROM students WHERE student_id = ?', [student_id]);
    if (students.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if card number already exists
    if (card_number) {
      // Convert to uppercase for consistency
      const formattedCardNumber = card_number.toUpperCase();

      // Validate card number format (4 letters followed by 5 numbers)
      const cardNumberRegex = /^[A-Z]{4}\d{5}$/;
      if (!cardNumberRegex.test(formattedCardNumber)) {
        return res.status(400).json({ 
          message: 'Invalid card number format',
          details: 'Card number must be 4 letters followed by 5 numbers (e.g., ABCD12345)',
          example: 'CARD12345'
        });
      }

      const existingCards = await query('SELECT card_id FROM university_cards WHERE card_number = ?', [formattedCardNumber]);
      if (existingCards.length > 0) {
        return res.status(400).json({ 
          message: 'Card number already exists',
          details: 'Each card must have a unique card number'
        });
      }
    }

    // Check if student already has a card
    const existingStudentCard = await query('SELECT card_id FROM university_cards WHERE student_id = ?', [student_id]);
    if (existingStudentCard.length > 0) {
      return res.status(400).json({ 
        message: 'Student already has a card',
        details: 'Each student can only have one card'
      });
    }

    // Insert new card with formatted card number
    const result = await query(
      'INSERT INTO university_cards (student_id, card_number, sold, history, used, card_number_sold) VALUES (?, ?, ?, ?, ?, ?)',
      [student_id, card_number ? card_number.toUpperCase() : null, sold || 0, history || null, used || false, card_number_sold || null]
    );

    res.status(201).json({ 
      card_id: result.insertId,
      student_id,
      card_number: card_number ? card_number.toUpperCase() : null,
      sold: sold || 0,
      history: history || null,
      used: used || false,
      card_number_sold: card_number_sold || null
    });
  } catch (error) {
    console.error('Error creating card:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        message: 'Card number already exists',
        details: 'Each card must have a unique card number'
      });
    }
    res.status(500).json({ message: 'Failed to create card' });
  }
});

app.put('/cards/:card_id', async (req, res) => {
  const { card_id } = req.params;
  const { sold, history, used, card_number_sold, card_number } = req.body;

  try {
    let formattedCardNumber = null;
    
    // If card number is being updated, check for uniqueness and format
    if (card_number) {
      // Convert to uppercase for consistency
      formattedCardNumber = card_number.toUpperCase();

      // Validate card number format (4 letters followed by 5 numbers)
      const cardNumberRegex = /^[A-Z]{4}\d{5}$/;
      if (!cardNumberRegex.test(formattedCardNumber)) {
        return res.status(400).json({ 
          message: 'Invalid card number format',
          details: 'Card number must be 4 letters followed by 5 numbers (e.g., ABCD12345)',
          example: 'CARD12345'
        });
      }

      // Check if the card number already exists for a different card
      const existingCard = await query(
        'SELECT card_id FROM university_cards WHERE card_number = ? AND card_id != ?',
        [formattedCardNumber, card_id]
      );
      if (existingCard.length > 0) {
        return res.status(400).json({ 
          message: 'Card number already exists',
          details: 'Each card must have a unique card number'
        });
      }
    }

    // First check if the card exists
    const cardExists = await query('SELECT card_id FROM university_cards WHERE card_id = ?', [card_id]);
    if (cardExists.length === 0) {
      return res.status(404).json({ message: 'Card not found' });
    }

    // Update the card with the new values
    const result = await query(
      'UPDATE university_cards SET sold = ?, history = ?, used = ?, card_number_sold = ?, card_number = ? WHERE card_id = ?',
      [
        sold !== undefined ? sold : 0,
        history || null,
        used !== undefined ? used : false,
        card_number_sold || null,
        formattedCardNumber,
        card_id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Card not found' });
    }

    // Fetch the updated card to return in response
    const updatedCard = await query('SELECT * FROM university_cards WHERE card_id = ?', [card_id]);
    
    res.json({ 
      message: 'Card updated successfully',
      card: updatedCard[0]
    });
  } catch (error) {
    console.error('Error updating card:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        message: 'Card number already exists',
        details: 'Each card must have a unique card number'
      });
    }
    res.status(500).json({ message: 'Failed to update card' });
  }
});

// Statistics Endpoints
app.get('/statistics/daily', checkPermission('canViewStatistics'), async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        DATE(issue_date) as date,
        COUNT(*) as total_tickets,
        SUM(price) as total_revenue,
        order_type
      FROM tickets
      WHERE DATE(issue_date) = CURDATE()
      GROUP BY DATE(issue_date), order_type
    `;
    const results = await query(statsQuery);
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch statistics', error: err.message });
  }
});

app.get('/statistics/monthly', checkPermission('canViewStatistics'), async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        DATE_FORMAT(issue_date, '%Y-%m') as month,
        COUNT(*) as total_tickets,
        SUM(price) as total_revenue,
        order_type
      FROM tickets
      WHERE issue_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(issue_date, '%Y-%m'), order_type
    `;
    const results = await query(statsQuery);
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch statistics', error: err.message });
  }
});

// Card Transaction History
app.get('/cards/:card_id/history', async (req, res) => {
  try {
    const cardId = req.params.card_id;
    const historyQuery = `
      SELECT 
        t.ticket_id,
        t.order_type,
        t.price,
        t.issue_date,
        t.used
      FROM tickets t
      JOIN students s ON t.student_id = s.student_id
      JOIN university_cards c ON s.card_id = c.card_id
      WHERE c.card_id = ?
      ORDER BY t.issue_date DESC
    `;
    const results = await query(historyQuery, [cardId]);
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch card history', error: err.message });
  }
});

// Get total number of students
app.get('/statistics/students/count', checkPermission('canViewStatistics'), async (req, res) => {
  try {
    const countQuery = 'SELECT COUNT(*) as total FROM students';
    const result = await query(countQuery);
    res.json({ total: result[0].total });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch student count', error: err.message });
  }
});

// Get total number of cards
app.get('/statistics/cards/count', checkPermission('canViewStatistics'), async (req, res) => {
  try {
    const countQuery = 'SELECT COUNT(*) as total FROM university_cards';
    const result = await query(countQuery);
    res.json({ total: result[0].total });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch card count', error: err.message });
  }
});

// Generate QR Code for user
app.get('/users/:user_id/qr', async (req, res) => {
  try {
    const userId = req.params.user_id;
    const userQuery = 'SELECT * FROM users WHERE id = ?';
    const user = await query(userQuery, [userId]);
    
    if (user.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const qrData = JSON.stringify({
      user_id: userId,
      timestamp: new Date().getTime(),
      random: Math.random().toString(36).substring(7)
    });
    
    res.json({ qr_data: qrData });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate QR code', error: err.message });
  }
});

// Check if student ID exists
app.get('/students/check/id/:id', async (req, res) => {
  try {
    const studentId = req.params.id;
    // Validate format first
    if (!studentId || !/^\d{5}$/.test(studentId)) {
      return res.status(400).json({ 
        message: 'Invalid Student ID format',
        details: 'Student ID must be exactly 5 digits'
      });
    }
    const result = await query('SELECT student_id FROM students WHERE student_id = ?', [studentId]);
    res.json({ exists: result.length > 0 });
  } catch (err) {
    console.error('Error checking student ID:', err);
    res.status(500).json({ message: 'Database error while checking student ID' });
  }
});

// Check if CN exists
app.get('/students/check/cn/:cn', async (req, res) => {
  try {
    const cn = req.params.cn;
    // Validate format first - must be exactly 8 digits
    if (!cn || !/^\d{8}$/.test(cn)) {
      return res.status(400).json({ 
        message: 'Invalid CN format',
        details: 'CN must be exactly 8 digits'
      });
    }
    const result = await query('SELECT cn FROM students WHERE cn = ?', [cn]);
    res.json({ exists: result.length > 0 });
  } catch (err) {
    console.error('Error checking CN:', err);
    res.status(500).json({ message: 'Database error while checking CN' });
  }
});

// Check if card number exists
app.get('/students/check/card/:cardNumber', async (req, res) => {
  try {
    const cardNumber = req.params.cardNumber;
    // Validate format first
    if (!cardNumber || !/^[A-Za-z]{4}\d{5}$/.test(cardNumber)) {
      return res.status(400).json({ 
        message: 'Invalid Card Number format',
        details: 'Card Number must be 9 characters (4 letters followed by 5 numbers)'
      });
    }
    const result = await query('SELECT card_number FROM university_cards WHERE card_number = ?', [cardNumber]);
    res.json({ exists: result.length > 0 });
  } catch (err) {
    console.error('Error checking card number:', err);
    res.status(500).json({ message: 'Database error while checking card number' });
  }
});

// Get all students
app.get('/students', async (req, res) => {
  try {
    const studentsQuery = `
      SELECT 
        s.student_id,
        s.cn,
        s.full_name,
        s.profile_img,
        s.card_id,
        s.university_id,
        s.orders_id,
        s.ticket_id,
        s.code_qr,
        u.university_description,
        uc.sold,
        uc.history,
        uc.used,
        uc.card_number_sold,
        uc.card_number
      FROM students s
      LEFT JOIN university u ON s.university_id = u.university_id
      LEFT JOIN university_cards uc ON s.card_id = uc.card_id
      ORDER BY s.student_id DESC
    `;
    
    const results = await query(studentsQuery);
    
    // Transform the results to match the expected format and properly format QR codes
    const transformedResults = results.map(student => ({
      ...student,
      profile_img: student.profile_img || null,
      card_id: student.card_id || null,
      orders_id: student.orders_id || null,
      ticket_id: student.ticket_id || null,
      university_description: student.university_description || 'Unknown University',
      qr_code: student.code_qr ? `data:image/png;base64,${student.code_qr}` : null,
      sold: student.sold || 0,
      used: student.used || false,
      card_number_sold: student.card_number_sold || null,
      card_number: student.card_number || null
    }));

    res.json(transformedResults);
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ message: 'Failed to fetch students', error: err.message });
  }
});

// Generate QR code data with more compact options
const generateQRCode = async (data) => {
  try {
    const qrCodeBase64 = await QRCode.toDataURL(JSON.stringify(data), {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 200,
      scale: 4,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    
    // Remove the data:image/png;base64, prefix
    return qrCodeBase64.split(',')[1];
  } catch (err) {
    console.error('Error generating QR code:', err);
    throw new Error('Failed to generate QR code');
  }
};

// Delete student endpoint - only supervisor can delete
app.delete('/students/:student_id', checkPermission('canDeleteUser'), async (req, res) => {
  try {
    const { student_id } = req.params;
    const userRole = req.headers['user-role'];

    // Only supervisor can delete students
    if (userRole !== USER_ROLES.SUPERVISOR) {
      return res.status(403).json({ 
        message: 'Only supervisors can delete students'
      });
    }

    // Start transaction
    const connection = await pool.promise().getConnection();
    await connection.beginTransaction();

    try {
      // First check if student exists
      const [existingStudent] = await connection.query(
        'SELECT student_id, card_id FROM students WHERE student_id = ?',
        [student_id]
      );

      if (existingStudent.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ message: 'Student not found' });
      }

      // Delete related records first
      if (existingStudent[0].card_id) {
        await connection.query(
          'DELETE FROM university_cards WHERE card_id = ?',
          [existingStudent[0].card_id]
        );
      }

      // Delete tickets associated with the student
      await connection.query(
        'DELETE FROM tickets WHERE student_id = ?',
        [student_id]
      );

      // Finally, delete the student
      await connection.query(
        'DELETE FROM students WHERE student_id = ?',
        [student_id]
      );

      await connection.commit();
      res.json({ 
        message: 'Student deleted successfully',
        student_id: student_id
      });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('Error deleting student:', err);
    res.status(500).json({ 
      message: 'Failed to delete student',
      error: err.message,
      details: err.sqlMessage || err.toString()
    });
  }
});

// Update student endpoint - only supervisor can update student_id
app.put('/student/:student_id', checkPermission('canCreateUser'), async (req, res) => {
  try {
    const { student_id } = req.params;
    const { cn, full_name, profile_img, university_id, card_number, new_student_id } = req.body;
    const userRole = req.headers['user-role'];

    // Check if trying to update student_id
    if (new_student_id && new_student_id !== student_id) {
      // Only supervisor can update student_id
      if (userRole !== USER_ROLES.SUPERVISOR) {
        return res.status(403).json({ 
          message: 'Only supervisors can update Student ID'
        });
      }

      // Validate new student ID format
      if (!/^\d{5}$/.test(new_student_id)) {
        return res.status(400).json({ 
          message: 'Invalid Student ID format',
          details: 'Student ID must be exactly 5 digits'
        });
      }

      // Check if new student ID already exists
      const [existingStudent] = await query(
        'SELECT student_id FROM students WHERE student_id = ?',
        [new_student_id]
      );

      if (existingStudent.length > 0) {
        return res.status(400).json({ 
          message: 'New Student ID already exists'
        });
      }
    }

    // Generate QR code data
    const qrData = {
      student_id: new_student_id || student_id,
      cn: cn,
      name: full_name,
      timestamp: new Date().getTime()
    };
    
    // Generate QR code
    const qrCodeBase64 = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 200,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    
    const qrCodeOnly = qrCodeBase64.split(',')[1];

    // Start transaction
    const connection = await pool.promise().getConnection();
    await connection.beginTransaction();

    try {
      // Update student information including QR code
      await connection.query(
        'UPDATE students SET student_id = ?, cn = ?, full_name = ?, profile_img = ?, university_id = ?, code_qr = ? WHERE student_id = ?',
        [new_student_id || student_id, cn, full_name, profile_img, university_id, qrCodeOnly, student_id]
      );

      // Update related records if student_id is changed
      if (new_student_id && new_student_id !== student_id) {
        // Update university_cards
        await connection.query(
          'UPDATE university_cards SET student_id = ? WHERE student_id = ?',
          [new_student_id, student_id]
        );

        // Update tickets
        await connection.query(
          'UPDATE tickets SET student_id = ? WHERE student_id = ?',
          [new_student_id, student_id]
        );
      }

      // Update or insert card information if provided
      if (card_number) {
        const [existingCard] = await connection.query(
          'SELECT card_id FROM university_cards WHERE student_id = ?',
          [new_student_id || student_id]
        );

        if (existingCard.length > 0) {
          await connection.query(
            'UPDATE university_cards SET card_number = ? WHERE student_id = ?',
            [card_number, new_student_id || student_id]
          );
        } else {
          await connection.query(
            'INSERT INTO university_cards (student_id, card_number, sold, used) VALUES (?, ?, 0, false)',
            [new_student_id || student_id, card_number]
          );
        }
      }

      await connection.commit();
      res.json({ 
        message: 'Student updated successfully',
        student_id: new_student_id || student_id,
        qr_code: `data:image/png;base64,${qrCodeOnly}`
      });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('Error updating student:', err);
    res.status(500).json({ 
      message: 'Failed to update student',
      error: err.message,
      details: err.sqlMessage || err.toString()
    });
  }
});

// Create new student with validation
app.post('/students', checkPermission('canCreateUser'), async (req, res) => {
  try {
    const { student_id, cn, full_name, profile_img, university_id, card_number } = req.body;

    // Data validation
    if (!student_id || !/^\d{5}$/.test(student_id.toString())) {
      return res.status(400).json({ 
        message: 'Invalid Student ID format',
        details: 'Student ID must be exactly 5 digits'
      });
    }

    if (!cn || !/^\d{8}$/.test(cn)) {
      return res.status(400).json({ 
        message: 'Invalid CN format',
        details: 'CN must be exactly 8 digits'
      });
    }

    if (!full_name || typeof full_name !== 'string' || full_name.trim().length < 2) {
      return res.status(400).json({ 
        message: 'Invalid Full Name format',
        details: 'Full Name must be at least 2 characters'
      });
    }

    if (!university_id || !/^\d{1,10}$/.test(university_id)) {
      return res.status(400).json({ 
        message: 'Invalid University ID format',
        details: 'University ID must be a number between 1 and 10 digits'
      });
    }

    // Card number validation (if provided)
    if (card_number) {
      if (!/^[A-Za-z]{4}\d{5}$/.test(card_number)) {
        return res.status(400).json({ 
          message: 'Invalid Card Number format',
          details: 'Card Number must be 9 characters (4 letters followed by 5 numbers)'
        });
      }
    }

    // Generate QR code data
    const qrData = {
      student_id: student_id,
      cn: cn,
      name: full_name,
      timestamp: new Date().getTime()
    };
    
    // Generate QR code with more compact options
    const qrCodeOnly = await generateQRCode(qrData);

    // Check for duplicate entries in a transaction
    const connection = await pool.promise().getConnection();
    await connection.beginTransaction();

    try {
      // First check if student exists
      const [existingStudent] = await connection.query(
        'SELECT student_id FROM students WHERE student_id = ?',
        [student_id]
      );

      if (existingStudent.length > 0) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ message: 'Student ID already exists' });
      }

      // Insert new student with QR code
      const [studentResult] = await connection.query(
        'INSERT INTO students (student_id, cn, full_name, profile_img, university_id, code_qr) VALUES (?, ?, ?, ?, ?, ?)',
        [student_id, cn, full_name, profile_img || null, university_id, qrCodeOnly]
      );

      // If card number provided, create university card
      if (card_number) {
        await connection.query(
          'INSERT INTO university_cards (student_id, card_number, sold, used) VALUES (?, ?, 0, false)',
          [student_id, card_number]
        );
      }

      await connection.commit();
      res.status(201).json({ 
        message: 'Student created successfully',
        student_id: student_id,
        student_record_id: studentResult.insertId,
        qr_code: `data:image/png;base64,${qrCodeOnly}`
      });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('Error creating student:', err);
    res.status(500).json({ 
      message: 'Failed to create student',
      error: err.message,
      details: err.sqlMessage || err.toString()
    });
  }
});

// Search university cards by card number
app.get('/cards/search/:cardNumber', async (req, res) => {
  try {
    const cardNumber = req.params.cardNumber;
    
    // If card number is less than 3 characters, return empty result
    if (cardNumber.length < 3) {
      return res.json([]);
    }

    const searchQuery = `
      SELECT 
        uc.card_id,
        uc.student_id,
        uc.sold,
        uc.history,
        uc.used,
        uc.card_number
      FROM university_cards uc
      WHERE uc.card_number LIKE ?
      ORDER BY uc.card_id DESC
      LIMIT 10
    `;

    const results = await query(searchQuery, [`%${cardNumber}%`]);
    
    // Transform results to ensure consistent format
    const transformedResults = results.map(card => ({
      ...card,
      sold: card.sold || 0,
      used: card.used || false,
      history: card.history || null
    }));

    res.json(transformedResults);
  } catch (err) {
    console.error('Error searching cards:', err);
    res.status(500).json({ 
      message: 'Failed to search cards',
      error: err.message 
    });
  }
});

// Search students by student ID
app.get('/students/search/:studentId', async (req, res) => {
  try {
    const studentId = req.params.studentId;
    
    // If search term is less than 2 characters, return empty result
    if (studentId.length < 2) {
      return res.json([]);
    }

    const searchQuery = `
      SELECT 
        s.student_id,
        s.cn,
        s.full_name,
        s.profile_img,
        s.university_id,
        s.code_qr,
        u.university_description,
        uc.sold as balance,
        uc.card_number,
        uc.used
      FROM students s
      LEFT JOIN university u ON s.university_id = u.university_id
      LEFT JOIN university_cards uc ON s.student_id = uc.student_id
      WHERE s.student_id LIKE ?
      ORDER BY s.student_id DESC
      LIMIT 10
    `;

    const results = await query(searchQuery, [`%${studentId}%`]);
    
    // Transform results to match the table format
    const transformedResults = results.map(student => ({
      ...student,
      profile_img: student.profile_img || null,
      university_description: student.university_description || 'Unknown University',
      balance: student.balance || '$0.00',
      card_number: student.card_number || '-',
      qr_code: student.code_qr ? `data:image/png;base64,${student.code_qr}` : 'No QR Code'
    }));

    res.json(transformedResults);
  } catch (err) {
    console.error('Error searching students:', err);
    res.status(500).json({ 
      message: 'Failed to search students',
      error: err.message 
    });
  }
});

// Get total counts
app.get('/dashboard/counts', async (req, res) => {
  try {
    // Get total number of students
    const studentsQuery = 'SELECT COUNT(*) as total_students FROM students';
    const cardsQuery = 'SELECT COUNT(*) as total_cards FROM university_cards';
    const ticketsQuery = 'SELECT COUNT(*) as total_tickets FROM tickets';
    
    // Daily revenue query - sum of prices from tickets for current day
    const dailyRevenueQuery = `
      SELECT COALESCE(SUM(price), 0) as daily_revenue 
      FROM tickets 
      WHERE DATE(issue_date) = CURDATE()
    `;
    
    // Monthly revenue query - sum of prices from tickets for current month
    const monthlyRevenueQuery = `
      SELECT COALESCE(SUM(price), 0) as monthly_revenue 
      FROM tickets 
      WHERE MONTH(issue_date) = MONTH(CURDATE()) 
      AND YEAR(issue_date) = YEAR(CURDATE())
    `;

    const [studentsResult, cardsResult, ticketsResult, dailyRevenueResult, monthlyRevenueResult] = await Promise.all([
      query(studentsQuery),
      query(cardsQuery),
      query(ticketsQuery),
      query(dailyRevenueQuery),
      query(monthlyRevenueQuery)
    ]);

    res.json({
      total_students: studentsResult[0].total_students || 0,
      total_cards: cardsResult[0].total_cards || 0,
      total_tickets: ticketsResult[0].total_tickets || 0,
      daily_revenue: dailyRevenueResult[0].daily_revenue || 0,
      monthly_revenue: monthlyRevenueResult[0].monthly_revenue || 0
    });
  } catch (err) {
    console.error('Error fetching counts:', err);
    res.status(500).json({ 
      message: 'Failed to fetch counts',
      error: err.message 
    });
  }
});

// Get single card by ID
app.get('/cards/:card_id', async (req, res) => {
  try {
    const { card_id } = req.params;
    
    const result = await query(
      'SELECT card_id, student_id, sold, history, used, card_number FROM university_cards WHERE card_id = ?',
      [card_id]
    );

    if (result.length === 0) {
      return res.status(404).json({ message: 'Card not found' });
    }

    res.json(result[0]);
  } catch (error) {
    console.error('Error fetching card:', error);
    res.status(500).json({ message: 'Failed to fetch card details' });
  }
});

// Add the latest tickets endpoint
app.get('/tickets/latest', async (req, res) => {
  try {
    console.log("Fetching latest tickets...");
    const sql = `
      SELECT ticket_id, order_id, issue_date, price, order_type, used, qr_data, student_id
      FROM tickets
      ORDER BY issue_date DESC, ticket_id DESC
      LIMIT 10
    `;
    
    // Use the promisified query function
    const tickets = await query(sql);
    console.log("Tickets found:", tickets.length);
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching latest tickets:', error);
    res.status(500).json({ message: 'Failed to fetch latest tickets', error: error.message });
  }
});

// Search tickets by date range
app.get('/tickets/search', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Validate date inputs
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }
    
    // Validate date format and ensure dates are valid
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return res.status(400).json({ message: 'Dates must be in YYYY-MM-DD format' });
    }
    
    // Build query to find tickets between start and end date
    const ticketsQuery = `
      SELECT 
        ticket_id, 
        order_id, 
        issue_date, 
        price, 
        order_type, 
        used, 
        student_id,
        qr_data
      FROM tickets 
      WHERE issue_date BETWEEN ? AND ?
      ORDER BY issue_date DESC, ticket_id DESC
    `;
    
    const results = await query(ticketsQuery, [startDate, endDate]);
    
    console.log(`Found ${results.length} tickets between ${startDate} and ${endDate}`);
    res.json(results);
  } catch (err) {
    console.error('Error searching tickets by date:', err);
    res.status(500).json({ message: 'Failed to search tickets', error: err.message });
  }
});

// ===== USER ROLES ENDPOINTS =====

// Get all available roles
app.get('/roles', async (req, res) => {
  try {
    const roles = await query('SELECT role_id, role_name, description FROM roles');
    res.json(roles);
  } catch (err) {
    console.error('Error fetching roles:', err);
    res.status(500).json({ message: 'Failed to fetch roles', error: err.message });
  }
});

// Get roles for a specific user
app.get('/users/:userId/roles', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate userId
    if (!userId || isNaN(parseInt(userId))) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    const userRoles = await query(`
      SELECT r.role_id, r.role_name, r.description
      FROM roles r
      JOIN user_roles ur ON r.role_id = ur.role_id
      WHERE ur.user_id = ?
    `, [userId]);
    
    res.json(userRoles);
  } catch (err) {
    console.error('Error fetching user roles:', err);
    res.status(500).json({ message: 'Failed to fetch user roles', error: err.message });
  }
});

// Assign role to user
app.post('/users/:userId/roles', async (req, res) => {
  try {
    const { userId } = req.params;
    const { roleName } = req.body;
    
    // Validate inputs
    if (!userId || isNaN(parseInt(userId))) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    if (!roleName) {
      return res.status(400).json({ message: 'Role name is required' });
    }
    
    // Check if user exists
    const userExists = await query('SELECT 1 FROM users WHERE user_id = ?', [userId]);
    if (userExists.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Call stored procedure to assign role
    const result = await query('CALL assign_role_to_user(?, ?)', [userId, roleName]);
    
    // Check result
    if (result[0][0].success) {
      res.status(201).json({ message: result[0][0].message });
    } else {
      res.status(400).json({ message: result[0][0].message });
    }
  } catch (err) {
    console.error('Error assigning role to user:', err);
    res.status(500).json({ message: 'Failed to assign role', error: err.message });
  }
});

// Remove role from user
app.delete('/users/:userId/roles/:roleName', async (req, res) => {
  try {
    const { userId, roleName } = req.params;
    
    // Validate userId
    if (!userId || isNaN(parseInt(userId))) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    // Delete the role assignment
    const result = await query(`
      DELETE ur FROM user_roles ur
      JOIN roles r ON ur.role_id = r.role_id
      WHERE ur.user_id = ? AND r.role_name = ?
    `, [userId, roleName]);
    
    if (result.affectedRows > 0) {
      res.json({ message: `Role ${roleName} removed from user ${userId}` });
    } else {
      res.status(404).json({ message: `User does not have role ${roleName}` });
    }
  } catch (err) {
    console.error('Error removing role from user:', err);
    res.status(500).json({ message: 'Failed to remove role', error: err.message });
  }
});

// Check if user has specific role
app.get('/users/:userId/has-role/:roleName', async (req, res) => {
  try {
    const { userId, roleName } = req.params;
    
    // Validate userId
    if (!userId || isNaN(parseInt(userId))) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    // Check if user has role
    const result = await query(
      'SELECT user_has_role(?, ?) as has_role', 
      [userId, roleName]
    );
    
    res.json({ hasRole: !!result[0].has_role });
  } catch (err) {
    console.error('Error checking user role:', err);
    res.status(500).json({ message: 'Failed to check user role', error: err.message });
  }
});

// Endpoint to upload and update profile image
app.post('/student/:student_id/profile-image', async (req, res) => {
  try {
    const studentId = req.params.student_id;
    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({ 
        message: 'No image data provided',
        details: 'Request body must include a base64 encoded image in the "image" field'
      });
    }
    
    console.log(`Received profile image upload request for student ID: ${studentId}`);
    
    // Decode the base64 image
    const imageBuffer = Buffer.from(image, 'base64');
    
    // Generate a unique filename
    const timestamp = Date.now();
    const filename = `profile_${studentId}_${timestamp}.jpg`;
    const filepath = path.join(imagesDir, filename);
    
    // Save the image to the server
    fs.writeFileSync(filepath, imageBuffer);
    console.log(`Image saved to: ${filepath}`);
    
    // Update the profile_img field in the students table
    const updateQuery = 'UPDATE students SET profile_img = ? WHERE student_id = ?';
    await query(updateQuery, [filename, studentId]);
    
    // Get the updated student data to return in the response
    const updatedStudent = await query('SELECT student_id, full_name, profile_img FROM students WHERE student_id = ?', [studentId]);
    
    if (updatedStudent.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.status(200).json({
      message: 'Profile image updated successfully',
      student: updatedStudent[0],
      image_url: `/images/${filename}`
    });
  } catch (err) {
    console.error('Error uploading profile image:', err);
    res.status(500).json({ 
      message: 'Failed to upload profile image',
      error: err.message
    });
  }
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Also accessible via http://10.0.2.2:${port} from Android emulators`);
  console.log('Server is listening on all network interfaces');
});