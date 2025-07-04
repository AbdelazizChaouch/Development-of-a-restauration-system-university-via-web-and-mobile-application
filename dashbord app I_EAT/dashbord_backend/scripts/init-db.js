const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function initializeDatabase() {
  // Create connection without database specified first
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456'
  });

  console.log('Connected to MySQL server');

  try {
    // Use the existing database
    await connection.query(`USE ${process.env.DB_NAME || 'i_eat_database'}`);
    console.log(`Using database ${process.env.DB_NAME || 'i_eat_database'}`);

    // Check for existing tables
    const [tables] = await connection.query('SHOW TABLES');
    console.log('Existing tables in database:');
    tables.forEach(table => {
      const tableName = table[`Tables_in_${process.env.DB_NAME || 'i_eat_database'}`];
      console.log(`- ${tableName}`);
    });
    
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Error initializing database:', error.message);
  } finally {
    await connection.end();
    console.log('Database connection closed');
  }
}

// Run the initialization
initializeDatabase(); 