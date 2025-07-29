/*
  # Fix Contest End Times

  This migration:
  1. Identifies contests where the end time was incorrectly set to 22:59:59
  2. Updates the trigger function to preserve exact end times
*/

-- Update the function to use a 5-minute buffer and preserve exact end times
CREATE OR REPLACE FUNCTION update_contest_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  status_type text;
BEGIN
  -- Check the data type of the status column
  SELECT data_type INTO status_type 
  FROM information_schema.columns 
  WHERE table_name = 'contests' AND column_name = 'status';
  
  -- Check if the contest has ended with at least a 5-minute buffer
  -- This ensures we're checking the exact timestamp, not just the date
  IF NEW.end_date < (now() - interval '5 minutes') AND NEW.status = 'active' THEN
    -- Apply different logic based on the status column type
    IF status_type = 'USER-DEFINED' THEN
      NEW.status := 'ended'::contest_status;
    ELSE
      NEW.status := 'completed';
    END IF;
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

-- Create a function to help users fix contests with incorrect end times
CREATE OR REPLACE FUNCTION fix_contest_end_times(contest_id_param UUID, new_end_time TIMESTAMP WITH TIME ZONE)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  contest_record RECORD;
BEGIN
  -- Get the contest
  SELECT * INTO contest_record FROM contests WHERE id = contest_id_param;
  
  IF NOT FOUND THEN
    RETURN 'Contest not found';
  END IF;
  
  -- Update the end time
  UPDATE contests
  SET end_date = new_end_time,
      updated_at = now()
  WHERE id = contest_id_param;
  
  RETURN 'Contest end time updated successfully';
END;
$$; 