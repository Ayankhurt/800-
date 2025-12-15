import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkTables() {
    console.log('Checking content_reports table...');
    const { data: reports, error: reportsError } = await supabase
        .from('content_reports')
        .select('*')
        .limit(5);

    if (reportsError) {
        console.error('Error fetching content_reports:', reportsError);
    } else {
        console.log(`Found ${reports?.length || 0} records in content_reports`);
        if (reports && reports.length > 0) {
            console.log('Sample:', reports[0]);
        }
    }

    console.log('\nChecking moderation_queue table...');
    const { data: queue, error: queueError } = await supabase
        .from('moderation_queue')
        .select('*')
        .limit(5);

    if (queueError) {
        console.error('Error fetching moderation_queue:', queueError);
    } else {
        console.log(`Found ${queue?.length || 0} records in moderation_queue`);
    }
}

checkTables();
