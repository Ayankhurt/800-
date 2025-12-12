-- Add missing columns to users table for admin panel functionality
-- Run this migration in Supabase SQL Editor

-- Add MFA columns
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255);

-- Add admin-specific columns
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS permissions TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS ip_whitelist TEXT[] DEFAULT '{}';

-- Add suspension columns
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMP WITH TIME ZONE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_two_factor_enabled ON public.users(two_factor_enabled);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_verification_status ON public.users(verification_status);

-- Add comments for documentation
COMMENT ON COLUMN public.users.two_factor_enabled IS 'Whether MFA is enabled for this user';
COMMENT ON COLUMN public.users.two_factor_secret IS 'MFA secret key (base32 encoded)';
COMMENT ON COLUMN public.users.permissions IS 'Array of permission strings for admin users';
COMMENT ON COLUMN public.users.ip_whitelist IS 'Array of allowed IP addresses for admin users';
COMMENT ON COLUMN public.users.suspension_reason IS 'Reason for user suspension';
COMMENT ON COLUMN public.users.suspended_until IS 'Date when suspension expires (null for permanent)';

