import { createClient } from '@supabase/supabase-js';

type SupabaseClientInstance = ReturnType<typeof createClient<any>>;

let cachedClient: SupabaseClientInstance | null = null;

function getServerSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SECRET_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return { url, serviceRoleKey };
}

export function getSupabase() {
  if (cachedClient) {
    return cachedClient;
  }

  const { url, serviceRoleKey } = getServerSupabaseEnv();

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Supabase environment variables are not configured. Expected NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    );
  }

  cachedClient = createClient<any>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedClient;
}
