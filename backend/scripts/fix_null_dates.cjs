
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fix() {
    console.log('Fixing null dates in jobs table...');
    const { data, error } = await supabase
        .from('jobs')
        .update({
            start_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            end_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            created_at: new Date().toISOString()
        })
        .or('start_date.is.null,created_at.is.null');

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Updated jobs with default dates.');
    }
}

fix();
