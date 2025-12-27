const { Client } = require('pg');

// Using the connection string from run_migration.cjs
const CONNECTION_STRING = 'postgresql://postgres:!BidRoom44@zujytrddmmhaxakdvqbv.supabase.co:5432/postgres';

async function dropRedundantTables() {
    console.log('🔌 Connecting to database via PG...');
    const client = new Client({
        connectionString: CONNECTION_STRING,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Connected.');

        console.log('🗑️ Dropping redundant tables...');

        // Dropping the variants that are NOT 'users_settings'
        // We verified users_settings is the one with the unique constraint
        await client.query('DROP TABLE IF EXISTS public.users_setting CASCADE;');
        console.log('✅ users_setting dropped.');

        await client.query('DROP TABLE IF EXISTS public.user_settings CASCADE;');
        console.log('✅ user_settings dropped.');

        console.log('🔧 Adding dark_mode column to users_settings...');
        await client.query('ALTER TABLE public.users_settings ADD COLUMN IF NOT EXISTS dark_mode BOOLEAN DEFAULT FALSE;');
        console.log('✅ dark_mode column added to users_settings.');

        console.log('🚀 DB Cleanup completed successfully!');
    } catch (err) {
        console.error('❌ DB Operation failed:', err);
    } finally {
        await client.end();
        console.log('🔌 Disconnected.');
    }
}

dropRedundantTables();
