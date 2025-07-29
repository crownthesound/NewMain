/*
  # Fix Contest Status Consistency and Real-time Updates
  
  This migration fixes the contest status update issues:
  1. Ensures contest status enum uses correct values: 'draft', 'active', 'ended', 'archived'
  2. Fixes trigger function to use 'ended' instead of 'completed'
  3. Updates any incorrectly set status values
  4. Ensures real-time status updates when end_date is edited to past dates
*/

-- 1. First, drop the old check constraint that might be causing issues
ALTER TABLE contests DROP CONSTRAINT IF EXISTS valid_status;

-- 2. Clean up any incorrect status values that might exist
-- Convert any 'completed' status to 'ended' (if they exist as strings)
UPDATE contests 
SET status = 'ended'::contest_status, updated_at = now()
WHERE status::text = 'completed';

-- Convert any 'hidden' status to 'archived' (if they exist)
UPDATE contests 
SET status = 'archived'::contest_status, updated_at = now()
WHERE status::text = 'hidden';

-- 3. Temporarily disable the problematic trigger that calls freeze_contest_winners
DROP TRIGGER IF EXISTS trg_contest_completed ON contests;

-- 3a. Recreate the contest status update function with correct enum values
CREATE OR REPLACE FUNCTION update_contest_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the contest has ended (with 1-minute buffer for real-time feel)
  IF NEW.end_date < (now() - interval '1 minute') AND NEW.status = 'active' THEN
    NEW.status := 'ended'::contest_status;
    NEW.updated_at := now();
  END IF;

  RETURN NEW;
END;
$$;

-- 4. Ensure the trigger exists and is properly configured
DROP TRIGGER IF EXISTS check_contest_status ON contests;
CREATE TRIGGER check_contest_status
  BEFORE UPDATE OR INSERT
  ON contests
  FOR EACH ROW
  EXECUTE FUNCTION update_contest_status();

-- 5. Update any existing contests that should be ended
UPDATE contests
SET 
  status = 'ended'::contest_status,
  updated_at = now()
WHERE 
  status = 'active'::contest_status 
  AND end_date < (now() - interval '1 minute');

-- 6. Add a function to manually check and update contest statuses (for periodic cleanup)
CREATE OR REPLACE FUNCTION cleanup_contest_statuses()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Update active contests that have ended
  UPDATE contests
  SET 
    status = 'ended'::contest_status,
    updated_at = now()
  WHERE 
    status = 'active'::contest_status 
    AND end_date < now();
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count;
END;
$$;

-- 7. Fix the freeze_contest_winners function with correct JSON access syntax
CREATE OR REPLACE FUNCTION freeze_contest_winners(p_contest_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  win_count INTEGER;
  admin_id UUID;
BEGIN
  -- Get the number of winners for this contest
  SELECT num_winners INTO win_count FROM contests WHERE id = p_contest_id;
  
  -- Get an admin ID for created_by field
  SELECT id INTO admin_id FROM profiles WHERE role = 'admin' LIMIT 1;
  
  -- If no admin found, use the contest creator
  IF admin_id IS NULL THEN
    SELECT created_by INTO admin_id FROM contests WHERE id = p_contest_id;
  END IF;
  
  -- Insert winners from the leaderboard
  INSERT INTO contest_winners 
    (contest_id, user_id, video_id, position, prize_amount, prize_title, created_by)
  SELECT 
    cl.contest_id,
    cl.user_id,
    cl.video_id,
    cl.rank AS position,
    CASE 
      WHEN c.prize_per_winner IS NOT NULL THEN 
        ROUND((c.prize_per_winner * (1 - (cl.rank-1)*0.2))::numeric, 2)
      ELSE NULL
    END AS prize_amount,
    CASE
      WHEN c.prize_titles IS NOT NULL AND 
           jsonb_array_length(c.prize_titles::jsonb) >= cl.rank THEN
        -- Fixed JSON access: use jsonb_array_element to get array element, then extract title
        (jsonb_array_element(c.prize_titles::jsonb, (cl.rank-1)::integer) ->> 'title')::VARCHAR
      ELSE
        CASE 
          WHEN cl.rank = 1 THEN 'First Place'
          WHEN cl.rank = 2 THEN 'Second Place'
          WHEN cl.rank = 3 THEN 'Third Place'
          ELSE 'Winner'
        END
    END AS prize_title,
    admin_id AS created_by
  FROM contest_leaderboards cl
  JOIN contests c ON c.id = cl.contest_id
  WHERE cl.contest_id = p_contest_id
  ORDER BY cl.rank
  LIMIT win_count
  ON CONFLICT (contest_id, position) DO NOTHING;
END;
$$;

-- 7a. Recreate the trigger function to use the fixed freeze_contest_winners
CREATE OR REPLACE FUNCTION trg_on_contest_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only run when status changes to 'ended'
  IF (TG_OP = 'UPDATE') AND
     (OLD.status::text != 'ended' AND NEW.status::text = 'ended') THEN
    -- Freeze the winners
    PERFORM freeze_contest_winners(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- 7b. Recreate the trigger
CREATE TRIGGER trg_contest_completed
  AFTER UPDATE OF status ON contests
  FOR EACH ROW
  EXECUTE FUNCTION trg_on_contest_completed();

-- 8. Create a comment to document the correct status values
COMMENT ON TYPE contest_status IS 'Contest status values: draft (not yet active), active (currently running), ended (past end date), archived (manually archived)';