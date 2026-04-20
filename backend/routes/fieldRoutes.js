const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../authMiddleware');

// GET fields (with Role-Based Security)
router.get('/', verifyToken, async (req, res) => {
    try {
        const userId = req.user.uid;

        // 1. Fetch the user's role from the database
        const userCheck = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
        
        // If they aren't in the DB yet, default them to 'agent' for maximum security
        const role = userCheck.rows.length > 0 ? userCheck.rows[0].role : 'agent';

        // 2. Start building the SQL Query
        let query = `
            SELECT f.*, MAX(u.created_at) as last_update 
            FROM fields f
            LEFT JOIN field_updates u ON f.id = u.field_id
        `;
        let queryParams = [];

        // 3. THE FIREWALL: If they are an agent, restrict the data
        if (role === 'agent') {
            query += ` WHERE f.agent_id = $1`;
            queryParams.push(userId); // We inject their specific Bouncer ID securely
        }

        query += ` GROUP BY f.id`;

        // 4. Execute the secure query
        const result = await pool.query(query, queryParams);
        const fields = result.rows;

        // 5. Calculate the dynamic status
        const processedFields = fields.map(field => {
            let status = 'Active';
            const fourteenDaysAgo = new Date();
            fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

            if (field.current_stage === 'Harvested') {
                status = 'Completed';
            } else if (!field.last_update || new Date(field.last_update) < fourteenDaysAgo) {
                status = 'At Risk';
            }

            return { ...field, computed_status: status };
        });

        res.json(processedFields);
    } catch (err) {
        console.error("GET Route Error:", err.message);
        res.status(500).json({ error: "Failed to fetch fields" });
    }
});
// POST a new field (Agent action)
router.post('/', verifyToken, async (req, res) => {
    try {
        // 1. Unpack the data
        const { name, crop_type, planting_date, current_stage } = req.body;
        
        // 2. Grab the User's ID and Email from the Bouncer's token
        const agent_id = req.user.uid;
        const email = req.user.email; 

        // 3. THE FIX: Auto-Sync the user into PostgreSQL
        // 'ON CONFLICT DO NOTHING' means if they already exist, it just skips this step quietly.
        await pool.query(`
            INSERT INTO users (id, email, full_name, role) 
            VALUES ($1, $2, $3, $4) 
            ON CONFLICT (id) DO NOTHING
        `, [agent_id, email, 'Admin User', 'admin']);

        // 4. Inject the field data
        const newField = await pool.query(
            `INSERT INTO fields (name, crop_type, planting_date, current_stage, agent_id) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING *`,
            [name, crop_type, planting_date, current_stage, agent_id]
        );

        // 5. Send success response
        res.status(201).json(newField.rows[0]);
    } catch (err) {
        console.error("Error creating field:", err.message);
        res.status(500).json({ error: "Failed to create field" });
    }
});

// POST a field update (Agent logging progress)
router.post('/:id/updates', verifyToken, async (req, res) => {
    // We 'checkout' a dedicated connection for our transaction
    const client = await pool.connect(); 
    
    try {
        const fieldId = req.params.id; // The UUID from the URL
        const { new_stage, notes } = req.body;
        const agent_id = req.user.uid;

        // Start the Transaction. No changes are permanent until we say COMMIT.
        await client.query('BEGIN'); 

        // 1. Fetch the field to see what stage it is currently in
        const fieldRes = await client.query('SELECT current_stage FROM fields WHERE id = $1', [fieldId]);
        
        if (fieldRes.rows.length === 0) {
            await client.query('ROLLBACK'); // Cancel everything
            return res.status(404).json({ error: "Field not found" });
        }
        const previous_stage = fieldRes.rows[0].current_stage;

        // 2. Save the historical log
        const updateRes = await client.query(
            `INSERT INTO field_updates (field_id, agent_id, previous_stage, new_stage, notes) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [fieldId, agent_id, previous_stage, new_stage, notes]
        );

        // 3. Update the master field record
        await client.query(
            `UPDATE fields SET current_stage = $1 WHERE id = $2`,
            [new_stage, fieldId]
        );

        // Everything worked! Save the data permanently.
        await client.query('COMMIT'); 
        
        res.status(201).json({ 
            message: "Update logged successfully!", 
            update: updateRes.rows[0] 
        });
    } catch (err) {
        await client.query('ROLLBACK'); // If anything broke, cancel the whole transaction
        console.error("Error logging update:", err.message);
        res.status(500).json({ error: "Failed to log update" });
    } finally {
        client.release(); // Give the connection back to the pool
    }
});
module.exports = router;