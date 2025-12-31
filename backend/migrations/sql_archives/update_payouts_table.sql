-- Add missing columns to payouts table

-- Add scheduled_date column
ALTER TABLE public.payouts 
ADD COLUMN IF NOT EXISTS scheduled_date TIMESTAMPTZ;

-- Add bank_account column (JSONB to store bank details)
ALTER TABLE public.payouts 
ADD COLUMN IF NOT EXISTS bank_account JSONB;

-- Update existing payouts with sample scheduled dates
UPDATE public.payouts 
SET scheduled_date = created_at + INTERVAL '7 days' 
WHERE status = 'pending' AND scheduled_date IS NULL;

UPDATE public.payouts 
SET scheduled_date = created_at + INTERVAL '3 days' 
WHERE status = 'approved' AND scheduled_date IS NULL;

UPDATE public.payouts 
SET scheduled_date = created_at + INTERVAL '1 day' 
WHERE status = 'processing' AND scheduled_date IS NULL;

-- Set processed_at for completed payouts if not already set
UPDATE public.payouts 
SET processed_at = created_at 
WHERE status = 'completed' AND processed_at IS NULL;
