/*
  # Add TikTok tracking fields to leaderboard config

  1. Changes
    - Add tracking JSONB column to leaderboard_config table
    - Column will store TikTok pixel code, conversion ID, and click ID
    - Add validation for tracking data structure

  2. Security
    - Maintain existing RLS policies
*/

ALTER TABLE leaderboard_config
ADD COLUMN IF NOT EXISTS tracking JSONB DEFAULT NULL;

-- Add check constraint to validate tracking JSON structure
ALTER TABLE leaderboard_config
ADD CONSTRAINT valid_tracking_format
CHECK (
  tracking IS NULL OR (
    tracking ? 'pixelCode' AND
    tracking ? 'conversionId' AND
    tracking ? 'clickId'
  )
);

COMMENT ON COLUMN leaderboard_config.tracking IS 'Stores TikTok tracking information including pixel code, conversion ID, and click ID';