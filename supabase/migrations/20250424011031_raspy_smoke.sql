/*
  # Fix admin page loading issues

  1. Changes
    - Drop and recreate video_links table with proper schema
    - Set up storage buckets with correct permissions
    - Add proper constraints and defaults
    - Fix RLS policies
    - Add default videos

  2. Security
    - Maintain existing RLS policies
    - Add proper storage access controls
*/

-- Drop and recreate video_links table
DROP TABLE IF EXISTS video_links CASCADE;

CREATE TABLE video_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  url text NOT NULL,
  thumbnail text NOT NULL,
  username text NOT NULL,
  views integer DEFAULT 0,
  likes integer DEFAULT 0,
  comments integer DEFAULT 0,
  shares integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id),
  embed_code text,
  video_url text,
  duration integer,
  size bigint,
  video_type text DEFAULT 'tiktok'::text CHECK (video_type IN ('tiktok', 'upload'))
);

-- Enable RLS
ALTER TABLE video_links ENABLE ROW LEVEL SECURITY;

-- Allow organizers to manage videos
CREATE POLICY "Organizers can manage video links"
  ON video_links
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'organizer'
    )
  );

-- Allow public to view active videos
CREATE POLICY "Public users can view active videos"
  ON video_links
  FOR SELECT
  TO public
  USING (active = true);

-- Create storage buckets
DO $$
BEGIN
    -- Videos bucket
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
        'videos',
        'videos',
        true,
        524288000, -- 500MB
        ARRAY['video/mp4', 'video/webm', 'video/ogg']
    )
    ON CONFLICT (id) DO NOTHING;

    -- Thumbnails bucket
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
        'thumbnails',
        'thumbnails',
        true,
        5242880, -- 5MB
        ARRAY['image/jpeg', 'image/png', 'image/webp']
    )
    ON CONFLICT (id) DO NOTHING;
END $$;

-- Update storage policies
DO $$
BEGIN
    -- Videos policies
    DROP POLICY IF EXISTS "Organizers can upload videos" ON storage.objects;
    CREATE POLICY "Organizers can upload videos"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'videos'
        AND EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'organizer'
        )
    );

    DROP POLICY IF EXISTS "Public users can view videos" ON storage.objects;
    CREATE POLICY "Public users can view videos"
    ON storage.objects FOR SELECT TO public
    USING (bucket_id = 'videos');

    DROP POLICY IF EXISTS "Organizers can manage videos" ON storage.objects;
    CREATE POLICY "Organizers can manage videos"
    ON storage.objects FOR ALL TO authenticated
    USING (
        bucket_id = 'videos'
        AND EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'organizer'
        )
    )
    WITH CHECK (bucket_id = 'videos');

    -- Thumbnails policies
    DROP POLICY IF EXISTS "Organizers can upload thumbnails" ON storage.objects;
    CREATE POLICY "Organizers can upload thumbnails"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'thumbnails'
        AND EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'organizer'
        )
    );

    DROP POLICY IF EXISTS "Public users can view thumbnails" ON storage.objects;
    CREATE POLICY "Public users can view thumbnails"
    ON storage.objects FOR SELECT TO public
    USING (bucket_id = 'thumbnails');

    DROP POLICY IF EXISTS "Organizers can manage thumbnails" ON storage.objects;
    CREATE POLICY "Organizers can manage thumbnails"
    ON storage.objects FOR ALL TO authenticated
    USING (
        bucket_id = 'thumbnails'
        AND EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'organizer'
        )
    )
    WITH CHECK (bucket_id = 'thumbnails');
END $$;

-- Insert default videos
INSERT INTO video_links (
  title,
  url,
  thumbnail,
  username,
  views,
  likes,
  comments,
  shares,
  active,
  video_type
)
VALUES
  (
    'Dance Challenge Template',
    'https://example.com/video1',
    'https://images.pexels.com/photos/2188012/pexels-photo-2188012.jpeg',
    'dance_master',
    150000,
    12000,
    800,
    500,
    true,
    'tiktok'
  ),
  (
    'Singing Performance Template',
    'https://example.com/video2',
    'https://images.pexels.com/photos/7500307/pexels-photo-7500307.jpeg',
    'vocal_star',
    200000,
    15000,
    1200,
    700,
    true,
    'tiktok'
  ),
  (
    'Music Cover Template',
    'https://example.com/video3',
    'https://images.pexels.com/photos/1699161/pexels-photo-1699161.jpeg',
    'music_pro',
    180000,
    13500,
    950,
    600,
    true,
    'tiktok'
  )
ON CONFLICT (id) DO NOTHING;