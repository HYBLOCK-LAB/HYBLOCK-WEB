'use client';

import { createClient } from '@supabase/supabase-js';

type BrowserSupabase = ReturnType<typeof createClient<any>>;

let browserClient: BrowserSupabase | null = null;

function getBrowserSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return { url, publishableKey };
}

export function isBrowserSupabaseConfigured() {
  const { url, publishableKey } = getBrowserSupabaseEnv();
  return Boolean(url && publishableKey);
}

export function getBrowserSupabase() {
  if (browserClient) return browserClient;

  const { url, publishableKey } = getBrowserSupabaseEnv();

  if (!url || !publishableKey) return null;

  browserClient = createClient(url, publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return browserClient;
}
