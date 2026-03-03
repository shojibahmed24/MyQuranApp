-- STRICT TABLE ACCESS CONTROL

-- 1. Confessions Table Hardening
ALTER TABLE public.confessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view non-hidden confessions" ON public.confessions;
CREATE POLICY "Anyone can view non-hidden confessions"
ON public.confessions FOR SELECT
USING (is_hidden = false OR (auth.uid() = user_id) OR (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)));

DROP POLICY IF EXISTS "Users can insert their own confessions" ON public.confessions;
CREATE POLICY "Users can insert their own confessions"
ON public.confessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own confessions or admins can delete any" ON public.confessions;
CREATE POLICY "Users can delete their own confessions or admins can delete any"
ON public.confessions FOR DELETE
USING (auth.uid() = user_id OR (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)));

-- 2. Comments Table Hardening
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view comments on visible confessions" ON public.comments;
CREATE POLICY "Anyone can view comments on visible confessions"
ON public.comments FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.confessions 
  WHERE id = confession_id 
  AND (is_hidden = false OR user_id = auth.uid())
));

DROP POLICY IF EXISTS "Users can insert their own comments" ON public.comments;
CREATE POLICY "Users can insert their own comments"
ON public.comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments or admins can delete any" ON public.comments;
CREATE POLICY "Users can delete their own comments or admins can delete any"
ON public.comments FOR DELETE
USING (auth.uid() = user_id OR (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)));