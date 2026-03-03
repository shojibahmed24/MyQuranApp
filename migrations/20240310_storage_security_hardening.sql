-- Ensure storage buckets exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('confessions', 'confessions', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('comments', 'comments', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own confessions" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own comments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;

-- 1. Allow public read access to all files in these buckets
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id IN ('confessions', 'comments'));

-- 2. Allow authenticated users to upload to their own folder in 'confessions'
CREATE POLICY "Users can upload their own confessions" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'confessions' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Allow authenticated users to upload to their own folder in 'comments'
CREATE POLICY "Users can upload their own comments" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'comments' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Allow users to delete their own files
CREATE POLICY "Users can delete their own files" ON storage.objects
FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);