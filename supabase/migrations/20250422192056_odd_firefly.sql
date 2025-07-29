-- Add embed_code column to video_links table
ALTER TABLE video_links
ADD COLUMN IF NOT EXISTS embed_code text;

-- Update existing videos with default embed code
UPDATE video_links
SET embed_code = CASE
  WHEN url LIKE '%tiktok.com%' THEN
    '<blockquote class="tiktok-embed" cite="' || url || '"><section></section></blockquote><script async src="https://www.tiktok.com/embed.js"></script>'
  ELSE
    NULL
END
WHERE embed_code IS NULL;