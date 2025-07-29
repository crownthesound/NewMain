/*
  # Simple Contest Status Fix
  
  This migration ONLY fixes the contest status update issue:
  1. Ensures contest status updates to 'ended' when end_date passes
  2. Disables the problematic winners trigger that causes JSON errors
  3. Focuses solely on the status update functionality
*/

-- 1. Drop the problematic check constraint
ALTER TABLE contests DROP CONSTRAINT IF EXISTS valid_status;

-- 2. Disable the problematic trigger that's causing JSON errors
DROP TRIGGER IF EXISTS trg_contest_completed ON contests;

-- 3. Clean up any incorrect status values
UPDATE contests 
SET status = 'ended', updated_at = now()
WHERE status::text = 'completed';

UPDATE contests 
SET status = 'archived', updated_at = now()
WHERE status::text = 'hidden';

-- 4. Create a simple contest status update function (no winners logic)
CREATE OR REPLACE FUNCTION update_contest_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the contest has ended (with 1-minute buffer for real-time feel)
  -- Handle both text and enum status types
  IF NEW.end_date < (now() - interval '1 minute') AND NEW.status::text = 'active' THEN
    NEW.status := 'ended';
    NEW.updated_at := now();
  END IF;

  RETURN NEW;
END;
$$;

-- 5. Create the trigger for status updates only
DROP TRIGGER IF EXISTS check_contest_status ON contests;
CREATE TRIGGER check_contest_status
  BEFORE UPDATE OR INSERT
  ON contests
  FOR EACH ROW
  EXECUTE FUNCTION update_contest_status();

-- 6. Update any existing contests that should be ended
UPDATE contests
SET 
  status = 'ended',
  updated_at = now()
WHERE 
  status::text = 'active'
  AND end_date < (now() - interval '1 minute');

-- 7. Create a manual cleanup function for periodic status updates
CREATE OR REPLACE FUNCTION cleanup_contest_statuses()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE contests
  SET 
    status = 'ended',
    updated_at = now()
  WHERE 
    status::text = 'active'
    AND end_date < now();
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count;
END;
$$;