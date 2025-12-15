
import { supabase } from '../src/config/supabaseClient.js';

async function inspectSchema() {
    console.log('Inspecting schema...');

    // Check verification_requests columns via a dummy select error or manual introspection if RLS allows
    // Or just try to select * limit 1
    const { data: vData, error: vError } = await supabase.from('verification_requests').select('*').limit(1);
    if (vError) console.log('Verifications error:', vError);
    else console.log('Verifications row sample:', vData[0]);

    // Check tables
    // This is hard to do via client without direct SQL access, but let's try to infer from previous steps
}

inspectSchema();
