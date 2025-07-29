/*
  # Add missing columns to leaderboard_config table

  1. Changes
    - Add missing columns to `leaderboard_config` table:
      - `name` (text)
      - `description` (text)
      - `cover_image` (text)
      - `start_date` (timestamptz)
      - `end_date` (timestamptz)
      - `num_winners` (integer)
      - `prize_per_winner` (numeric)
      - `prize_tier` (text)
      - `total_prize` (numeric)
      - `music_category` (text)
      - `resources` (jsonb)
      - `prize_titles` (jsonb)
      - `status` (text)

  2. Security
    - No changes to RLS policies needed
*/

DO $$ 
BEGIN
  -- Add name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leaderboard_config' AND column_name = 'name'
  ) THEN
    ALTER TABLE leaderboard_config ADD COLUMN name text;
  END IF;

  -- Add description column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leaderboard_config' AND column_name = 'description'
  ) THEN
    ALTER TABLE leaderboard_config ADD COLUMN description text;
  END IF;

  -- Add cover_image column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leaderboard_config' AND column_name = 'cover_image'
  ) THEN
    ALTER TABLE leaderboard_config ADD COLUMN cover_image text;
  END IF;

  -- Add start_date column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leaderboard_config' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE leaderboard_config ADD COLUMN start_date timestamptz;
  END IF;

  -- Add end_date column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leaderboard_config' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE leaderboard_config ADD COLUMN end_date timestamptz;
  END IF;

  -- Add num_winners column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leaderboard_config' AND column_name = 'num_winners'
  ) THEN
    ALTER TABLE leaderboard_config ADD COLUMN num_winners integer DEFAULT 3;
  END IF;

  -- Add prize_per_winner column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leaderboard_config' AND column_name = 'prize_per_winner'
  ) THEN
    ALTER TABLE leaderboard_config ADD COLUMN prize_per_winner numeric DEFAULT 100.00;
  END IF;

  -- Add prize_tier column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leaderboard_config' AND column_name = 'prize_tier'
  ) THEN
    ALTER TABLE leaderboard_config ADD COLUMN prize_tier text;
  END IF;

  -- Add total_prize column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leaderboard_config' AND column_name = 'total_prize'
  ) THEN
    ALTER TABLE leaderboard_config ADD COLUMN total_prize numeric DEFAULT 0;
  END IF;

  -- Add music_category column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leaderboard_config' AND column_name = 'music_category'
  ) THEN
    ALTER TABLE leaderboard_config ADD COLUMN music_category text;
  END IF;

  -- Add resources column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leaderboard_config' AND column_name = 'resources'
  ) THEN
    ALTER TABLE leaderboard_config ADD COLUMN resources jsonb DEFAULT '[]'::jsonb;
  END IF;

  -- Add prize_titles column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leaderboard_config' AND column_name = 'prize_titles'
  ) THEN
    ALTER TABLE leaderboard_config ADD COLUMN prize_titles jsonb DEFAULT '[]'::jsonb;
  END IF;

  -- Add status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leaderboard_config' AND column_name = 'status'
  ) THEN
    ALTER TABLE leaderboard_config ADD COLUMN status text DEFAULT 'draft';
  END IF;
END $$;