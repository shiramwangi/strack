const pool = require('./db');

const buildTables = async () => {
    try {
        console.log('🚧 Building database tables...');

        await pool.query(`
            -- 1. Create Users Table
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(128) PRIMARY KEY, 
                email VARCHAR(255) UNIQUE NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'agent')),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            -- 2. Create Fields Table
            CREATE TABLE IF NOT EXISTS fields (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
                name VARCHAR(255) NOT NULL,
                crop_type VARCHAR(100) NOT NULL,
                planting_date DATE,
                current_stage VARCHAR(50) NOT NULL CHECK (current_stage IN ('Planted', 'Growing', 'Ready', 'Harvested')),
                agent_id VARCHAR(128) REFERENCES users(id) ON DELETE SET NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            -- 3. Create Field Updates Table
            CREATE TABLE IF NOT EXISTS field_updates (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                field_id UUID REFERENCES fields(id) ON DELETE CASCADE,
                agent_id VARCHAR(128) REFERENCES users(id) ON DELETE SET NULL,
                previous_stage VARCHAR(50), 
                new_stage VARCHAR(50) NOT NULL,
                notes TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('✅ All tables successfully built in the postgres database!');
        process.exit(0); 
    } catch (err) {
        console.error('❌ Error building tables:', err.message);
        process.exit(1);
    }
};

// Execute the build
buildTables();