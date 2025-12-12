-- Create Admin User for Admin Panel
-- Execute this in Supabase SQL Editor

-- Step 1: Create auth user and user profile
DO $$
DECLARE
  new_user_id UUID;
  user_email TEXT := 'admin@bidroom.com';
  user_password TEXT := 'Admin@123';
BEGIN
  -- Check if user already exists
  SELECT id INTO new_user_id FROM auth.users WHERE email = user_email;
  
  IF new_user_id IS NULL THEN
    -- Create new auth user
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      user_email,
      crypt(user_password, gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object(
        'first_name', 'Admin',
        'last_name', 'User',
        'role', 'admin'
      ),
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    ) RETURNING id INTO new_user_id;

    RAISE NOTICE 'Created auth user with ID: %', new_user_id;

    -- Wait for trigger to create user profile
    PERFORM pg_sleep(1);

    -- Check if user profile was created by trigger
    IF EXISTS (SELECT 1 FROM users WHERE id = new_user_id) THEN
      -- Update user profile to admin role
      UPDATE users 
      SET 
        role = 'admin'::user_role,
        is_active = true,
        verification_status = 'verified'::verification_status
      WHERE id = new_user_id;
      
      RAISE NOTICE 'Updated user profile to admin role';
    ELSE
      -- Trigger didn't create profile, create manually
      INSERT INTO users (
        id,
        email,
        first_name,
        last_name,
        role,
        is_active,
        verification_status
      ) VALUES (
        new_user_id,
        user_email,
        'Admin',
        'User',
        'admin'::user_role,
        true,
        'verified'::verification_status
      );
      
      RAISE NOTICE 'Manually created user profile';
    END IF;

    RAISE NOTICE '✅ Admin user created successfully!';
    RAISE NOTICE 'Email: %', user_email;
    RAISE NOTICE 'Password: %', user_password;
    RAISE NOTICE 'User ID: %', new_user_id;
  ELSE
    -- User exists, just update to admin
    UPDATE users 
    SET 
      role = 'admin'::user_role,
      is_active = true,
      verification_status = 'verified'::verification_status
    WHERE id = new_user_id;
    
    RAISE NOTICE '✅ Existing user updated to admin role';
    RAISE NOTICE 'Email: %', user_email;
    RAISE NOTICE 'User ID: %', new_user_id;
  END IF;
END $$;

-- Verify the admin user was created
SELECT 
  id,
  email,
  first_name,
  last_name,
  role,
  is_active,
  verification_status,
  created_at
FROM users 
WHERE email = 'admin@bidroom.com';
