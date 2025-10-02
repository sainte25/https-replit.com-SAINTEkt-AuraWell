// Note: Using direct database connection via Drizzle as per blueprint requirements
// This file would contain Supabase client setup if using @supabase/supabase-js
// But we're connecting directly via DATABASE_URL and Drizzle

export const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.PUBLIC_SUPABASE_ANON_KEY || '';

// Placeholder for potential future Supabase real-time features
export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export const supabaseConfig: SupabaseConfig = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY
};
