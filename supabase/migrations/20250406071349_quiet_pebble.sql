/*
  # Update contest status options

  1. Changes
    - Remove 'pending_approval' status option
    - Add check constraint for valid status values
*/

-- Add check constraint for status values
DO $$ 
BEGIN
  -- First, update any existing 'pending_approval' status to 'draft'
  UPDATE leaderboard_config
  SET status = 'draft'
  WHERE status = 'pending_approval';

  -- Drop existing status constraint if it exists
  ALTER TABLE leaderboard_config DROP CONSTRAINT IF EXISTS valid_status;

  -- Add new status constraint
  ALTER TABLE leaderboard_config
  ADD CONSTRAINT valid_status 
  CHECK (status IN ('draft', 'active', 'completed'));
END $$;