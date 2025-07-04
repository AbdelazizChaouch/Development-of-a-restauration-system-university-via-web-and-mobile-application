# Dashboard Backend

A Node.js backend API for a dashboard application with MySQL database connection to i_eat_database.

## Features

- RESTful API using Express.js
- MySQL database integration
- Comprehensive API endpoints for food services management
- User, student, and menu management
- Orders and tickets tracking
- University and card management

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MySQL Server

### Installation

1. Clone the repository
   ```
   git clone <your-repo-url>
   cd dashbord_backend
   ```

2. Install dependencies
   ```
   npm install
   # or
   yarn install
   ```

3. Set up environment variables
   - Copy `.env.example` to `.env` (or create a new `.env` file)
   - Update the variables in `.env` with your configuration:
   ```
   PORT=5000
   NODE_ENV=development
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=123456
   DB_NAME=i_eat_database
   ```

4. Initialize the database
   ```
   npm run init-db
   # or
   yarn init-db
   ```

5. Start the development server
   ```
   npm run dev
   # or
   yarn dev
   ```

6. The API will be available at `http://localhost:5000`

## API Endpoints

### Basic
- `GET /api/test` - Test endpoint
- `GET /api/dbtest` - Test database connection

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/:id/permissions` - Get user with permissions
- `POST /api/users` - Create a new user
- `PUT /api/users/:id` - Update a user
- `POST /api/users/login` - Authenticate user and log login activity

### Food
- `GET /api/food` - Get all food items
- `GET /api/food/:id` - Get food item by ID
- `POST /api/food` - Create a new food item

### Breakfast
- `GET /api/breakfast` - Get all breakfast items
- `GET /api/breakfast/:id` - Get breakfast item by ID
- `POST /api/breakfast` - Create a new breakfast item

### Lunch
- `GET /api/lunch` - Get all lunch items
- `GET /api/lunch/:id` - Get lunch item by ID
- `POST /api/lunch` - Create a new lunch item

### Dinner
- `GET /api/dinner` - Get all dinner items
- `GET /api/dinner/:id` - Get dinner item by ID
- `POST /api/dinner` - Create a new dinner item

### Menu
- `GET /api/menu` - Get all menu items
- `GET /api/menu/complete` - Get complete menu with meal details
- `GET /api/menu/:id` - Get menu item by ID
- `POST /api/menu` - Create a new menu item

### University
- `GET /api/university` - Get all universities
- `GET /api/university/:id` - Get university by ID
- `GET /api/university/:id/students` - Get university with students
- `POST /api/university` - Create a new university

### University Cards
- `GET /api/cards` - Get all university cards
- `GET /api/cards/:id` - Get university card by ID
- `GET /api/cards/:id/details` - Get university card with student details
- `POST /api/cards` - Create a new university card
- `PUT /api/cards/:id/used` - Mark a university card as used

### Students
- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get student by ID
- `GET /api/students/:id/university` - Get student with university details
- `GET /api/students/:id/tickets` - Get student with tickets
- `POST /api/students` - Create a new student

### Orders
- `GET /api/orders` - Get all orders
- `GET /api/orders/recent` - Get recent orders
- `GET /api/orders/stats` - Get order statistics
- `GET /api/orders/:id` - Get order by ID
- `GET /api/orders/:id/details` - Get order with details
- `POST /api/orders` - Create a new order

### Tickets
- `GET /api/tickets` - Get all tickets
- `GET /api/tickets/unused` - Get unused tickets
- `GET /api/tickets/:id` - Get ticket by ID
- `GET /api/tickets/:id/history` - Get ticket with history
- `POST /api/tickets` - Create a new ticket
- `PUT /api/tickets/:id/use` - Mark a ticket as used

### Dashboard
- `GET /api/dashboard` - Get dashboard statistics and recent activity

## Database Tables

The application connects to the i_eat_database which contains the following tables:
1. breakfast
2. dinner
3. food
4. lunch
5. menu
6. orders
7. permissions
8. role_permissions
9. students
10. ticket_history
11. tickets
12. university
13. university_cards
14. user_activity_logs
15. users

## Development

### Project Structure

```
dashbord_backend/
├── config/         # Configuration files
├── models/         # Database models
├── routes/         # API routes
├── middleware/     # Custom middleware
├── scripts/        # Database scripts
├── server.js       # Main application file
├── package.json    # Dependencies and scripts
└── .env            # Environment variables
```

## MySQL Database

The application uses a MySQL database with the following default configuration:
- Host: localhost
- User: root
- Password: 123456
- Database: i_eat_database

To change these settings, update the `.env` file.

## Deployment

Instructions for deployment will be added in the future.

## License

This project is licensed under the MIT License. 