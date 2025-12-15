import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedDisputeResponses() {
    console.log('Seeding dispute responses...');

    // 1. Get disputes
    const { data: disputes, error } = await supabase
        .from('disputes')
        .select(`
            id, 
            raised_by,
            project:projects (
                owner_id, 
                contractor_id
            )
        `);

    if (error || !disputes) {
        console.error('Error fetching disputes:', error);
        return;
    }

    console.log(`Found ${disputes.length} disputes.`);

    for (const dispute of disputes) {
        // Check if responses already exist
        const { count } = await supabase
            .from('dispute_responses')
            .select('*', { count: 'exact', head: true })
            .eq('dispute_id', dispute.id);

        if (count > 0) {
            console.log(`Responses exist for dispute ${dispute.id}. Skipping.`);
            continue;
        }

        const project = dispute.project;
        if (!project) continue;

        const ownerId = project.owner_id;
        const contractorId = project.contractor_id; // Assuming owner/contractor distinct

        // Determine who raised it to alternate responses
        const filer = dispute.raised_by;
        const respondent = filer === ownerId ? contractorId : ownerId;

        const responses = [
            {
                dispute_id: dispute.id,
                user_id: filer,
                message: "This is official notice that the deliverables were not met as per the agreement.",
                created_at: new Date(Date.now() - 86400000 * 2).toISOString()
            },
            {
                dispute_id: dispute.id,
                user_id: respondent,
                message: "I disagree. The work was completed and evidence was uploaded to the project files.",
                created_at: new Date(Date.now() - 86400000 * 1).toISOString()
            },
            {
                dispute_id: dispute.id,
                user_id: filer,
                message: "The uploaded files are corrupted and do not show the finished tiling.",
                created_at: new Date(Date.now() - 43200000).toISOString() // 12 hours ago
            }
        ];

        const { error: insertError } = await supabase
            .from('dispute_responses')
            .insert(responses);

        if (insertError) {
            console.error(`Error inserting responses for dispute ${dispute.id}:`, insertError);
        } else {
            console.log(`Inserted responses for dispute ${dispute.id}`);
        }
    }

    console.log('Dispute responses seeding complete.');
}

seedDisputeResponses();
