import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const diagnose = async () => {
    console.log('Diagnosing Database Schema...');

    // 1. Check user_settings table
    const { error: settingsError } = await supabase.from('user_settings').select('id').limit(1);
    if (settingsError) {
        console.error('❌ user_settings table check failed:', settingsError.message);
    } else {
        console.log('✅ user_settings table exists.');
    }

    // 2. Check jobs table columns (specifically created_by)
    // We try to select created_by. If it fails, column is missing.
    const { error: jobsError } = await supabase.from('jobs').select('created_by').limit(1);
    if (jobsError) {
        console.error('❌ jobs.created_by column check failed:', jobsError.message);
    } else {
        console.log('✅ jobs.created_by column exists.');
    }

    // 3. Check projects table columns (specifically created_by)
    const { error: projectsError } = await supabase.from('projects').select('created_by').limit(1);
    if (projectsError) {
        console.error('❌ projects.created_by column check failed:', projectsError.message);
    } else {
        console.log('✅ projects.created_by column exists.');
    }

    // 4. Check if we can insert into user_settings (to verify RLS/Permissions if table exists)
    // We won't actually insert, just checking existence was enough for now.
};

diagnose();
