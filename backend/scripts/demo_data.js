
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function createDemoData() {
    console.log('--- Starting Demo Data Creation ---');

    // 1. Find a PM user
    const { data: pmUser, error: pmError } = await supabase
        .from('users')
        .select('id, email')
        .eq('role', 'project_manager')
        .limit(1)
        .single();

    if (pmError || !pmUser) {
        console.error('Error finding PM user.', pmError);
        return;
    }

    // 2. Find three contractors
    const { data: contractors, error: cError } = await supabase
        .from('users')
        .select('id, email, first_name, last_name')
        .in('role', ['general_contractor', 'subcontractor', 'trade_specialist'])
        .limit(3);

    if (cError || !contractors || contractors.length < 3) {
        console.error('Error finding enough contractors.');
        return;
    }

    // 3. Create a Job
    const jobId = uuidv4();
    const { data: job, error: jError } = await supabase
        .from('jobs')
        .insert({
            id: jobId,
            project_manager_id: pmUser.id,
            title: 'Commercial Office Painting',
            description: 'Painting of a 5000 sq ft office space. Includes wall prep and two coats of premium eggshell finish.',
            location: 'Austin, TX',
            trade_type: 'Painting',
            status: 'open',
            budget_min: 12000,
            budget_max: 18000
        })
        .select()
        .single();

    if (jError) {
        console.error('Error creating job:', jError);
        return;
    }
    console.log(`Job Created: ${job.title}`);

    // 4. Create Bids (Invitations/Requests) for this job
    // One bid for each contractor
    const bids = contractors.map((c, i) => ({
        id: uuidv4(),
        job_id: jobId,
        project_manager_id: pmUser.id,
        contractor_id: c.id,
        title: `Paint Quote Request - ${c.first_name}`,
        description: 'Please provide your best quote for the office painting job.',
        status: 'submitted', // Set to submitted to show up as active
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }));

    const { error: bidsError } = await supabase
        .from('bids')
        .insert(bids);

    if (bidsError) {
        console.error('Error creating bids:', bidsError);
        return;
    }
    console.log('Created 3 Bids (Requests)');

    // 5. Create Submissions for these bids
    const submissions = bids.map((b, i) => ({
        bid_id: b.id,
        contractor_id: b.contractor_id,
        amount: 14000 + (i * 1500),
        timeline_days: 10 + (i * 2),
        proposal_text: `I can handle this project efficiently. My team of ${3 + i} painters will ensure a high-quality finish within ${10 + (i * 2)} days. We use Sherwin-Williams premium paints.`,
        status: 'submitted'
    }));

    const { error: subError } = await supabase
        .from('bid_submissions')
        .insert(submissions);

    if (subError) {
        console.error('Error creating submissions:', subError);
    } else {
        console.log('Created 3 Submissions from different contractors.');
    }

    console.log('\n--- Demo Data Creation Finished ---');
}

createDemoData();
