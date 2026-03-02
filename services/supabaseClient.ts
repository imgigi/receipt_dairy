import { createClient } from '@supabase/supabase-js'

// Ultra-safe way to get environment variables without crashing
const getEnvVar = (key: string) => {
  try {
    // Check if import.meta.env exists (Vite standard)
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      return (import.meta as any).env[key];
    }
  } catch (e) {
    // Ignore errors during access
  }
  return undefined;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || '';
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || '';

const isPlaceholder = !supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co';

// Log warning if missing, but do NOT crash
if (isPlaceholder) {
  console.warn("⚠️ Supabase Credentials Missing. Using placeholder to prevent crash.");
}

// Create client with fallback values so the module graph doesn't break
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);

// Export a flag to let the UI know if we are ready to rock
export const isConfigured = !isPlaceholder && supabaseAnonKey !== 'placeholder-key';