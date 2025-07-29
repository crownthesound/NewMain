/*
  # Initial Schema Setup

  1. Tables
    - profiles: Basic user profiles with authentication integration
      - id: UUID (primary key, linked to auth.users)
      - email: Text
      - full_name: Text
      - role: Enum ('user', 'admin')
      - created_at: Timestamp with timezone
      - updated_at: Timestamp with timezone

  2. Security
    - Enable RLS on profiles table
    - Add policies for:
      - Read access for all users
      - Insert access for signup
      - Update access for own profile
      - Delete access for self and admins
*/

-- Drop all existing tables with CASCADE to handle dependencies
DROP TABLE IF EXISTS rsvps CASCADE;
DROP TABLE IF EXISTS event_hosts CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop existing types with CASCADE
DROP TYPE IF EXISTS rsvp_status CASCADE;
DROP TYPE IF EXISTS event_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Create user_role ENUM
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text,
  full_name text,
  role user_role DEFAULT 'user'::user_role,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Enable read access for all users"
  ON profiles FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable insert for signup"
  ON profiles FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Enable update for users based on id"
  ON profiles FOR UPDATE
  TO public
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable delete for admins and self"
  ON profiles FOR DELETE
  TO public
  USING ((auth.uid() = id) OR (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  ));