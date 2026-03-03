ALTER TABLE comments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'flagged', 'removed'));
ALTER TABLE comments ADD COLUMN IF NOT EXISTS waveform JSONB;

CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  confession_id UUID REFERENCES confessions(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view reports" ON reports;
CREATE POLICY "Admins can view reports" ON reports FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "Authenticated users can report" ON reports;
CREATE POLICY "Authenticated users can report" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Update existing RLS to allow admins to see non-active content
DROP POLICY IF EXISTS "Public confessions are viewable by everyone" ON confessions;
CREATE POLICY "Public confessions are viewable by everyone" ON confessions FOR SELECT USING (status = 'active' OR (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)));

DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
CREATE POLICY "Comments are viewable by everyone" ON comments FOR SELECT USING (status = 'active' OR (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)));