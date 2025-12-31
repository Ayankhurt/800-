-- Fix missing application_count column
-- Run in Supabase SQL Editor

ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS application_count INTEGER DEFAULT 0;

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'jobs' 
AND column_name = 'application_count';
