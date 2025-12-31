
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from ../.env (relative to scripts folder) or ./env
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

console.log("Loading env from:", envPath);
console.log("Supabase URL present:", !!process.env.SUPABASE_URL);

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
}

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createDemoUsers() {
    const users = [
        {
            email: 'viewer@example.com',
            password: 'password123',
            role: 'viewer',
            first_name: 'John',
            last_name: 'Viewer',
            verification_status: 'verified',
            is_active: true
        },
        {
            email: 'contractor@example.com',
            password: 'password123',
            role: 'general_contractor',
            first_name: 'Bob',
            last_name: 'Builder',
            verification_status: 'verified',
            is_active: true,
            company_name: 'Bob Construction Inc.'
        },
        {
            email: 'pm@example.com',
            password: 'password123',
            role: 'project_manager',
            first_name: 'Alice',
            last_name: 'Manager',
            verification_status: 'pending',
            is_active: true
        }
    ];

    console.log('Creating demo users...');

    for (const user of users) {
        // 1. Create auth user
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email: user.email,
            password: user.password,
            email_confirm: true,
            user_metadata: {
                first_name: user.first_name,
                last_name: user.last_name,
                role: user.role
            }
        });

        if (authError) {
            console.log(`Auth user creation skipped/failed for ${user.email} (might exist):`, authError.message);
            // Try to get existing user ID from public.users if auth failed
            const { data: existing } = await supabase.from('users').select('id').eq('email', user.email).single();
            if (existing) {
                console.log(`User ${user.email} exists in public.users.`);
                continue; // Already exists
            }
        }

        if (authUser && authUser.user) {
            console.log(`Created auth user: ${user.email} (${authUser.user.id})`);

            // 2. Insert into public.users (if trigger didn't handle it or to ensure fields)
            // Note: Trigger usually handles this, but we update to ensure role/fields
            const { error: dbError } = await supabase.from('users').upsert({
                id: authUser.user.id,
                email: user.email,
                role: user.role,
                first_name: user.first_name,
                last_name: user.last_name,
                verification_status: user.verification_status,
                is_active: user.is_active,
                company_name: user.company_name
            });

            if (dbError) {
                console.error(`DB upsert error for ${user.email}:`, dbError);
            } else {
                console.log(`Synced public user: ${user.email}`);
            }
        }
    }

    console.log('Demo users check complete.');
}

createDemoUsers();
