/*
  # Fix Same-Day Contest Status

  This migration:
  1. Updates the contest status trigger function to respect exact end times
  2. Fixes any contests that were incorrectly marked as completed
  3. Adds special handling for same-day contests
*/

-- Update the function to use a 5-minute buffer and handle same-day contests properly
CREATE OR REPLACE FUNCTION update_contest_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the contest has ended with at least a 5-minute buffer
  -- This ensures we're checking the exact timestamp, not just the date
  IF NEW.end_date < (now() - interval '5 minutes') AND NEW.status = 'active' THEN
    NEW.status := 'completed';
    NEW.updated_at := now();
  END IF;

  RETURN NEW;
END;
$$;

-- Fix any contests that are incorrectly marked as completed
UPDATE contests
SET 
  status = 'active',
  updated_at = now()
WHERE 
  status = 'completed' 
  AND end_date > (now() - interval '5 minutes');

-- For same-day contests that don't have a specific time set,
-- update the end_date to be 23:59:59 of that day
UPDATE contests
SET
  end_date = (end_date::date + interval '1 day - 1 second'),
  updated_at = now()
WHERE
  end_date::date = start_date::date
  AND end_date::time = '00:00:00'::time
  AND status = 'completed'
  AND end_date::date >= CURRENT_DATE; 