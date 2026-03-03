-- Function to increment plays count safely
CREATE OR REPLACE FUNCTION increment_plays(confession_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE confessions
  SET plays_count = COALESCE(plays_count, 0) + 1
  WHERE id = confession_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;