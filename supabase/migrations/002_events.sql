CREATE TABLE IF NOT EXISTS events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   UUID        REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  title       TEXT        NOT NULL,
  description TEXT,
  start_time  TIMESTAMPTZ NOT NULL,
  all_day     BOOLEAN     NOT NULL DEFAULT FALSE,
  location    TEXT,
  url         TEXT,
  source      TEXT        NOT NULL DEFAULT 'group' CHECK (source IN ('group', 'chamber')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS events_start_time_idx ON events(start_time ASC);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active members can view events"
  ON events FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM members m WHERE m.id = auth.uid() AND m.status = 'active')
  );

CREATE POLICY "Active members can insert events"
  ON events FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (SELECT 1 FROM members m WHERE m.id = auth.uid() AND m.status = 'active')
  );

CREATE POLICY "Members can delete own events or admins can delete any"
  ON events FOR DELETE
  USING (
    author_id = auth.uid()
    OR EXISTS (SELECT 1 FROM members m WHERE m.id = auth.uid() AND m.role = 'admin')
  );
