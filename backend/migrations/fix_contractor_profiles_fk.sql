-- 1. Clean up orphaned contractor profiles (where user no longer exists)
DELETE FROM contractor_profiles 
WHERE user_id NOT IN (SELECT id FROM users);

-- 2. Fix FK for contractor_profiles
ALTER TABLE contractor_profiles DROP CONSTRAINT IF EXISTS contractor_profiles_user_id_fkey;
ALTER TABLE contractor_profiles ADD CONSTRAINT contractor_profiles_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
