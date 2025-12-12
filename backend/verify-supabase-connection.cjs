const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://zujytrddmmhaxakdvqbv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1anl0cmRkbW1oYXhha2R2cWJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0Nzk5MjUsImV4cCI6MjA4MTA1NTkyNX0.ItllxYDUVH4eq2twDGanoWHFwfoxFCx-Q-kPcZ31Umo';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkConnection() {
    console.log('1. Testing "users" table...');
    const { error: usersError } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (usersError) console.log('Users Error:', usersError.message);
    else console.log('Users Table Exists!');

    console.log('2. Testing "non_existent" table...');
    const { error: error2 } = await supabase.from('non_existent').select('count', { count: 'exact', head: true });
    if (error2) console.log('Non-existent Error:', error2.message);
}

checkConnection();
