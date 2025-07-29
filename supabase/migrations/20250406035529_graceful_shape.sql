/*
  # Create leaderboard configuration table

  1. New Tables
    - `leaderboard_config`
      - `id` (uuid, primary key)
      - `base_points` (integer)
      - `bonus_multiplier` (decimal)
      - `last_reset` (timestamp)
      - `created_by` (uuid, references profiles)
      - `updated_at` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `leaderboard_config` table
    - Add policies for organizers to manage configuration
    - Add policy for all authenticated users to read configuration
*/

CREATE TABLE IF NOT EXISTS leaderboard_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base_points integer NOT NULL DEFAULT 10,
  bonus_multiplier decimal NOT NULL DEFAULT 1.0,
  last_reset timestamptz,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE leaderboard_config ENABLE ROW LEVEL SECURITY;

-- Allow organizers to manage configuration
CREATE POLICY "Organizers can manage leaderboard config"
  ON leaderboard_config
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'organizer'
    )
  );

-- Allow all users to read configuration
CREATE POLICY "All users can read leaderboard config"
  ON leaderboard_config
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert default configuration
INSERT INTO leaderboard_config (base_points, bonus_multiplier)
VALUES (10, 1.0)
ON CONFLICT DO NOTHING;