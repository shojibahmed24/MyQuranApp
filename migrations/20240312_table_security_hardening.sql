-- ENABLE RLS ON ALL TABLES
ALTER TABLE public.confessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- CONFESSIONS POLICIES
DROP POLICY IF EXISTS "Public read confessions" ON public.confessions;
CREATE POLICY "Public read confessions" ON public.confessions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own confessions" ON public.confessions;
CREATE POLICY "Users can insert own confessions" ON public.confessions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can delete any confession" ON public.confessions;
CREATE POLICY "Admins can delete any confession" ON public.confessions FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- COMMENTS POLICIES
DROP POLICY IF EXISTS "Public read comments" ON public.comments;
CREATE POLICY "Public read comments" ON public.comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own comments" ON public.comments;
CREATE POLICY "Users can insert own comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can delete any comment" ON public.comments;
CREATE POLICY "Admins can delete any comment" ON public.comments FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- REACTIONS POLICIES
DROP POLICY IF EXISTS "Public read reactions" ON public.reactions;
CREATE POLICY "Public read reactions" ON public.reactions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own reactions" ON public.reactions;
CREATE POLICY "Users can manage own reactions" ON public.reactions FOR ALL USING (auth.uid() = user_id);

-- REPORTS POLICIES
DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
CREATE POLICY "Users can create reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Admins can view and manage reports" ON public.reports;
CREATE POLICY "Admins can view and manage reports" ON public.reports FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- PROFILES POLICIES
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);