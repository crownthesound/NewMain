/*
  # Fix public access to leaderboard contests

  1. Changes
    - Add policy for public access to active and completed contests
    - Ensure public users can view contest details without authentication

  2. Security
    - Only allow access to active and completed contests
    - Maintain existing RLS policies
*/

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Public users can view active contests" ON leaderboard_config;

-- Create new policy for public access
CREATE POLICY "Public users can view active contests"
  ON leaderboard_config
  FOR SELECT
  TO public
  USING (
    status IN ('active', 'completed')
  );