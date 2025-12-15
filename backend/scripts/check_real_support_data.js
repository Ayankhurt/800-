
import { supabase } from '../src/config/supabaseClient.js';

async function checkRealSupportData() {
    console.log('Checking REAL support data...');

    try {
        // 1. Check Support Tickets
        const { count: ticketsCount, error: ticketError } = await supabase
            .from('support_tickets')
            .select('*', { count: 'exact', head: true });

        if (ticketError) console.error('Tickets Error:', ticketError.message);
        else console.log('Total Support Tickets:', ticketsCount);

        const { count: openTickets } = await supabase
            .from('support_tickets')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'open');
        console.log('Open Tickets:', openTickets);

        // 2. Check Contractor Verifications
        const { count: verificationsCount, error: verifyError } = await supabase
            .from('contractor_verifications')
            .select('*', { count: 'exact', head: true });

        if (verifyError) console.error('Verifications Error:', verifyError.message);
        else console.log('Total Contractor Verifications:', verificationsCount);

        const { count: pendingVerifications } = await supabase
            .from('contractor_verifications')
            .select('*', { count: 'exact', head: true })
            .eq('verification_status', 'pending');
        console.log('Pending Verifications:', pendingVerifications);

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

checkRealSupportData();
