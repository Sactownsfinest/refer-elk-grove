-- Members table (extends auth.users)
CREATE TABLE IF NOT EXISTS members (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  business_name TEXT,
  category TEXT,
  phone TEXT,
  address TEXT,
  bio TEXT,
  photo_url TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  linkedin_url TEXT,
  nextdoor_url TEXT,
  google_review_url TEXT,
  website_url TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activity posts
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('message', 'shoutout', 'referral', 'close')),
  to_member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  content TEXT,
  client_name TEXT,
  amount NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS posts_author_idx ON posts(author_id);
CREATE INDEX IF NOT EXISTS posts_to_member_idx ON posts(to_member_id);
CREATE INDEX IF NOT EXISTS posts_created_idx ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS posts_type_idx ON posts(type);
CREATE INDEX IF NOT EXISTS announcements_pinned_idx ON announcements(is_pinned, created_at DESC);

-- Enable realtime for posts
ALTER PUBLICATION supabase_realtime ADD TABLE posts;

-- ========== ROW LEVEL SECURITY ==========

ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Members policies
CREATE POLICY "Active members can view active members"
  ON members FOR SELECT
  USING (
    status = 'active'
    AND EXISTS (
      SELECT 1 FROM members m WHERE m.id = auth.uid() AND m.status = 'active'
    )
  );

CREATE POLICY "Members can view own record"
  ON members FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Members can update own record"
  ON members FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT role FROM members WHERE id = auth.uid())  -- can't change own role
    AND status = (SELECT status FROM members WHERE id = auth.uid())  -- can't change own status
  );

CREATE POLICY "Admins can view all members"
  ON members FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM members m WHERE m.id = auth.uid() AND m.role = 'admin')
  );

CREATE POLICY "Admins can update any member"
  ON members FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM members m WHERE m.id = auth.uid() AND m.role = 'admin')
  );

CREATE POLICY "Service role can insert members"
  ON members FOR INSERT
  WITH CHECK (TRUE);

-- Posts policies
CREATE POLICY "Active members can view posts"
  ON posts FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM members m WHERE m.id = auth.uid() AND m.status = 'active')
  );

CREATE POLICY "Active members can insert posts"
  ON posts FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (SELECT 1 FROM members m WHERE m.id = auth.uid() AND m.status = 'active')
  );

CREATE POLICY "Members can delete own posts"
  ON posts FOR DELETE
  USING (
    author_id = auth.uid()
    OR EXISTS (SELECT 1 FROM members m WHERE m.id = auth.uid() AND m.role = 'admin')
  );

-- Announcements policies
CREATE POLICY "Active members can view announcements"
  ON announcements FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM members m WHERE m.id = auth.uid() AND m.status = 'active')
  );

CREATE POLICY "Admins can manage announcements"
  ON announcements FOR ALL
  USING (
    EXISTS (SELECT 1 FROM members m WHERE m.id = auth.uid() AND m.role = 'admin')
  );

-- ========== STORAGE ==========

-- Create avatars bucket (run this in Supabase dashboard Storage section)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Active members can upload avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND EXISTS (SELECT 1 FROM members m WHERE m.id = auth.uid() AND m.status IN ('active', 'pending'))
  );

CREATE POLICY "Members can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND owner = auth.uid()
  );

CREATE POLICY "Members can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND owner = auth.uid()
  );
