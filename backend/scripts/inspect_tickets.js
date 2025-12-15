
import { supabase } from '../src/config/supabaseClient.js';

async function inspectTickets() {
    console.log('Inspecting tickets...');
    try {
        const { data, error } = await supabase
            .from('support_tickets')
            .select('status')
            .limit(10);

        if (error) console.error(error);
        console.log('Sample statuses:', data);
    } catch (err) {
        console.error(err);
    }
}
inspectTickets();
