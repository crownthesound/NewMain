/*
  # Add competition details to leaderboard config

  1. Changes
    - Add new columns to leaderboard_config table:
      - name (text): Competition name
      - description (text): Competition description
      - cover_image (text): URL of the cover image
      - duration_days (integer): Number of days the competition will run
      - num_winners (integer): Number of winners
      - prize_per_winner (numeric): Prize amount per winner
*/

ALTER TABLE leaderboard_config
ADD COLUMN IF NOT EXISTS name text,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS cover_image text,
ADD COLUMN IF NOT EXISTS duration_days integer DEFAULT 7,
ADD COLUMN IF NOT EXISTS num_winners integer DEFAULT 3,
ADD COLUMN IF NOT EXISTS prize_per_winner numeric DEFAULT 100.00;