/*
  # Add contest configuration fields

  1. Changes
    - Add new columns to leaderboard_config table:
      - prize_tier (text): Bronze, Silver, Gold, or Diamond tier
      - total_prize (numeric): Total prize pool amount
      - industry (text): Contest industry category
      - regions (text[]): Array of regions where contest is available
      - status (text): Contest status (draft, pending_approval, active, etc.)
*/

ALTER TABLE leaderboard_config
ADD COLUMN IF NOT EXISTS prize_tier text,
ADD COLUMN IF NOT EXISTS total_prize numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS industry text,
ADD COLUMN IF NOT EXISTS regions text[],
ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft';

-- Add check constraint for prize tier
ALTER TABLE leaderboard_config
ADD CONSTRAINT valid_prize_tier 
CHECK (prize_tier IN ('bronze', 'silver', 'gold', 'diamond'));