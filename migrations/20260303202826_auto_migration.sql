-- SCHEMA UPDATE FOR DASHBOARD & AI
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT FALSE;

ALTER TABLE confessions ADD COLUMN IF NOT EXISTS mood_tag TEXT;
ALTER TABLE confessions ADD COLUMN IF NOT EXISTS emotional_score JSONB DEFAULT '{"sad": 0, "hopeful": 0, "angry": 0, "lonely": 0, "neutral": 100}'::jsonb;
ALTER TABLE confessions ADD COLUMN IF NOT EXISTS ai_summary TEXT;
ALTER TABLE confessions ADD COLUMN IF NOT EXISTS plays_count INTEGER DEFAULT 0;

-- RLS UPDATES
DROP POLICY IF EXISTS "Users can view own stats" ON confessions;
CREATE POLICY "Users can view own stats" ON confessions FOR SELECT USING (auth.uid() = user_id);

-- STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES ('confessions', 'confessions', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('comments', 'comments', true) ON CONFLICT (id) DO NOTHING;

-- STORAGE POLICIES
DROP POLICY IF EXISTS "Public access" ON storage.objects;
CREATE POLICY "Public access" ON storage.objects FOR SELECT USING (bucket_id IN ('confessions', 'comments'));

DROP POLICY IF EXISTS "Authenticated upload" ON storage.objects;
CREATE POLICY "Authenticated upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('confessions', 'comments') AND auth.role() = 'authenticated');