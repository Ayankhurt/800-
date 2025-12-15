import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log("Testing Query...");

    // 1. Query
    const { data: transactions, error } = await supabase
        .from("escrow_transactions")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Query Error:", error);
        return;
    }
    console.log(`Found ${transactions.length} transactions.`);
    if (transactions.length > 0) {
        console.log("Sample:", transactions[0]);
    }

    const tList = transactions || [];

    // 2. Fetch Projects
    const projectIds = [...new Set(tList.map(t => t.project_id).filter(Boolean))];
    console.log("Project IDs:", projectIds);

    let projects = [];
    if (projectIds.length > 0) {
        const { data: p, error: pError } = await supabase
            .from('projects')
            .select('id, title, contractor_id, owner_id')
            .in('id', projectIds);

        if (pError) console.error("Project Error:", pError);
        projects = p || [];
    }
    console.log(`Found ${projects.length} projects.`);

    // 3. Fetch Users (Deposited By)
    const userIds = [...new Set(tList.map(t => t.deposited_by).filter(Boolean))];
    console.log("User IDs (Deposited By):", userIds);

    let users = [];
    if (userIds.length > 0) {
        const { data: u, error: uError } = await supabase
            .from('users')
            .select('id, first_name, last_name, email')
            .in('id', userIds);
        if (uError) console.error("User Error:", uError);
        users = u || [];
    }
    console.log(`Found ${users.length} users.`);
}

run();
