
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedFinancials() {
    console.log("Starting financial data seeding...");

    try {
        // 1. Get User
        const { data: users } = await supabase.from("users").select("id").limit(1);
        if (!users || users.length === 0) {
            console.error("No users found. Run user seed first.");
            return;
        }
        const userId = users[0].id; // Use this as contractor/owner

        // 2. Get Project
        const { data: projects } = await supabase.from("projects").select("id").limit(1);
        let projectId = null;
        if (projects && projects.length > 0) {
            projectId = projects[0].id;
        } else {
            // Create a project if none exists
            const { data: newProject } = await supabase.from("projects").insert({
                title: "Seeded Project for Escrow",
                description: "Auto-generated project",
                status: "active",
                owner_id: userId,
                budget: 10000,
                total_amount: 10000,
                completion_percentage: 0
            }).select().single();
            projectId = newProject.id;
        }

        // 3. Seed Payouts
        console.log("Seeding payouts...");
        const payoutsData = [
            {
                contractor_id: userId,
                amount: 2500.00,
                status: 'pending',
                created_at: new Date().toISOString()
            },
            {
                contractor_id: userId,
                amount: 1250.50,
                status: 'approved',
                created_at: new Date(Date.now() - 86400000).toISOString() // 1 day ago
            }
        ];

        const { error: payoutError } = await supabase.from('payouts').insert(payoutsData);
        if (payoutError) console.error("Error seeding payouts:", payoutError);
        else console.log("Seeded 2 payouts.");

        // 4. Seed Escrow Transactions
        console.log("Seeding escrow transactions...");
        const escrowData = [
            {
                project_id: projectId,
                amount: 5000.00,
                status: 'held',
                deposited_by: userId,
                created_at: new Date().toISOString()
            },
            {
                project_id: projectId,
                amount: 3000.00,
                status: 'released',
                deposited_by: userId,
                created_at: new Date(Date.now() - 86400000 * 2).toISOString()
            }
        ];

        const { error: escrowError } = await supabase.from('escrow_transactions').insert(escrowData);
        if (escrowError) console.error("Error seeding escrow:", escrowError);
        else console.log("Seeded 2 escrow transactions.");

        console.log("Financial seeding complete!");

    } catch (err) {
        console.error("Unexpected error:", err);
    }
}

seedFinancials();
