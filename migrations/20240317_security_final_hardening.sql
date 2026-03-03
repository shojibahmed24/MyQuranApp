-- FINAL SECURITY HARDENING & ANALYTICS

-- 1. Create increment_plays function for AudioPlayer
CREATE OR REPLACE FUNCTION public.increment_plays(confession_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.confessions
  SET plays_count = COALESCE(plays_count, 0) + 1
  WHERE id = confession_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Protect sensitive profile fields (is_admin, is_pro)
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow is_admin/is_pro changes if the requester is an admin
  -- Note: We check the current user's admin status in the profiles table
  IF NOT (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) THEN
    NEW.is_admin := OLD.is_admin;
    NEW.is_pro := OLD.is_pro;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_update_protect ON public.profiles;
CREATE TRIGGER on_profile_update_protect
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.protect_profile_fields();

-- 3. Harden Storage Policies (User-specific folders)
-- This ensures users can only upload to their own folder: bucket/user_id/filename

DROP POLICY IF EXISTS "Authenticated upload" ON storage.objects;
CREATE POLICY "Strict authenticated upload" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id IN ('confessions', 'comments') 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
CREATE POLICY "Users can delete own files" 
ON storage.objects FOR DELETE 
USING (
  bucket_id IN ('confessions', 'comments') 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Consolidate Table RLS for Moderation
-- Ensure 'flagged' or 'removed' content is hidden from public but visible to admins

DROP POLICY IF EXISTS "Public confessions are viewable by everyone" ON public.confessions;
CREATE POLICY "Public confessions are viewable by everyone" 
ON public.confessions FOR SELECT 
USING (
  status = 'active' 
  OR auth.uid() = user_id
  OR (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true))
);

DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
CREATE POLICY "Public comments are viewable by everyone" 
ON public.comments FOR SELECT 
USING (
  status = 'active' 
  OR auth.uid() = user_id
  OR (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true))
);