// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../authMiddleware');

// GET all users (ADMIN ONLY)
router.get('/', verifyToken, async (req, res) => {
    try {
        const adminId = req.user.uid;
        
        // Security Check: Is the requester actually an admin?
        const adminCheck = await pool.query('SELECT role FROM users WHERE id = $1', [adminId]);
        if (adminCheck.rows[0]?.role !== 'admin') {
            return res.status(403).json({ error: "Access denied. Admins only." });
        }

        const result = await pool.query('SELECT id, email, role, created_at FROM users ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// POST: Register a new user role (ADMIN ONLY)
router.post('/register', verifyToken, async (req, res) => {
    // 1. Destructure all three fields from the frontend request
    const { email, role, full_name } = req.body; 

    try {
        // Security Check: Is the requester an admin?
        const adminCheck = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.uid]);
        if (adminCheck.rows[0]?.role !== 'admin') {
            return res.status(403).json({ error: "Access denied. Admins only." });
        }

        const tempId = `temp_${email}`;

        // 2. Insert with the provided full_name
        await pool.query(
            `INSERT INTO users (id, email, role, full_name) 
             VALUES ($1, $2, $3, $4) 
             ON CONFLICT (email) 
             DO UPDATE SET role = $3, full_name = $4`,
            [tempId, email, role, full_name]
        );

        res.json({ message: "Member added successfully" });
    } catch (err) {
        console.error("Registration Error:", err.message);
        res.status(500).json({ error: "Database error during registration" });
    }
});

module.exports = router;