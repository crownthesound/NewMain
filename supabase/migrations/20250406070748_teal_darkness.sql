/*
  # Update prize tier values and constraints

  1. Changes
    - Set default value for prize_tier column
    - Update existing values to new naming scheme
    - Update constraint for new prize tier values
  
  2. Security
    - Maintain existing RLS policies
*/

-- First, set a default value for the prize_tier column
ALTER TABLE leaderboard_config 
ALTER COLUMN prize_tier SET DEFAULT 'non-monetary';

-- Drop existing constraint if it exists
ALTER TABLE leaderboard_config DROP CONSTRAINT IF EXISTS valid_prize_tier;

-- Update existing values to new naming scheme
UPDATE leaderboard_config
SET prize_tier = CASE 
  WHEN prize_tier = 'gold' THEN 'non-monetary'
  WHEN prize_tier = 'diamond' THEN 'monetary'
  WHEN prize_tier IS NULL THEN 'non-monetary'
  ELSE prize_tier
END;

-- Add the new constraint
ALTER TABLE leaderboard_config
ADD CONSTRAINT valid_prize_tier 
CHECK (prize_tier IN ('non-monetary', 'monetary'));