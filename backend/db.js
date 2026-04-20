const { Pool } = require('pg');
require('dotenv').config();

// Create a new connection pool using our secret URL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Required for most cloud databases like Neon/Google Cloud
    }
});

// Test the connection immediately
pool.connect()
    .then(() => console.log('📦 Successfully connected to PostgreSQL Database'))
    .catch(err => console.error('❌ Database connection error:', err.stack));

module.exports = pool;