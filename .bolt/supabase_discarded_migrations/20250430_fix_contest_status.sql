/*
  # Fix Contest Status with 5-minute Buffer

  This migration:
  1. Updates the contest status trigger function to add a 5-minute buffer
  2. Fixes any contests that were incorrectly marked as completed
*/

-- Update the function to use a 5-minute buffer
CREATE OR REPLACE FUNCTION update_contest_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the contest has ended with at least a 5-minute buffer
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

-- Ensure any contests that should be completed are marked as such
UPDATE contests
SET 
  status = 'completed',
  updated_at = now()
WHERE 
  status = 'active' 
  AND end_date < (now() - interval '5 minutes'); 