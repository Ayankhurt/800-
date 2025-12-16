
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) { process.exit(1); }
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTable() {
    console.log('Inspecting payouts table...');
    const { data, error } = await supabase.from('payouts').select('*').limit(1);
    if (data && data.length > 0) {
        console.log('Columns found in payouts table:');
        console.log(Object.keys(data[0]).join(', '));
    } else {
        console.log('No payouts found.');
    }
    process.exit(0);
}

inspectTable();
