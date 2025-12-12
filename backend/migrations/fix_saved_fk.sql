-- Clean up orphans
DELETE FROM saved_contractors WHERE contractor_id NOT IN (SELECT id FROM users);
DELETE FROM saved_contractors WHERE user_id NOT IN (SELECT id FROM users);

-- Fix FK
ALTER TABLE saved_contractors DROP CONSTRAINT IF EXISTS saved_contractors_contractor_id_fkey;
ALTER TABLE saved_contractors ADD CONSTRAINT saved_contractors_contractor_id_fkey 
    FOREIGN KEY (contractor_id) REFERENCES users(id) ON DELETE CASCADE;

-- Also check user_id FK
ALTER TABLE saved_contractors DROP CONSTRAINT IF EXISTS saved_contractors_user_id_fkey;
ALTER TABLE saved_contractors ADD CONSTRAINT saved_contractors_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
