-- FINAL SECURITY HARDENING & ANALYTICS

-- 1. Create increment_plays function for AudioPlayer
CREATE OR REPLACE FUNCTION public.increment_plays(confession_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.confessions
  SET plays_count = COALESCE(plays_count, 0) + 1
  WHERE id = confession_id
  AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Protect sensitive profile fields (is_admin, is_pro)
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  ) THEN
    IF TG_OP = 'INSERT' THEN
      NEW.is_admin := FALSE;
      NEW.is_pro := FALSE;
    ELSIF TG_OP = 'UPDATE' THEN
      NEW.is_admin := OLD.is_admin;
      NEW.is_pro := OLD.is_pro;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_profile_update_protect ON public.profiles;
CREATE TRIGGER on_profile_update_protect
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.protect_profile_fields();

-- 3. Harden Storage Policies
DROP POLICY IF EXISTS "Strict authenticated upload" ON storage.objects;
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
DROP POLICY IF EXISTS "Public confessions are viewable by everyone" ON public.confessions;
CREATE POLICY "Public confessions are viewable by everyone" 
ON public.confessions FOR SELECT 
USING (
  status = 'active' 
  OR auth.uid() = user_id
  OR (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true))
);

DROP POLICY IF EXISTS "Public comments are viewable by everyone" ON public.comments;
CREATE POLICY "Public comments are viewable by everyone" 
ON public.comments FOR SELECT 
USING (
  status = 'active' 
  OR auth.uid() = user_id
  OR (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true))
);