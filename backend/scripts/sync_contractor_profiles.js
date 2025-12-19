import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncContractorProfiles() {
    console.log('Starting contractor profile sync...');

    // 1. Fetch all users
    const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*');

    if (usersError) {
        console.error('Error fetching users:', usersError);
        return;
    }

    console.log(`Fetched ${users.length} users.`);

    // 2. Identify contractors (roles that should have profiles)
    // Adjust these roles based on your actual ENUM/values in DB
    const contractorRoles = ['contractor', 'general_contractor', 'subcontractor', 'trade_specialist'];

    // Also include anyone who "looks" like a contractor if role is generic?? 
    // We'll trust the role column first. 
    // If filtering by role fails (e.g. role is missing), we might miss some.
    // Let's print roles to be safe.

    const potentialContractors = users.filter(u => {
        // If role is one of the contractor types
        if (contractorRoles.includes(u.role)) return true;

        // Fallback: Check email for hint (since user used 'gc@...', 'trade@...')
        // This is just a helper for this specific debug scenario
        if (u.email.includes('contractor') || u.email.includes('trade') || u.email.includes('sub') || u.email.includes('gc@')) return true;

        return false;
    });

    console.log(`Found ${potentialContractors.length} potential contractors.`);

    for (const user of potentialContractors) {
        // 3. Check if profile exists
        const { data: profile, error: profileError } = await supabase
            .from('contractor_profiles')
            .select('user_id')
            .eq('user_id', user.id)
            .single();

        if (profileError && profileError.code !== 'PGRST116') {
            console.error(`Error checking profile for ${user.email}:`, profileError);
            continue;
        }

        if (!profile) {
            console.log(`Profile MISSING for ${user.email} (${user.role}). Creating...`);

            // Generate a specialization based on role or email
            let spec = 'General Contractor';
            if (user.role === 'trade_specialist' || user.email.includes('trade')) spec = 'Specialist';
            if (user.role === 'subcontractor' || user.email.includes('sub')) spec = 'Subcontractor';

            const { error: insertError } = await supabase
                .from('contractor_profiles')
                .insert({
                    user_id: user.id,
                    trade_specialization: spec,
                    years_experience: Math.floor(Math.random() * 10) + 1,
                    hourly_rate_min: 50,
                    hourly_rate_max: 150,
                    service_area_radius_km: 50 // Changed from service_area string to matches schema
                });

            if (insertError) {
                console.error(`Failed to create profile for ${user.email}:`, insertError);
            } else {
                console.log(`Created profile for ${user.email}.`);
            }
        } else {
            console.log(`Profile exists for ${user.email} (User ID: ${user.id}).Skipping.`);
        }
    }
    console.log('Sync complete.');
}

syncContractorProfiles();
