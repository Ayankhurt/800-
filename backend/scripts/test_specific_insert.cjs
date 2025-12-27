const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testInsert() {
    console.log('Testing specific insert with IDs from error log...');
    // User ID from previous diagnostic success: 8de131a7-b5e8-4c16-9106-537aad2114fa
    const userId = "8de131a7-b5e8-4c16-9106-537aad2114fa";

    // IDs from user log
    const projectId = "f2a970a1-83b6-4e4a-bb29-c8b193af2dae";
    const attendeeId = "ffeff073-31c9-43d6-8510-f4a132fca107";

    const payload = {
        created_by: userId,
        project_id: projectId,
        attendee_id: attendeeId,
        title: 'Diagnostic Test Appointment',
        start_time: new Date().toISOString(),
        status: 'scheduled'
    };

    console.log('Payload:', payload);

    const { data, error } = await supabase.from('appointments').insert(payload).select().single();

    if (error) {
        console.error('❌ Insert Failed:', error);
        if (error.code === '23503') {
            console.log('⚠️ Confirmed Foreign Key Violation!');
            if (error.details) console.log('Details:', error.details);
            if (error.message) console.log('Message:', error.message);
        }
    } else {
        console.log('✅ Insert Success:', data.id);
        // Clean up
        await supabase.from('appointments').delete().eq('id', data.id);
    }
}

testInsert();
