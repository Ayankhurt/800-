const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'c:/Users/HP/Desktop/800$/800-/backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkContractors() {
    console.log("--- Users with Contractor-like roles ---");
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, first_name, last_name, role, company_name')
        .in('role', ['CONTRACTOR', 'SUBCONTRACTOR', 'SUB', 'TS', 'contractor', 'subcontractor', 'sub', 'ts'])
        .limit(10);

    if (userError) console.error("User Error:", userError);
    else console.log(users);

    console.log("\n--- Contractor Profiles ---");
    const { data: profiles, error: profileError } = await supabase
        .from('contractor_profiles')
        .select('user_id, trade_specialization')
        .limit(10);

    if (profileError) console.error("Profile Error:", profileError);
    else console.log(profiles);

    console.log("\n--- All Users Roles Count ---");
    const { data: roles, error: rolesError } = await supabase
        .from('users')
        .select('role');

    if (rolesError) console.error("Roles Error:", rolesError);
    else {
        const counts = {};
        roles.forEach(r => {
            counts[r.role] = (counts[r.role] || 0) + 1;
        });
        console.log(counts);
    }
}

checkContractors();
