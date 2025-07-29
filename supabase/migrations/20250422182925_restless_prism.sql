/*
  # Add video links table for carousel

  1. New Tables
    - `video_links`
      - `id` (uuid, primary key)
      - `title` (text): Video title
      - `url` (text): Video URL
      - `thumbnail` (text): Thumbnail image URL
      - `username` (text): Creator's username
      - `views` (integer): View count
      - `likes` (integer): Like count
      - `comments` (integer): Comment count
      - `shares` (integer): Share count
      - `active` (boolean): Whether to show in carousel
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `created_by` (uuid): References profiles(id)

  2. Security
    - Enable RLS
    - Only organizers can manage videos
    - Public users can view active videos
*/

-- Create video_links table
CREATE TABLE IF NOT EXISTS video_links (
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
  created_by uuid REFERENCES profiles(id)
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

-- Add function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to automatically update updated_at
CREATE TRIGGER update_video_links_updated_at
  BEFORE UPDATE ON video_links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();