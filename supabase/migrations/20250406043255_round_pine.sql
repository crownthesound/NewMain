/*
  # Create storage bucket for leaderboard images

  1. Storage Configuration
    - Creates 'leaderboard-images' bucket for storing contest cover images
    - Sets bucket to public for easy access to images
    - Configures file size limits and allowed MIME types
  
  2. Security Policies
    - Enables authenticated users to upload images
    - Allows public access to view images
    - Restricts file management to file owners
*/

-- Create the storage bucket
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
        'leaderboard-images',
        'leaderboard-images',
        true,
        5242880, -- 5MB in bytes
        ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    )
    ON CONFLICT (id) DO NOTHING;
END $$;

-- Policy to allow authenticated users to upload files
DO $$
BEGIN
    DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
    CREATE POLICY "Authenticated users can upload images"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'leaderboard-images'
        AND owner = auth.uid()
    );
END $$;

-- Policy to allow public access to view files
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public users can view images" ON storage.objects;
    CREATE POLICY "Public users can view images"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'leaderboard-images');
END $$;

-- Policy to allow users to update their own files
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
    CREATE POLICY "Users can update own images"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'leaderboard-images' AND owner = auth.uid())
    WITH CHECK (bucket_id = 'leaderboard-images' AND owner = auth.uid());
END $$;

-- Policy to allow users to delete their own files
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;
    CREATE POLICY "Users can delete own images"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'leaderboard-images' AND owner = auth.uid());
END $$;