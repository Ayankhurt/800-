import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedModerationReports() {
    console.log('Seeding moderation reports...');

    // Get some users
    const { data: users } = await supabase
        .from('users')
        .select('id')
        .limit(3);

    if (!users || users.length === 0) {
        console.log('No users found');
        return;
    }

    // Get some jobs for content_id
    const { data: jobs } = await supabase
        .from('jobs')
        .select('id')
        .limit(5);

    const contentTypes = ['job', 'profile', 'review', 'message', 'photo'];
    const reasons = ['spam', 'inappropriate', 'harassment', 'fraud', 'other'];
    const statuses = ['pending', 'in_review', 'resolved', 'dismissed'];

    const reports = [];

    for (let i = 0; i < 10; i++) {
        const contentType = contentTypes[Math.floor(Math.random() * contentTypes.length)];
        const reason = reasons[Math.floor(Math.random() * reasons.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];

        reports.push({
            content_type: contentType,
            content_id: jobs && jobs.length > 0 ? jobs[Math.floor(Math.random() * jobs.length)].id : null,
            reported_by: users[Math.floor(Math.random() * users.length)].id,
            reason: reason,
            description: `This ${contentType} contains ${reason} content and should be reviewed.`,
            status: status,
            created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() // Random within last 7 days
        });
    }

    const { error } = await supabase.from('content_reports').insert(reports);

    if (error) {
        console.error('Error seeding reports:', error);
    } else {
        console.log(`Successfully seeded ${reports.length} moderation reports.`);
    }
}

seedModerationReports();
