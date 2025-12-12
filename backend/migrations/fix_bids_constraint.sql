-- Fix Bids Status Constraint
-- The existing constraint bids_status_check rejects 'accepted'.
-- We need to drop it and recreate it with all required statuses.

ALTER TABLE bids DROP CONSTRAINT IF EXISTS bids_status_check;

ALTER TABLE bids 
ADD CONSTRAINT bids_status_check 
CHECK (status IN ('pending', 'accepted', 'rejected', 'awarded', 'withdrawn', 'open', 'active', 'closed'));
