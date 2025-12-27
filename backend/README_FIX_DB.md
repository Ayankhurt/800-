# Database Fix Instructions

The following issues were identified and fixes have been prepared:

1.  **Appointment Creation Error (500)**: Appointments for "Jobs" were failing because the system was trying to link them to "Projects".
    *   **Fix**: We updated the code to link them to Jobs correctly.
    *   **ACTION REQUIRED**: You MUST run the following SQL migration in your Supabase SQL Editor to add the `job_id` column to the `appointments` table.

    **File:** `backend/supabase/migrations/20251222120000_add_job_id_to_appointments.sql`

    **SQL Command:**
    ```sql
    ALTER TABLE appointments 
    ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES jobs(id);
    
    CREATE INDEX IF NOT EXISTS idx_appointments_job_id ON appointments(job_id);
    ```

2.  **Project Details Page Not Found**: The link to project details was broken.
    *   **Fix**: Valid `project-details.tsx` page has been created. It should work immediately.

3.  **Conversations Not Opening**: Checking for potential schema mismatches. (See terminal output for diagnostics).

Please run the SQL command above to ensure Appointment creation works fully.
