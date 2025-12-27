import { supabase } from "./src/config/supabaseClient.js";

async function checkUsers() {
    console.log("Checking users in database...");
    const { data: users, error } = await supabase
        .from("users")
        .select("id, email, role, first_name, last_name")
        .limit(10);

    if (error) {
        console.error("Error fetching users:", error);
        return;
    }

    console.log("Users found:");
    console.table(users);
}

checkUsers();
