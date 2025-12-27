require('dotenv').config();
console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);
console.log('SUPABASE_DB_URL present:', !!process.env.SUPABASE_DB_URL);
