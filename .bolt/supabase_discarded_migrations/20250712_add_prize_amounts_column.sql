/*
  # Add prize_amounts Column to Contests Table
  
  This migration adds support for individual prize amounts per rank:
  1. Adds prize_amounts JSONB column to store array of prize amounts
  2. Migrates existing prize_per_winner data to prize_amounts format
  3. Updates any functions that might reference prize amounts
*/

-- 1. Add the prize_amounts column as JSONB array
ALTER TABLE contests 
ADD COLUMN IF NOT EXISTS prize_amounts JSONB DEFAULT '[]'::jsonb;

-- 2. Migrate existing prize_per_winner data to prize_amounts format
-- This will create an array with prize_per_winner value for each winner position
DO $$
DECLARE
  contest_record RECORD;
  prize_array JSONB;
BEGIN
  FOR contest_record IN 
    SELECT id, prize_per_winner, COALESCE(num_winners, 1) as num_winners
    FROM contests 
    WHERE prize_per_winner IS NOT NULL 
      AND (prize_amounts IS NULL OR prize_amounts = '[]'::jsonb)
  LOOP
    -- Create array with prize_per_winner repeated for each winner position
    SELECT jsonb_agg(contest_record.prize_per_winner)
    INTO prize_array
    FROM generate_series(1, contest_record.num_winners);
    
    -- Update the contest with the prize array
    UPDATE contests 
    SET prize_amounts = prize_array
    WHERE id = contest_record.id;
  END LOOP;
END $$;

-- 3. For contests without prize_per_winner, set empty array
UPDATE contests 
SET prize_amounts = '[]'::jsonb
WHERE prize_amounts IS NULL;

-- 4. Add a comment to document the column
COMMENT ON COLUMN contests.prize_amounts IS 'JSONB array of prize amounts for each rank position. Index 0 = 1st place, Index 1 = 2nd place, etc.';

-- 5. Create a helper function to get prize amount for a specific rank
CREATE OR REPLACE FUNCTION get_prize_amount_for_rank(contest_prize_amounts JSONB, rank_position INTEGER)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Return the prize amount for the given rank (1-indexed)
  -- If no specific amount is set, return NULL
  IF contest_prize_amounts IS NULL OR jsonb_array_length(contest_prize_amounts) < rank_position THEN
    RETURN NULL;
  END IF;
  
  RETURN (contest_prize_amounts->>(rank_position-1))::DECIMAL(10,2);
END;
$$;