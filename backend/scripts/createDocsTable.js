
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Pool } = pg;

// If DATABASE_URL is missing, we can't do anything.
if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not found in .env");
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS verification_documents (
                id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                verification_id uuid REFERENCES contractor_verifications(id) ON DELETE CASCADE,
                type text NOT NULL,
                url text NOT NULL,
                status text DEFAULT 'pending',
                validation_notes text,
                uploaded_at timestamptz DEFAULT now(),
                validated boolean DEFAULT false,
                expiration_date timestamptz
            );
        `);
        console.log("Table 'verification_documents' created successfully.");
    } catch (err) {
        console.error("Error creating table:", err);
    } finally {
        await pool.end();
    }
}
run();
