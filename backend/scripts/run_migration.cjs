const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Connection String
const CONNECTION_STRING = 'postgresql://postgres:!BidRoom44@zujytrddmmhaxakdvqbv.supabase.co:5432/postgres';

async function runMigration() {
    console.log('🔌 Connecting to database...');
    const client = new Client({
        connectionString: CONNECTION_STRING,
        ssl: { rejectUnauthorized: false } // Required for Supabase
    });

    try {
        await client.connect();
        console.log('✅ Connected.');

        // Read schema file
        const schemaPath = path.join(__dirname, '../schema_complete.sql');
        console.log(`📖 Reading schema from: ${schemaPath}`);

        if (!fs.existsSync(schemaPath)) {
            throw new Error('Schema file not found!');
        }

        const sql = fs.readFileSync(schemaPath, 'utf8');
        console.log(`⚡ Executing schema (${sql.length} bytes)...`);

        // Execute queries
        // Note: pg might not handle multiple statements in one query call efficiently depending on setup, 
        // but typically it works for DDL scripts. 
        await client.query(sql);

        console.log('✅ Migration completed successfully!');
    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        await client.end();
        console.log('🔌 Disconnected.');
    }
}

runMigration();
