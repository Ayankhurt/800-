
import { supabase } from '../src/config/supabaseClient.js';
import axios from 'axios';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const API_URL = 'http://localhost:5000/api';

async function verifyWithTempUser() {
    console.log('Creating temp user...');
    const email = `temp_support_${Date.now()}@bidroom.com`;
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. Create user in admin_users (since support agents are admins?)
    // Actually, seeding puts them in 'admin_users'.
    const { data: user, error: createError } = await supabase
        .from('admin_users')
        .insert({
            email,
            password_hash: hashedPassword,
            role: 'support_agent',
            first_name: 'Temp',
            last_name: 'Support',
            is_active: true
        })
        .select()
        .single();

    if (createError) {
        console.error('Failed to create temp user:', createError);
        return;
    }
    console.log('Temp user created:', email);

    try {
        // 2. Login
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/admin/login`, {
            email,
            password
        });

        if (!loginRes.data.success) {
            console.error('Login failed:', loginRes.data);
            return;
        }

        const token = loginRes.data.data.token;
        console.log('Login successful.');

        // 3. Fetch Stats
        console.log('Fetching Admin Dashboard Stats...');
        const statsRes = await axios.get(`${API_URL}/stats/admin-dashboard`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Stats Response Status:', statsRes.status);
        console.log('Stats Support Data:', JSON.stringify(statsRes.data.data.supportStats, null, 2));

    } catch (error) {
        console.error('Error during verification:', error.response ? error.response.data : error.message);
    } finally {
        // 4. Cleanup
        console.log('Cleaning up...');
        await supabase.from('admin_users').delete().eq('id', user.id);
    }
}

verifyWithTempUser();
