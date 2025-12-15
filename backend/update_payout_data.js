import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updatePayoutData() {
    console.log('🔄 Updating existing payout data...');

    try {
        // Update scheduled dates for pending payouts
        const { error: pendingError } = await supabase
            .from('payouts')
            .update({
                scheduled_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            })
            .eq('status', 'pending')
            .is('scheduled_date', null);

        if (pendingError) console.error('Error updating pending:', pendingError);
        else console.log('✅ Updated pending payouts with scheduled dates');

        // Update scheduled dates for approved payouts
        const { error: approvedError } = await supabase
            .from('payouts')
            .update({
                scheduled_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
            })
            .eq('status', 'approved')
            .is('scheduled_date', null);

        if (approvedError) console.error('Error updating approved:', approvedError);
        else console.log('✅ Updated approved payouts with scheduled dates');

        // Update scheduled dates for processing payouts
        const { error: processingError } = await supabase
            .from('payouts')
            .update({
                scheduled_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString()
            })
            .eq('status', 'processing')
            .is('scheduled_date', null);

        if (processingError) console.error('Error updating processing:', processingError);
        else console.log('✅ Updated processing payouts with scheduled dates');

        // Update processed_at for completed payouts
        const { data: completedPayouts } = await supabase
            .from('payouts')
            .select('id, created_at')
            .eq('status', 'completed')
            .is('processed_at', null);

        if (completedPayouts && completedPayouts.length > 0) {
            for (const payout of completedPayouts) {
                await supabase
                    .from('payouts')
                    .update({ processed_at: payout.created_at })
                    .eq('id', payout.id);
            }
            console.log(`✅ Updated ${completedPayouts.length} completed payouts with processed_at`);
        }

        console.log('\n🎉 All payout data updated successfully!');
        console.log('📊 Refresh your Payout Management page to see the changes.');

    } catch (error) {
        console.error('❌ Error updating payout data:', error);
    }
}

updatePayoutData();
