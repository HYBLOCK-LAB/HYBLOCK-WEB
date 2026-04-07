'use client';

import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { getBrowserSupabase, isBrowserSupabaseConfigured } from '@/lib/auth/supabase-browser';

type SocialAuthSectionProps = {
  mode: 'login' | 'signup';
  redirectPath?: string;
};

export default function SocialAuthSection({ mode, redirectPath = '/wallet-link' }: SocialAuthSectionProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabaseConfigured = isBrowserSupabaseConfigured();

  const handleGoogle = async () => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;

    try {
      setError(null);
      setLoading(true);

      const targetPath =
        mode === 'signup'
          ? `/wallet-link?intent=signup`
          : redirectPath;
      const callbackUrl = new URL('/auth/callback', window.location.origin);
      callbackUrl.searchParams.set('next', targetPath);

      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl.toString(),
          skipBrowserRedirect: false,
        },
      });

      if (signInError) {
        throw signInError;
      }
    } catch (oauthError) {
      setLoading(false);
      setError(oauthError instanceof Error ? oauthError.message : 'Google 로그인 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-3">
      <button
        type="button"
        onClick={handleGoogle}
        disabled={!supabaseConfigured || loading}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-monolith-outlineVariant/30 bg-monolith-surfaceLow px-5 py-4 text-sm font-semibold text-monolith-onSurface transition-colors hover:bg-monolith-surface"
      >
        {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <span className="text-base">G</span>}
        {mode === 'login' ? 'Google 로그인' : 'Google 회원가입'}
      </button>
      {error ? <p className="text-sm text-monolith-error">{error}</p> : null}
    </div>
  );
}
