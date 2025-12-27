import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const API_BASE_URL = 'http://192.168.1.113:5000/api/v1';

async function checkDates() {
    console.log('📅 Checking Date Formats in API Responses');
    console.log('='.repeat(50));

    // 1. Check Projects (Start/End Dates)
    try {
        // Login as PM
        const login = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: 'pm@test.com',
            password: 'ayan1212'
        });
        const token = login.data.data.token;

        // Get Projects
        const res = await axios.get(`${API_BASE_URL}/projects`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const projects = res.data.data;
        if (projects.length > 0) {
            console.log('\n🏗️  Checking Projects:');
            projects.forEach(p => {
                const start = p.start_date;
                const end = p.end_date;

                const startValid = !isNaN(Date.parse(start));
                const endValid = !isNaN(Date.parse(end));

                console.log(`   Project: ${p.title}`);
                console.log(`     Start: ${start} (${startValid ? '✅ Valid' : '❌ Invalid'})`);
                console.log(`     End:   ${end}   (${endValid ? '✅ Valid' : '❌ Invalid'})`);
            });
        }
    } catch (err) {
        console.log('❌ Project Check Failed:', err.message);
    }

    // 2. Check Milestones (Due Date)
    try {
        // Already logged in above (conceptually, reusing token logic would be better but keeping simple)
        const login = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: 'pm@test.com',
            password: 'ayan1212'
        });
        const token = login.data.data.token;

        const res = await axios.get(`${API_BASE_URL}/milestones`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const milestones = res.data.data;
        if (milestones && milestones.length > 0) {
            console.log('\n🎯 Checking Milestones:');
            milestones.forEach(m => {
                const due = m.due_date;
                const valid = !isNaN(Date.parse(due));
                console.log(`   Milestone: ${m.title}`);
                console.log(`     Due Date: ${due} (${valid ? '✅ Valid' : '❌ Invalid'})`);
            });
        }
    } catch (err) {
        // It might trigger 500 if controller not fully fixed? But we fixed it.
        // Or 404 if no milestones.
        console.log('❌ Milestone Check Failed:', err.message);
    }

    // 3. Check Users (Created At)
    try {
        const login = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: 'admin@bidroom.com',
            password: 'ayan1212'
        });
        const token = login.data.data.token;

        const res = await axios.get(`${API_BASE_URL}/admin/users`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        // Handle different response structures
        const users = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.users || []);

        if (users.length > 0) {
            console.log('\n👥 Checking Users:');
            // Check first 5 users
            users.slice(0, 5).forEach(u => {
                const created = u.created_at;
                const valid = !isNaN(Date.parse(created));
                console.log(`   User: ${u.email}`);
                console.log(`     Created: ${created} (${valid ? '✅ Valid' : '❌ Invalid'})`);
            });
        }
    } catch (err) {
        console.log('❌ User Check Failed:', err.message);
    }
}

checkDates();
