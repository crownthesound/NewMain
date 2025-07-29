/*
  # Add hidden status for contests

  1. Changes
    - Add 'hidden' as a valid status for contests
    - Update status constraint to include 'hidden'
    - Add policy to ensure only organizers can hide/unhide contests
*/

-- Update status constraint to include 'hidden'
DO $$ 
BEGIN
  -- Drop existing status constraint
  ALTER TABLE leaderboard_config DROP CONSTRAINT IF EXISTS valid_status;

  -- Add new status constraint including 'hidden'
  ALTER TABLE leaderboard_config
  ADD CONSTRAINT valid_status 
  CHECK (status IN ('draft', 'active', 'completed', 'hidden'));
END $$;