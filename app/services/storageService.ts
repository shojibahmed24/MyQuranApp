import { supabase } from '../lib/supabase';

export const storageService = {
  /**
   * Uploads a file to a specific bucket.
   * Enforces a path structure of {user_id}/{random_id}.{ext} to match strict RLS.
   */
  async uploadFile(bucket: 'confessions' | 'comments', file: Blob): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const fileExt = file.type.split('/')[1] || 'webm';
    // Path MUST start with user.id to pass the strict RLS check
    const fileName = `${user.id}/${Math.random().toString(36).substring(2)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    return fileName;
  },

  getPublicUrl(bucket: 'confessions' | 'comments', path: string): string {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }
};