ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES jobs(id);

-- Optional: Create index for performance
CREATE INDEX IF NOT EXISTS idx_appointments_job_id ON appointments(job_id);
