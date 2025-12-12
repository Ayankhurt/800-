-- Drop the dummy profiles table
-- WARNING: Only run this if you are sure no hidden functions reference it anymore.
-- If you get "relation profiles does not exist" error after running this, 
-- it means there is still a bad trigger/function in your database.

DROP TABLE IF EXISTS profiles CASCADE;
