/*
  # Add public access policy for active contests

  1. Changes
    - Add policy to allow public (unauthenticated) access to active contests
    - Ensure only active and completed contests are visible publicly
    - Maintain existing policies for authenticated users

  2. Security
    - Public users can only view active and completed contests
    - No modification access for public users
    - Maintains existing RLS policies for authenticated users
*/

-- Add policy for public access to active contests
CREATE POLICY "Public users can view active contests"
  ON leaderboard_config
  FOR SELECT
  TO public
  USING (
    status IN ('active', 'completed')
  );