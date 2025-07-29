/*
  # Add videos storage bucket

  1. Storage Configuration
    - Creates 'videos' bucket for storing uploaded videos
    - Sets bucket to public for easy access
    - Configures file size limits and allowed MIME types
  
  2. Security Policies
    - Enables organizers to upload videos
    - Allows public access to view videos
    - Restricts file management to organizers
*/

-- Create the storage bucket
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
        'videos',
        'videos',
        true,
        524288000, -- 500MB in bytes
        ARRAY[
          'video/mp4',
          'video/webm',
          'video/ogg'
        ]
    )
    ON CONFLICT (id) DO NOTHING;
END $$;

-- Policy to allow organizers to upload files
DO $$
BEGIN
    DROP POLICY IF EXISTS "Organizers can upload videos" ON storage.objects;
    CREATE POLICY "Organizers can upload videos"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'videos'
        AND EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'organizer'
        )
    );
END $$;

-- Policy to allow public access to view files
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public users can view videos" ON storage.objects;
    CREATE POLICY "Public users can view videos"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'videos');
END $$;

-- Policy to allow organizers to update their videos
DO $$
BEGIN
    DROP POLICY IF EXISTS "Organizers can update videos" ON storage.objects;
    CREATE POLICY "Organizers can update videos"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'videos'
        AND EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'organizer'
        )
    )
    WITH CHECK (bucket_id = 'videos');
END $$;

-- Policy to allow organizers to delete their videos
DO $$
BEGIN
    DROP POLICY IF EXISTS "Organizers can delete videos" ON storage.objects;
    CREATE POLICY "Organizers can delete videos"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'videos'
        AND EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'organizer'
        )
    );
END $$;