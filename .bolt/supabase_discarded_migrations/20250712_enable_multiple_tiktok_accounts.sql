/*
  # Enable Multiple TikTok Accounts Per User

  1. Changes
    - Remove unique constraint on user_id to allow multiple TikTok accounts per user
    - Add is_primary field to mark the primary account
    - Add account_name field for user-friendly naming
    - Keep tiktok_user_id unique to prevent same TikTok account connecting to multiple users
    - Add contest_links table support for tiktok_account_id

  2. Security
    - Maintain existing RLS policies
    - Users can only manage their own TikTok accounts
*/

-- 1. Remove the unique constraint on user_id to allow multiple TikTok accounts per user
ALTER TABLE tiktok_profiles 
DROP CONSTRAINT IF EXISTS unique_user_tiktok;

-- 2. Add new columns to support multiple accounts
ALTER TABLE tiktok_profiles 
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS account_name VARCHAR(255);

-- 3. For existing profiles, mark them as primary and set account name
UPDATE tiktok_profiles 
SET 
  is_primary = true,
  account_name = COALESCE(display_name, username, 'Primary Account')
WHERE is_primary IS NULL OR is_primary = false;

-- 4. Create function to ensure only one primary account per user
CREATE OR REPLACE FUNCTION ensure_single_primary_tiktok_account()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is being set as primary, unset all other primary accounts for this user
  IF NEW.is_primary = true THEN
    UPDATE tiktok_profiles 
    SET is_primary = false 
    WHERE user_id = NEW.user_id 
      AND id != NEW.id 
      AND is_primary = true;
  END IF;
  
  -- Ensure at least one account is primary for the user
  IF NEW.is_primary = false THEN
    -- Check if there are any other primary accounts for this user
    IF NOT EXISTS (
      SELECT 1 FROM tiktok_profiles 
      WHERE user_id = NEW.user_id 
        AND id != NEW.id 
        AND is_primary = true
    ) THEN
      -- If no other primary accounts, make this one primary
      NEW.is_primary = true;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger to enforce single primary account
DROP TRIGGER IF EXISTS ensure_primary_tiktok_account ON tiktok_profiles;
CREATE TRIGGER ensure_primary_tiktok_account
  BEFORE INSERT OR UPDATE ON tiktok_profiles
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_primary_tiktok_account();

-- 6. Add tiktok_account_id to contest_links table to track which account was used
ALTER TABLE contest_links 
ADD COLUMN IF NOT EXISTS tiktok_account_id UUID REFERENCES tiktok_profiles(id) ON DELETE SET NULL;

-- 7. If contest_links doesn't exist, create it (in case the table is still called video_links)
DO $$
BEGIN
  -- Check if contest_links exists, if not and video_links exists, rename it
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contest_links') THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'video_links') THEN
      ALTER TABLE video_links RENAME TO contest_links;
    ELSE
      -- Create contest_links table if neither exists
      CREATE TABLE contest_links (
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
        video_type text DEFAULT 'tiktok'::text CHECK (video_type IN ('tiktok', 'upload')),
        contest_id UUID REFERENCES contests(id) ON DELETE SET NULL,
        tiktok_video_id VARCHAR(255),
        is_contest_submission BOOLEAN DEFAULT false,
        submission_date TIMESTAMP WITH TIME ZONE,
        last_stats_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        tiktok_account_id UUID REFERENCES tiktok_profiles(id) ON DELETE SET NULL
      );
      
      -- Enable RLS
      ALTER TABLE contest_links ENABLE ROW LEVEL SECURITY;
      
      -- Copy existing policies if they exist on video_links
      CREATE POLICY "Organizers can manage contest links"
        ON contest_links
        FOR ALL
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'organizer'
          )
        );

      CREATE POLICY "Public users can view active contest links"
        ON contest_links
        FOR SELECT
        TO public
        USING (active = true);
    END IF;
  END IF;
END $$;

-- 8. Drop and recreate leaderboard view to include TikTok account info
DROP VIEW IF EXISTS contest_leaderboards;

CREATE VIEW contest_leaderboards AS
SELECT 
  cl.contest_id,
  cl.id as video_id,
  cl.created_by as user_id,
  p.full_name,
  p.email,
  tp.username as tiktok_username,
  tp.display_name as tiktok_display_name,
  tp.account_name as tiktok_account_name,
  tp.id as tiktok_account_id,
  cl.title as video_title,
  cl.url as video_url,
  cl.thumbnail,
  cl.views,
  cl.likes,
  cl.comments,
  cl.shares,
  cl.submission_date,
  ROW_NUMBER() OVER (PARTITION BY cl.contest_id ORDER BY cl.views DESC, cl.likes DESC, cl.submission_date ASC) as rank
FROM contest_links cl
JOIN profiles p ON cl.created_by = p.id
LEFT JOIN tiktok_profiles tp ON cl.tiktok_account_id = tp.id
WHERE cl.is_contest_submission = true 
  AND cl.contest_id IS NOT NULL
  AND cl.active = true;

-- 9. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tiktok_profiles_user_primary ON tiktok_profiles(user_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_contest_links_tiktok_account ON contest_links(tiktok_account_id);

-- 10. Create function to get user's TikTok accounts
CREATE OR REPLACE FUNCTION get_user_tiktok_accounts(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  tiktok_user_id VARCHAR(255),
  username VARCHAR(100),
  display_name VARCHAR(255),
  account_name VARCHAR(255),
  avatar_url TEXT,
  is_primary BOOLEAN,
  follower_count INTEGER,
  following_count INTEGER,
  likes_count INTEGER,
  video_count INTEGER,
  is_verified BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tp.id,
    tp.tiktok_user_id,
    tp.username,
    tp.display_name,
    tp.account_name,
    tp.avatar_url,
    tp.is_primary,
    tp.follower_count,
    tp.following_count,
    tp.likes_count,
    tp.video_count,
    tp.is_verified,
    tp.created_at
  FROM tiktok_profiles tp
  WHERE tp.user_id = user_uuid
  ORDER BY tp.is_primary DESC, tp.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- 11. Create function to set primary TikTok account
CREATE OR REPLACE FUNCTION set_primary_tiktok_account(account_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verify the account belongs to the user
  IF NOT EXISTS (
    SELECT 1 FROM tiktok_profiles 
    WHERE id = account_uuid AND user_id = user_uuid
  ) THEN
    RETURN FALSE;
  END IF;
  
  -- Update the account to be primary (trigger will handle unsetting others)
  UPDATE tiktok_profiles 
  SET is_primary = true, updated_at = NOW()
  WHERE id = account_uuid AND user_id = user_uuid;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE tiktok_profiles IS 'Stores TikTok account information. Users can have multiple TikTok accounts.';
COMMENT ON COLUMN tiktok_profiles.is_primary IS 'Indicates the primary TikTok account for the user. Only one can be primary per user.';
COMMENT ON COLUMN tiktok_profiles.account_name IS 'User-friendly name for the TikTok account to help distinguish between multiple accounts.';
COMMENT ON COLUMN contest_links.tiktok_account_id IS 'References which TikTok account was used for this contest submission.';