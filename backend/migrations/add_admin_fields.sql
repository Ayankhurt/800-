-- Add columns to users table to support Admin features

ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions TEXT[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS ip_whitelist TEXT[] DEFAULT '{}';
