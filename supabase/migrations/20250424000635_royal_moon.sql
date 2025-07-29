/*
  # Update video_links table for direct uploads

  1. Changes
    - Add video_url column for uploaded video files
    - Add duration column for video length
    - Add size column for file size
    - Make embed_code optional
    - Add video_type column
*/

ALTER TABLE video_links
ADD COLUMN IF NOT EXISTS video_url text,
ADD COLUMN IF NOT EXISTS duration integer,
ADD COLUMN IF NOT EXISTS size bigint,
ADD COLUMN IF NOT EXISTS video_type text DEFAULT 'tiktok'::text,
ALTER COLUMN embed_code DROP NOT NULL;

-- Add check constraint for video_type
ALTER TABLE video_links
ADD CONSTRAINT valid_video_type
CHECK (video_type IN ('tiktok', 'upload'));

-- Add comment explaining video_type
COMMENT ON COLUMN video_links.video_type IS 'Type of video: tiktok or upload';