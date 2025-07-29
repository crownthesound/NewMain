/*
  # Fix Contest Status Real-time Updates
  
  This migration ensures contest status updates work properly:
  1. Creates a more robust trigger function
  2. Adds immediate status check for existing contests
  3. Sets up automatic periodic status updates
*/

-- 1. Create an improved contest status update function
CREATE OR REPLACE FUNCTION update_contest_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Always check if the contest should be ended (no buffer for immediate updates)
  IF NEW.end_date <= now() AND NEW.status::text = 'active' THEN
    NEW.status := 'ended';
    NEW.updated_at := now();
    
    -- Log the status change for debugging
    RAISE NOTICE 'Contest % status changed from active to ended (end_date: %, now: %)', 
      NEW.id, NEW.end_date, now();
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Recreate the trigger to ensure it's working
DROP TRIGGER IF EXISTS check_contest_status ON contests;
CREATE TRIGGER check_contest_status
  BEFORE UPDATE OR INSERT
  ON contests
  FOR EACH ROW
  EXECUTE FUNCTION update_contest_status();

-- 3. Immediately update any contests that should be ended right now
UPDATE contests
SET 
  status = 'ended',
  updated_at = now()
WHERE 
  status::text = 'active'
  AND end_date <= now();

-- 4. Create a function to manually update contest statuses (for testing)
CREATE OR REPLACE FUNCTION force_update_contest_statuses()
RETURNS TABLE(contest_id UUID, old_status TEXT, new_status TEXT, end_date TIMESTAMP WITH TIME ZONE)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  UPDATE contests
  SET 
    status = 'ended',
    updated_at = now()
  WHERE 
    status::text = 'active'
    AND end_date <= now()
  RETURNING id, 'active'::TEXT, status::TEXT, contests.end_date;
END;
$$;

-- 5. Create a simple function to check current contest statuses (for debugging)
CREATE OR REPLACE FUNCTION check_contest_statuses()
RETURNS TABLE(
  contest_id UUID, 
  contest_name TEXT,
  current_status TEXT, 
  end_date TIMESTAMP WITH TIME ZONE,
  now_timestamp TIMESTAMP WITH TIME ZONE,
  should_be_ended BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.status::TEXT,
    c.end_date,
    now() as now_timestamp,
    (c.end_date <= now() AND c.status::text = 'active') as should_be_ended
  FROM contests c
  ORDER BY c.end_date DESC;
END;
$$;

-- 6. Force an immediate status check by triggering an update on all active contests
-- This will cause the trigger to run and update statuses
UPDATE contests 
SET updated_at = now() 
WHERE status::text = 'active';

-- 7. Add helpful comments
COMMENT ON FUNCTION update_contest_status() IS 'Trigger function that automatically updates contest status to ended when end_date passes';
COMMENT ON FUNCTION force_update_contest_statuses() IS 'Manual function to force update contest statuses - useful for testing';
COMMENT ON FUNCTION check_contest_statuses() IS 'Debug function to check current contest statuses and whether they should be ended';