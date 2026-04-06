import { createClient } from '@supabase/supabase-js';

type AuthenticatedUser = {
  id: string;
  email: string | null;
  user_metadata: Record<string, unknown>;
};

let authClient: ReturnType<typeof createClient<any>> | null = null;

function getSupabaseAuthClient() {
  if (authClient) return authClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !publishableKey) {
    throw new Error('Supabase auth environment variables are not configured.');
  }

  authClient = createClient(url, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return authClient;
}

export async function getAuthenticatedUserFromAccessToken(accessToken: string): Promise<AuthenticatedUser | null> {
  const supabase = getSupabaseAuthClient();
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error) {
    return null;
  }

  if (!data.user) {
    return null;
  }

  return {
    id: data.user.id,
    email: data.user.email ?? null,
    user_metadata: (data.user.user_metadata ?? {}) as Record<string, unknown>,
  };
}
