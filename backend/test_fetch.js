import { supabase } from './src/config/supabaseClient.js';

async function test() {
    console.log('Testing fetch from projects table...');
    const { data, error, count } = await supabase
        .from('projects')
        .select('*', { count: 'exact' });

    if (error) {
        console.error('Error fetching projects:', error);
    } else {
        console.log('Success! Data length:', data?.length || 0, 'Total Count:', count);
        if (data?.length > 0) {
            console.log('First project sample:', data[0].title);
        }
    }
}

test();
