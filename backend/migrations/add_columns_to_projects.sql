-- Add missing columns to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS end_date DATE;
