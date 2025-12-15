
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

async function seedDashboard() {
    console.log("Starting dashboard seeding...");

    try {
        // 1. Seed Projects (Active)
        console.log("Seeding active projects...");
        const { data: owners } = await supabase.from("users").select("id").limit(1);
        if (!owners || owners.length === 0) {
            console.log("No users found to assign projects to. Skipping project seed.");
        } else {
            const ownerId = owners[0].id;

            // Check if projects exist
            const { count } = await supabase.from("projects").select("*", { count: 'exact', head: true });

            if (count === 0) {
                const { error: projectError } = await supabase.from("projects").insert([
                    {
                        title: "Luxury Villa Renovation",
                        description: "Complete renovation of a 5-bedroom villa including pool landscape.",
                        status: "active",
                        owner_id: ownerId,
                        budget: 150000,
                        total_amount: 150000,
                        completion_percentage: 45,
                        start_date: new Date().toISOString(),
                        created_at: new Date().toISOString()
                    },
                    {
                        title: "Downtown Office Fitout",
                        description: "Commercial fitout for a 200sqm office space.",
                        status: "active",
                        owner_id: ownerId,
                        budget: 75000,
                        total_amount: 75000,
                        completion_percentage: 15,
                        start_date: new Date().toISOString(),
                        created_at: new Date().toISOString()
                    }
                ]);
                if (projectError) console.error("Error seeding projects:", projectError);
                else console.log("Seeded 2 active projects.");
            }
        }

        // 2. Seed Revenue (Completed Transactions)
        console.log("Seeding completed transactions...");
        const { count: txCount } = await supabase.from("transactions").select("*", { count: 'exact', head: true }).eq('status', 'completed');

        if (txCount === 0) {
            const { error: txError } = await supabase.from("transactions").insert([
                {
                    amount: 5000,
                    status: "completed",
                    type: "payment",
                    description: "Milestone 1 Payment",
                    created_at: new Date(Date.now() - 86400000 * 2).toISOString() // 2 days ago
                },
                {
                    amount: 12500,
                    status: "completed",
                    type: "payment",
                    description: "Initial Deposit",
                    created_at: new Date(Date.now() - 86400000 * 5).toISOString() // 5 days ago
                }
            ]);
            if (txError) console.error("Error seeding transactions:", txError);
            else console.log("Seeded $17,500 in completed transactions.");
        }

        // 3. Seed Audit Logs (Recent Activity)
        console.log("Seeding audit logs...");
        // Check if we have logs
        const { count: logCount } = await supabase.from("audit_logs").select("*", { count: 'exact', head: true });

        if (logCount < 5) {
            const userId = owners && owners.length > 0 ? owners[0].id : null;

            const logs = [
                {
                    user_id: userId,
                    action_type: "update_settings",
                    resource_type: "system",
                    resource_id: "all",
                    metadata: { description: "Updated platform security settings" },
                    created_at: new Date().toISOString()
                },
                {
                    user_id: userId,
                    action_type: "approve_verification",
                    resource_type: "verification",
                    resource_id: "v-123",
                    metadata: { project_name: "John Doe Identity" }, // Dashboard uses project_name or resource_type
                    created_at: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
                },
                {
                    user_id: userId,
                    action_type: "resolve_dispute",
                    resource_type: "dispute",
                    resource_id: "d-456",
                    metadata: { project_name: "Refund Request #456" },
                    created_at: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
                },
                {
                    user_id: userId,
                    action_type: "create_job",
                    resource_type: "job",
                    resource_id: "j-789",
                    metadata: { project_name: "Kitchen Remodel Job" },
                    created_at: new Date(Date.now() - 86400000).toISOString() // 1 day ago
                }
            ];

            const { error: logError } = await supabase.from("audit_logs").insert(logs);
            if (logError) console.error("Error seeding audit logs:", logError);
            else console.log("Seeded 4 audit logs.");
        }

        console.log("Dashboard seeding complete!");

    } catch (err) {
        console.error("Unexpected error:", err);
    }
}

seedDashboard();
