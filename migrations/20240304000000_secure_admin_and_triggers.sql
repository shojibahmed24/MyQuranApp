ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Update RLS for confessions to use is_admin
DROP POLICY IF EXISTS "Admins can update any confession" ON confessions;
CREATE POLICY "Admins can update any confession" ON confessions FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Update trigger to handle profile creation securely
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
    FALSE -- SECURITY: Never allow client-side or metadata-based admin assignment
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    avatar_url = EXCLUDED.avatar_url;
    
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;