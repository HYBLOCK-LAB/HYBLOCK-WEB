import { createClient } from '@supabase/supabase-js';

type SupabaseClientInstance = ReturnType<typeof createClient<any>>;

let cachedClient: SupabaseClientInstance | null = null;

export function getSupabase() {
  if (cachedClient) {
    return cachedClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Supabase environment variables are not configured.');
  }

  cachedClient = createClient<any>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedClient;
}
