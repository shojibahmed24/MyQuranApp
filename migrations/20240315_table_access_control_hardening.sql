-- FINAL TABLE SECURITY HARDENING

-- 1. Enable RLS on all tables
ALTER TABLE public.confessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. CONFESSIONS POLICIES
DROP POLICY IF EXISTS "Confessions are viewable by everyone" ON public.confessions;
CREATE POLICY "Confessions are viewable by everyone" ON public.confessions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own confessions" ON public.confessions;
CREATE POLICY "Users can insert their own confessions" ON public.confessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own confessions or admins can delete any" ON public.confessions;
CREATE POLICY "Users can delete own confessions or admins can delete any" ON public.confessions
  FOR DELETE USING (
    auth.uid() = user_id 
    OR (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true))
  );

-- 3. COMMENTS POLICIES
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
CREATE POLICY "Comments are viewable by everyone" ON public.comments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own comments" ON public.comments;
CREATE POLICY "Users can insert their own comments" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments or admins can delete any" ON public.comments;
CREATE POLICY "Users can delete own comments or admins can delete any" ON public.comments
  FOR DELETE USING (
    auth.uid() = user_id 
    OR (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true))
  );

-- 4. REACTIONS POLICIES
DROP POLICY IF EXISTS "Reactions are viewable by everyone" ON public.reactions;
CREATE POLICY "Reactions are viewable by everyone" ON public.reactions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage their own reactions" ON public.reactions;
CREATE POLICY "Users can manage their own reactions" ON public.reactions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. REPORTS POLICIES (Strictly Admin for viewing)
DROP POLICY IF EXISTS "Admins can view reports" ON public.reports;
CREATE POLICY "Admins can view reports" ON public.reports
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "Authenticated users can create reports" ON public.reports;
CREATE POLICY "Authenticated users can create reports" ON public.reports
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = reporter_id);

-- 6. PROFILES POLICIES
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
