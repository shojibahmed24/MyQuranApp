-- 1. Fix Admin Escalation Vulnerability
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  username_val TEXT;
BEGIN
  username_val := COALESCE(
    new.raw_user_meta_data->>'username', 
    split_part(new.email, '@', 1), 
    'user_' || substr(new.id::text, 1, 8)
  );

  INSERT INTO public.profiles (id, username, avatar_url, is_admin)
  VALUES (
    new.id, 
    username_val, 
    new.raw_user_meta_data->>'avatar_url',
    FALSE -- Hardcoded to false for security
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    avatar_url = EXCLUDED.avatar_url;
    
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Secure Storage Policies
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Users can upload their own audio" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id IN ('confessions', 'comments') 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete own audio" ON storage.objects;
CREATE POLICY "Users can delete own audio" ON storage.objects 
FOR DELETE USING (
  bucket_id IN ('confessions', 'comments') 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Content Ownership Policies
DROP POLICY IF EXISTS "Users can delete own confessions" ON confessions;
CREATE POLICY "Users can delete own confessions" ON confessions 
FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
CREATE POLICY "Users can delete own comments" ON comments 
FOR DELETE USING (auth.uid() = user_id);