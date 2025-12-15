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

async function seedVerifications() {
    console.log('Seeding contractor verifications...');

    // 1. Fetch Contractors
    const { data: contractors, error: userError } = await supabase
        .from('users')
        .select('id')
        .in('role', ['general_contractor', 'subcontractor', 'trade_specialist'])
        .limit(10);

    if (userError || !contractors || contractors.length === 0) {
        console.error('No contractors found (or error):', userError);
        // Fallback: fetch any users
        const { data: users } = await supabase.from('users').select('id').limit(5);
        if (users && users.length > 0) {
            await insertVerifications(users);
        }
        return;
    }

    await insertVerifications(contractors);
}

async function insertVerifications(users) {
    const verifications = [];
    const types = ['identity', 'license', 'insurance', 'background_check'];
    const statuses = ['pending', 'approved', 'rejected'];

    for (const user of users) {
        // Create 1-2 verifications per user
        const num = Math.floor(Math.random() * 2) + 1;
        for (let i = 0; i < num; i++) {
            verifications.push({
                contractor_id: user.id,
                verification_type: types[Math.floor(Math.random() * types.length)],
                verification_status: statuses[Math.floor(Math.random() * statuses.length)],
                document_url: 'https://example.com/doc.pdf',
                admin_notes: 'Auto-seeded verification request'
            });
        }
    }

    const { data: insertedVerifications, error } = await supabase
        .from('contractor_verifications')
        .insert(verifications)
        .select();

    if (error) {
        console.error('Error seeding verifications:', error);
        return;
    } else {
        console.log(`Successfully seeded ${verifications.length} verifications.`);
    }

    // Seed Documents
    const documents = [];
    const docTypes = ['government_id', 'selfie', 'business_registration'];

    for (const v of insertedVerifications) {
        // Add 1-3 documents for each verification
        const numDocs = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < numDocs; i++) {
            documents.push({
                verification_id: v.id,
                type: docTypes[Math.floor(Math.random() * docTypes.length)],
                url: 'https://placehold.co/600x400/png', // Valid placeholder image
                status: 'pending',
                uploaded_at: new Date().toISOString()
            });
        }
    }

    const { error: docError } = await supabase.from('verification_documents').insert(documents);
    if (docError) {
        console.error('Error seeding documents:', docError);
    } else {
        console.log(`Successfully seeded ${documents.length} documents.`);
    }
}

seedVerifications();
