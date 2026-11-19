-- Reactions and replies for the feed. Safe to run more than once.

-- Replies: a reply is a 'message' post that points at the post it answers.
ALTER TABLE posts ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES posts(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS posts_parent_idx ON posts(parent_id);

-- Reactions: one row per member, per post, per emoji.
CREATE TABLE IF NOT EXISTS post_reactions (
  post_id    UUID        NOT NULL REFERENCES posts(id)   ON DELETE CASCADE,
  member_id  UUID        NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  emoji      TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, member_id, emoji)
);

ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active members can view reactions" ON post_reactions;
CREATE POLICY "Active members can view reactions"
  ON post_reactions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM members m WHERE m.id = auth.uid() AND m.status = 'active')
  );

DROP POLICY IF EXISTS "Active members can add own reactions" ON post_reactions;
CREATE POLICY "Active members can add own reactions"
  ON post_reactions FOR INSERT
  WITH CHECK (
    member_id = auth.uid()
    AND EXISTS (SELECT 1 FROM members m WHERE m.id = auth.uid() AND m.status = 'active')
  );

DROP POLICY IF EXISTS "Members can remove own reactions" ON post_reactions;
CREATE POLICY "Members can remove own reactions"
  ON post_reactions FOR DELETE
  USING (member_id = auth.uid());

-- Live updates for reactions (posts is already in the publication).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'post_reactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE post_reactions;
  END IF;
END $$;
