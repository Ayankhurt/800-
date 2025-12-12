-- 1. Clean up orphaned disputes
DELETE FROM disputes WHERE raised_by NOT IN (SELECT id FROM users);
DELETE FROM disputes WHERE created_by NOT IN (SELECT id FROM users) AND created_by IS NOT NULL;
-- resolved_by can be null, but if set, must exist.
-- To be safe, set invalid resolved_by to NULL instead of deleting the dispute?
UPDATE disputes SET resolved_by = NULL WHERE resolved_by NOT IN (SELECT id FROM users);

-- 2. Fix Disputes FK constraints
ALTER TABLE disputes DROP CONSTRAINT IF EXISTS disputes_raised_by_fkey;
ALTER TABLE disputes ADD CONSTRAINT disputes_raised_by_fkey FOREIGN KEY (raised_by) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE disputes DROP CONSTRAINT IF EXISTS disputes_resolved_by_fkey;
ALTER TABLE disputes ADD CONSTRAINT disputes_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES users(id);

ALTER TABLE disputes DROP CONSTRAINT IF EXISTS disputes_created_by_fkey;
ALTER TABLE disputes ADD CONSTRAINT disputes_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id);
