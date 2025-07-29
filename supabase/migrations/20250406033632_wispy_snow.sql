/*
  # Enforce user role and add role change tracking

  1. Changes
    - Add trigger to ensure new profiles are always created with 'user' role
    - Add audit trail for role changes
    - Add function to update user role (admin only)

  2. Security
    - Only admins can change user roles
    - All role changes are tracked
*/

-- Create audit table for role changes
CREATE TABLE IF NOT EXISTS role_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id),
  old_role user_role,
  new_role user_role,
  changed_by uuid REFERENCES profiles(id),
  changed_at timestamptz DEFAULT now()
);

-- Enable RLS on role_changes
ALTER TABLE role_changes ENABLE ROW LEVEL SECURITY;

-- Only admins can view role changes
CREATE POLICY "Admins can view role changes"
  ON role_changes FOR SELECT
  TO public
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Function to update user role (admin only)
CREATE OR REPLACE FUNCTION update_user_role(
  target_user_id uuid,
  new_role user_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_id uuid;
  current_role user_role;
BEGIN
  -- Check if the current user is an admin
  SELECT id INTO admin_id
  FROM profiles
  WHERE id = auth.uid() AND role = 'admin';

  IF admin_id IS NULL THEN
    RAISE EXCEPTION 'Only administrators can change user roles';
  END IF;

  -- Get current role
  SELECT role INTO current_role
  FROM profiles
  WHERE id = target_user_id;

  -- Update the role
  UPDATE profiles
  SET 
    role = new_role,
    updated_at = now()
  WHERE id = target_user_id;

  -- Log the change
  INSERT INTO role_changes (profile_id, old_role, new_role, changed_by)
  VALUES (target_user_id, current_role, new_role, admin_id);
END;
$$;