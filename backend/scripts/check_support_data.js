
import { supabase } from '../src/config/supabaseClient.js';

async function checkSupportData() {
    console.log('Checking support data...');

    try {
        const { count: ticketsCount, error: ticketsError } = await supabase
            .from('support_tickets')
            .select('*', { count: 'exact', head: true });

        if (ticketsError) console.error('Error fetching tickets:', ticketsError);
        console.log('Total Support Tickets:', ticketsCount);

        const { count: openTicketsCount } = await supabase
            .from('support_tickets')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'open');
        console.log('Open Tickets:', openTicketsCount);

        const { count: verificationCount, error: vError } = await supabase
            .from('verification_requests')
            .select('*', { count: 'exact', head: true });

        if (vError) console.error('Error fetching verifications:', vError);
        console.log('Total Verifications:', verificationCount);

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

checkSupportData();
