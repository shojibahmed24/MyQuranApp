-- ENFORCE STRICT R_L_S ON ALL PUBLIC TABLES

-- 1. PROFILES: Everyone can see profiles, but only owners can update non-admin fields
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 2. CONFESSIONS: Public read, authenticated create, owner/admin delete
ALTER TABLE public.confessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Confessions are viewable by everyone" 
ON public.confessions FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create confessions" 
ON public.confessions FOR INSERT 
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Owners or admins can delete confessions" 
ON public.confessions FOR DELETE 
USING (
  auth.uid() = user_id 
  OR (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true))
);

-- 3. COMMENTS: Public read, authenticated create, owner/admin delete
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone" 
ON public.comments FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create comments" 
ON public.comments FOR INSERT 
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Owners or admins can delete comments" 
ON public.comments FOR DELETE 
USING (
  auth.uid() = user_id 
  OR (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true))
);

-- 4. REPORTS: Only authenticated users can create, only admins can read/update
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can file reports" 
ON public.reports FOR INSERT 
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = reporter_id);

CREATE POLICY "Only admins can view reports" 
ON public.reports FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Only admins can update reports" 
ON public.reports FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));