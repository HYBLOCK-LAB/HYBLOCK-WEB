'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, LoaderCircle } from 'lucide-react';
import { getBrowserSupabase, isBrowserSupabaseConfigured } from '@/lib/auth/supabase-browser';

function normalizeNextPath(rawNext: string | null) {
  if (!rawNext) return '/';
  return rawNext.startsWith('/') ? rawNext : '/';
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError('Supabase 인증 설정이 없습니다.');
      return;
    }

    const next = normalizeNextPath(searchParams.get('next'));
    const authError = searchParams.get('error_description') ?? searchParams.get('error');
    if (authError) {
      setError(authError);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const code = searchParams.get('code');
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        }

        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!data.session) {
          throw new Error('Google 로그인 세션을 생성하지 못했습니다.');
        }

        const linkedWallet =
          typeof data.session.user.user_metadata?.wallet_address === 'string'
            ? data.session.user.user_metadata.wallet_address
            : null;

        if (!cancelled) {
          if (!linkedWallet) {
            router.replace(`/wallet-link?intent=link&next=${encodeURIComponent(next)}`);
            return;
          }

          router.replace(next);
        }
      } catch (callbackError) {
        if (!cancelled) {
          setError(callbackError instanceof Error ? callbackError.message : 'Google 로그인 처리 중 오류가 발생했습니다.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#f7fbff,transparent_45%),linear-gradient(180deg,#f6f7fb_0%,#eef2f7_100%)] px-6 py-20">
      <section className="mx-auto max-w-xl rounded-[2rem] border border-monolith-outlineVariant/20 bg-monolith-surfaceLowest p-8 text-center shadow-monolith">
        <p className="font-display text-xs font-bold uppercase tracking-[0.22em] text-monolith-primaryContainer">
          Google OAuth
        </p>
        <h1 className="mt-4 text-3xl font-black tracking-[-0.05em] text-monolith-primary">
          로그인 처리 중
        </h1>

        {error ? (
          <div className="mt-6 rounded-2xl bg-monolith-errorContainer px-5 py-4 text-left">
            <div className="flex items-start gap-2 text-sm text-monolith-error">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
            <div className="mt-4">
              <Link href="/login" className="text-sm font-semibold text-monolith-primaryContainer hover:text-monolith-primary">
                로그인 페이지로 돌아가기
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 flex items-center justify-center gap-3 text-sm text-monolith-onSurfaceMuted">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Google 세션을 확인하고 있습니다.
          </div>
        )}

        {!isBrowserSupabaseConfigured() ? (
          <p className="mt-6 text-sm text-monolith-onSurfaceMuted">Supabase 브라우저 인증 설정이 필요합니다.</p>
        ) : null}
      </section>
    </main>
  );
}

function AuthCallbackFallback() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#f7fbff,transparent_45%),linear-gradient(180deg,#f6f7fb_0%,#eef2f7_100%)] px-6 py-20">
      <section className="mx-auto flex max-w-xl items-center justify-center rounded-[2rem] border border-monolith-outlineVariant/20 bg-monolith-surfaceLowest py-16 text-sm text-monolith-onSurfaceMuted shadow-monolith">
        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
        로그인 정보를 불러오는 중입니다.
      </section>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackFallback />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
