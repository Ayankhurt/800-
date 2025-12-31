import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkColumns() {
    console.log('Checking users table columns...');
    const { data, error } = await supabase.from('users').select('*').limit(1);
    if (error) {
        console.error('Error fetching user:', error.message);
        return;
    }

    if (data && data.length > 0) {
        console.log('Columns in users table:', Object.keys(data[0]));
    } else {
        console.log('No users found to check columns.');
        // Try to just update a non-existent column and see if it fails
        const { error: updateError } = await supabase.from('users').update({ intro_video_url: 'test' }).eq('id', 'non-existent');
        if (updateError) {
            console.log('intro_video_url likely missing:', updateError.message);
        } else {
            console.log('intro_video_url column exists.');
        }
    }
}

checkColumns();
