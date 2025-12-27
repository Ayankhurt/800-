require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function findValidBidStatus() {
    console.log("🔍 Finding Valid Bid Status Enum Values...\n");

    const testStatuses = [
        'pending',
        'open',
        'submitted',
        'awarded',
        'declined',
        'rejected',
        'accepted',
        'in_progress',
        'completed',
        'cancelled',
        'active',
        'closed'
    ];

    const validStatuses = [];
    const invalidStatuses = [];

    for (const status of testStatuses) {
        const testBid = {
            project_manager_id: '1b5b736c-0886-412f-9ff4-7d1b1cde199d',
            contractor_id: 'ba79282f-f6e2-44aa-8e96-70807a540049',
            title: 'Test Bid',
            descriptions: 'Testing status enum',
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            status: status
        };

        const { data, error } = await supabase
            .from('bids')
            .insert(testBid)
            .select()
            .single();

        if (error) {
            if (error.message.includes('invalid input value for enum')) {
                invalidStatuses.push(status);
                console.log(`❌ ${status} - Invalid`);
            } else {
                console.log(`⚠️  ${status} - Error: ${error.message}`);
            }
        } else {
            validStatuses.push(status);
            console.log(`✅ ${status} - Valid`);
            // Clean up
            await supabase.from('bids').delete().eq('id', data.id);
        }
    }

    console.log("\n" + "=".repeat(50));
    console.log("📊 RESULTS:");
    console.log("=".repeat(50));
    console.log("\n✅ Valid Status Values:");
    validStatuses.forEach(s => console.log(`   - ${s}`));

    console.log("\n❌ Invalid Status Values:");
    invalidStatuses.forEach(s => console.log(`   - ${s}`));

    console.log("\n💡 Recommendation:");
    if (validStatuses.length > 0) {
        console.log(`   Use one of these: ${validStatuses.join(', ')}`);
    } else {
        console.log("   No valid statuses found - check database enum definition");
    }
}

findValidBidStatus();
