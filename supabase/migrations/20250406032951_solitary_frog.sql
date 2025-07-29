/*
  # Add organizer role to user_role enum

  1. Changes
    - Update user_role enum to include 'organizer' role
  
  2. Security
    - Existing RLS policies will apply to the new role
*/

-- Update user_role enum to include organizer
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'organizer';