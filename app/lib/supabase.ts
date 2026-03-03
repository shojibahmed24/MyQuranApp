import { createClient } from '@supabase/supabase-js';

/**
 * Robust environment variable access for Vite/React environments.
 */
const getSupabaseConfig = () => {
  let url = 'https://cuxazxzpvrodsmxktkne.supabase.co';
  let key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1eGF6eHpwdnJvZHNteGt0a25lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNTcxNzUsImV4cCI6MjA4NjgzMzE3NX0.8zGB_E_AAsU6wnBIBZnpQmDrmyKJXPLU11UChyZZKJ4';

  try {
    // Vite uses import.meta.env for environment variables
    url = import.meta.env.VITE_SUPABASE_URL || '';
    key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  } catch (e) {
    console.warn('Supabase: Could not access import.meta.env', e);
  }

  // Check if the values are actually provided and not just placeholders
  const isConfigured = Boolean(
    url && 
    key && 
    url !== 'your-supabase-url' && 
    url.startsWith('http')
  );

  return {
    url: isConfigured ? url.trim() : 'https://placeholder-project.supabase.co',
    key: isConfigured ? key.trim() : 'placeholder-key',
    isConfigured
  };
};

const config = getSupabaseConfig();

export const supabase = createClient(config.url, config.key);
export const isSupabaseConfigured = config.isConfigured;