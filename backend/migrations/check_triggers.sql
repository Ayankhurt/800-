-- Check all triggers on auth.users
SELECT 
    tgname as trigger_name,
    tgtype,
    tgenabled,
    pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
AND tgname NOT LIKE 'RI_ConstraintTrigger%'
AND tgname NOT LIKE 'pg_%'
ORDER BY tgname;
