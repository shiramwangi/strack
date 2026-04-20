const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db'); 
const admin = require('./firebase');
const verifyToken = require('./authMiddleware'); // Import the Bouncer
const fieldRoutes = require('./routes/fieldRoutes'); // You imported this correctly!
const userRoutes = require('./routes/userRoutes');


const app = express();

// Middleware (Global Bouncers)
app.use(cors()); 
app.use(express.json()); 

// --- PUBLIC ROUTES ---
// Anyone can hit these without a token

app.get('/api/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ 
            status: "Success",
            message: "Database is talking to Express!", 
            database_time: result.rows[0].now 
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Database connection failed" });
    }
});

// --- PROTECTED ROUTES ---
// These require a valid Firebase ID Token (The Wristband)

app.get('/api/secure-data', verifyToken, (req, res) => {
    // If the code reaches here, verifyToken called next()
    res.json({ 
        message: "You have passed the security checkpoint!",
        user_id: req.user.uid,
        email: req.user.email
    });
});

// 👉 THIS IS THE LINE WE NEEDED TO ADD
// It mounts the router. Any request to /api/fields is now handed off to fieldRoutes.js
app.use('/api/fields', fieldRoutes);
app.use('/api/users', userRoutes);

// --- START SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});