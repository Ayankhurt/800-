-- Fix Delete Error by removing old triggers on 'jobs' table

DO $$
DECLARE
    t text;
BEGIN
    -- Loop through all triggers on the 'jobs' table
    FOR t IN
        SELECT trigger_name
        FROM information_schema.triggers
        WHERE event_object_table = 'jobs'
    LOOP
        -- Drop the trigger
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(t) || ' ON jobs CASCADE';
        RAISE NOTICE 'Dropped trigger: %', t;
    END LOOP;
END $$;
