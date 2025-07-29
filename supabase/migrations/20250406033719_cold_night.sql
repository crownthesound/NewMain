/*
  # Create Initial Admin Account

  1. Changes
    - Create a function to safely create the initial admin account
    - Function will only create admin if none exists
*/

-- Function to create initial admin account
CREATE OR REPLACE FUNCTION create_initial_admin(
  admin_email text,
  admin_full_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_admin_count integer;
  new_user_id uuid;
BEGIN
  -- Check if any admin exists
  SELECT COUNT(*) INTO existing_admin_count
  FROM profiles
  WHERE role = 'admin';

  IF existing_admin_count = 0 THEN
    -- Create auth user
    new_user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at
    )
    VALUES (
      new_user_id,
      admin_email,
      -- Password: Admin123!@#
      crypt('Admin123!@#', gen_salt('bf')),
      now(),
      now(),
      now()
    );

    -- Create profile with admin role
    INSERT INTO profiles (
      id,
      email,
      full_name,
      role,
      created_at,
      updated_at
    )
    VALUES (
      new_user_id,
      admin_email,
      admin_full_name,
      'admin',
      now(),
      now()
    );
  END IF;
END;
$$;

-- Create initial admin account
SELECT create_initial_admin(
  'admin@jointherank.com',
  'System Administrator'
);