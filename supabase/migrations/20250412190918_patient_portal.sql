/*
  # Fix public access to contests

  1. Changes
    - Drop existing policy that allows public access to both active and completed contests
    - Create new policy that only allows public access to active contests
    - Completed contests will require authentication

  2. Security
    - Public users can only view active contests
    - Completed contests require authentication
    - Maintains existing RLS policies for authenticated users
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Public users can view active contests" ON leaderboard_config;

-- Create new policy for public access (active contests only)
CREATE POLICY "Public users can view active contests"
  ON leaderboard_config
  FOR SELECT
  TO public
  USING (
    status = 'active'
  );