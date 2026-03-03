CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  is_pro BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS confessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  audio_url TEXT NOT NULL,
  duration INTEGER,
  waveform JSONB,
  content TEXT,
  mood_tag TEXT,
  emotional_score JSONB DEFAULT '{"sad": 0, "hopeful": 0, "angry": 0, "lonely": 0, "neutral": 100}'::jsonb,
  ai_summary TEXT,
  plays_count INTEGER DEFAULT 0,
  is_anonymous BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'flagged', 'removed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  confession_id UUID REFERENCES confessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL,
  UNIQUE(confession_id, user_id)
);

CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  confession_id UUID REFERENCES confessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  audio_url TEXT,
  content TEXT,
  waveform JSONB,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'flagged', 'removed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  confession_id UUID REFERENCES confessions(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE confessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public confessions are viewable by everyone" ON confessions FOR SELECT USING (status = 'active' OR auth.uid() = user_id OR (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)));
CREATE POLICY "Users can insert their own confessions" ON confessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own confessions" ON confessions FOR DELETE USING (auth.uid() = user_id OR (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)));

ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reactions are viewable by everyone" ON reactions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can react" ON reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reaction" ON reactions FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments are viewable by everyone" ON comments FOR SELECT USING (status = 'active' OR auth.uid() = user_id OR (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)));
CREATE POLICY "Authenticated users can comment" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (auth.uid() = user_id OR (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)));

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view reports" ON reports FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Authenticated users can report" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- TRIGGER FOR NEW USER PROFILES
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  username_val TEXT;
BEGIN
  username_val := COALESCE(
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1),
    'user_' || substr(new.id::text, 1, 8)
  );

  INSERT INTO public.profiles (id, username, avatar_url, is_admin, is_pro)
  VALUES (
    new.id,
    username_val,
    new.raw_user_meta_data->>'avatar_url',
    FALSE,
    FALSE
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    avatar_url = EXCLUDED.avatar_url;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();