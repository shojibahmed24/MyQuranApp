-- Update trigger to handle Google OAuth metadata
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

  INSERT INTO public.profiles (id, username, avatar_url, is_admin)
  VALUES (
    new.id,
    username_val,
    new.raw_user_meta_data->>'avatar_url',
    FALSE
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    avatar_url = EXCLUDED.avatar_url;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;