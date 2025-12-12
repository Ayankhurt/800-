-- ============================================
-- Add Role-Specific Fields to Profiles Table
-- ============================================
-- This migration adds all the role-specific fields needed for
-- GC, Sub, PM, TS, and Viewer signup flows

-- Add company_name (for GC, Sub, PM)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS company_name TEXT;

-- Add trade_specialization (for GC, Sub, TS)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trade_specialization TEXT;

-- Add years_experience (for GC, Sub, PM, TS)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS years_experience INTEGER;

-- Add license_number (for GC, Sub)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS license_number TEXT;

-- Add license_type (for GC)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS license_type TEXT;

-- Add insurance_details (for GC, PM)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS insurance_details TEXT;

-- Add location (for all roles)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS location TEXT;

-- Add portfolio (for GC, Sub, PM, TS)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS portfolio TEXT;

-- Add certifications (for Sub, TS)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS certifications TEXT;

-- Add project_type (for PM)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS project_type TEXT;

-- Create indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_profiles_company_name ON public.profiles(company_name);
CREATE INDEX IF NOT EXISTS idx_profiles_trade_specialization ON public.profiles(trade_specialization);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles(location);

-- Verify the columns were added
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name IN (
    'company_name',
    'trade_specialization',
    'years_experience',
    'license_number',
    'license_type',
    'insurance_details',
    'location',
    'portfolio',
    'certifications',
    'project_type'
  )
ORDER BY column_name;




