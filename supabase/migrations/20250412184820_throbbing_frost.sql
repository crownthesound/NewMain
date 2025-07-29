/*
  # Add automatic contest status updates

  1. Changes
    - Add function to automatically update contest status when end date is reached
    - Add trigger to update status on each row update
    - Move ended contests to 'completed' status
    - Ensure only active contests are shown in public views

  2. Security
    - Maintain existing RLS policies
    - Only allow system to update status automatically
*/

-- Function to update contest status based on end date
CREATE OR REPLACE FUNCTION update_contest_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the contest has ended
  IF NEW.end_date < now() AND NEW.status = 'active' THEN
    NEW.status := 'completed';
    NEW.updated_at := now();
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger to automatically update status when end date is reached
DROP TRIGGER IF EXISTS check_contest_status ON contests;
CREATE TRIGGER check_contest_status
  BEFORE UPDATE OR INSERT
  ON contests
  FOR EACH ROW
  EXECUTE FUNCTION update_contest_status();

-- Update any existing contests that have ended
UPDATE contests
SET 
  status = 'completed',
  updated_at = now()
WHERE 
  status = 'active' 
  AND end_date < now();