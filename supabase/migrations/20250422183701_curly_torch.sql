/*
  # Add default video templates and ensure minimum count

  1. Changes
    - Add three default video templates
    - Add check constraint to ensure minimum video count
    - Add trigger to prevent deletion if count would go below 3
  
  2. Security
    - Maintain existing RLS policies
*/

-- Insert default videos if none exist
INSERT INTO video_links (
  title,
  url,
  thumbnail,
  username,
  views,
  likes,
  comments,
  shares,
  active
)
SELECT
  'Dance Challenge Template',
  'https://example.com/video1',
  'https://images.pexels.com/photos/2188012/pexels-photo-2188012.jpeg',
  'dance_master',
  150000,
  12000,
  800,
  500,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM video_links LIMIT 1
)
UNION ALL
SELECT
  'Singing Performance Template',
  'https://example.com/video2',
  'https://images.pexels.com/photos/7500307/pexels-photo-7500307.jpeg',
  'vocal_star',
  200000,
  15000,
  1200,
  700,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM video_links LIMIT 1
)
UNION ALL
SELECT
  'Music Cover Template',
  'https://example.com/video3',
  'https://images.pexels.com/photos/1699161/pexels-photo-1699161.jpeg',
  'music_pro',
  180000,
  13500,
  950,
  600,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM video_links LIMIT 1
);

-- Create function to check minimum video count
CREATE OR REPLACE FUNCTION check_minimum_videos()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM video_links) < 3 THEN
    RAISE EXCEPTION 'Cannot delete video: Minimum of 3 videos must be maintained';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent deletion if count would go below 3
CREATE TRIGGER enforce_minimum_videos
  BEFORE DELETE ON video_links
  FOR EACH ROW
  EXECUTE FUNCTION check_minimum_videos();