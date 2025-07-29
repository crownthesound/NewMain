/*
  # Fix video links table and storage configuration

  1. Changes
    - Add missing columns to video_links table
    - Update storage policies
    - Add proper constraints and defaults
    - Fix thumbnail handling

  2. Security
    - Maintain existing RLS policies
    - Add proper storage access controls
*/

-- Drop existing video_type constraint if it exists
ALTER TABLE video_links DROP CONSTRAINT IF EXISTS valid_video_type;

-- Update video_links table
ALTER TABLE video_links
ADD COLUMN IF NOT EXISTS embed_code text,
ADD COLUMN IF NOT EXISTS video_url text,
ADD COLUMN IF NOT EXISTS duration integer,
ADD COLUMN IF NOT EXISTS size bigint,
ADD COLUMN IF NOT EXISTS video_type text DEFAULT 'tiktok'::text;

-- Add check constraint for video_type
ALTER TABLE video_links
ADD CONSTRAINT valid_video_type
CHECK (video_type IN ('tiktok', 'upload'));

-- Add comment explaining video_type
COMMENT ON COLUMN video_links.video_type IS 'Type of video: tiktok or upload';

-- Create storage buckets if they don't exist
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