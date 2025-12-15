import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Adjust path to .env depending on file location. Assuming backend root is parent.
dotenv.config({ path: path.join(__dirname, '.env') });

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    const client = await pool.connect();
    try {
        console.log('Starting schema update...');

        // Postgres doesn't support IF NOT EXISTS for ADD VALUE directly in older versions, 
        // but usually it throws a specific error we can ignore, OR we can check pg_enum table.
        // However, simplest way in a script is to wrap in a DO block or try/catch.

        try {
            await client.query("ALTER TYPE bid_status ADD VALUE 'cancelled'");
            console.log('Added "cancelled" to bid_status');
        } catch (e) {
            console.log('"cancelled" might already exist or error:', e.message);
        }

        try {
            await client.query("ALTER TYPE bid_status ADD VALUE 'closed'");
            console.log('Added "closed" to bid_status');
        } catch (e) {
            console.log('"closed" might already exist or error:', e.message);
        }

        try {
            await client.query("ALTER TYPE bid_status ADD VALUE 'open'");
            console.log('Added "open" to bid_status');
        } catch (e) {
            console.log('"open" might already exist or error:', e.message);
        }

        console.log('Adding "budget" column to bids...');
        await client.query("ALTER TABLE bids ADD COLUMN IF NOT EXISTS budget DECIMAL(12, 2)");

        console.log('Adding "trade_type" column to bids...');
        await client.query("ALTER TABLE bids ADD COLUMN IF NOT EXISTS trade_type VARCHAR(100)");

        console.log('Schema updated successfully.');
    } catch (err) {
        console.error('CRITICAL Error updating schema:', err);
    } finally {
        client.release();
        pool.end();
    }
}

run();
