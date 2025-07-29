/*
  # Add thumbnail storage configuration

  1. Changes
    - Create thumbnails storage bucket
    - Add policies for thumbnail management
    - Set proper file size limits and MIME types
    - Enable public access for thumbnails

  2. Security
    - Only organizers can upload thumbnails
    - Public can view thumbnails
    - Proper file type restrictions
*/

-- Create the thumbnails storage bucket
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
        'thumbnails',
        'thumbnails',
        true,
        5242880, -- 5MB in bytes
        ARRAY[
          'image/jpeg',
          'image/png',
          'image/webp'
        ]
    )
    ON CONFLICT (id) DO NOTHING;
END $$;

-- Policy to allow organizers to upload thumbnails
DO $$
BEGIN
    DROP POLICY IF EXISTS "Organizers can upload thumbnails" ON storage.objects;
    CREATE POLICY "Organizers can upload thumbnails"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'thumbnails'
        AND EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'organizer'
        )
    );
END $$;

-- Policy to allow public access to view thumbnails
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public users can view thumbnails" ON storage.objects;
    CREATE POLICY "Public users can view thumbnails"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'thumbnails');
END $$;

-- Policy to allow organizers to update thumbnails
DO $$
BEGIN
    DROP POLICY IF EXISTS "Organizers can update thumbnails" ON storage.objects;
    CREATE POLICY "Organizers can update thumbnails"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'thumbnails'
        AND EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'organizer'
        )
    )
    WITH CHECK (bucket_id = 'thumbnails');
END $$;

-- Policy to allow organizers to delete thumbnails
DO $$
BEGIN
    DROP POLICY IF EXISTS "Organizers can delete thumbnails" ON storage.objects;
    CREATE POLICY "Organizers can delete thumbnails"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'thumbnails'
        AND EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'organizer'
        )
    );
END $$;