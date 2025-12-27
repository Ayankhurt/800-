-- Fix Appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES jobs(id);
CREATE INDEX IF NOT EXISTS idx_appointments_job_id ON appointments(job_id);

-- Fix Conversations
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES jobs(id);
CREATE INDEX IF NOT EXISTS idx_conversations_job_id ON conversations(job_id);

-- Fix Bids
ALTER TABLE bids ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES jobs(id);
ALTER TABLE bids ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id);

-- Optional: Ensure indexes for performance
CREATE INDEX IF NOT EXISTS idx_bids_job_id ON bids(job_id);
CREATE INDEX IF NOT EXISTS idx_bids_project_id ON bids(project_id);
