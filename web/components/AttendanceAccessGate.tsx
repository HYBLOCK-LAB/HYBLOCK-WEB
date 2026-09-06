'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';
import { getBrowserSupabase, isBrowserSupabaseConfigured } from '@/lib/auth/supabase-browser';

type AttendanceAccessGateProps = {
  hasWalletSession: boolean;
  children: React.ReactNode;
  returnPath?: string;
};

export default function AttendanceAccessGate({
  hasWalletSession,
  children,
  returnPath = '/attendance',
}: AttendanceAccessGateProps) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(hasWalletSession);
  const [checking, setChecking] = useState(!hasWalletSession);

  useEffect(() => {
    if (hasWalletSession) {
      setAllowed(true);
      setChecking(false);
      return;
    }

    const loginTarget = `/login?redirect=${encodeURIComponent(returnPath)}`;
    const walletLinkTarget = `/wallet-link?intent=link&next=${encodeURIComponent(returnPath)}`;

    if (!isBrowserSupabaseConfigured()) {
      router.replace(loginTarget);
      return;
    }

    const supabase = getBrowserSupabase();
    if (!supabase) {
      router.replace(loginTarget);
      return;
    }

    let cancelled = false;

    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (cancelled) return;

      const sessionLinkedWallet =
        typeof session?.user?.user_metadata?.wallet_address === 'string'
          ? session.user.user_metadata.wallet_address
          : null;

      if (session?.access_token && sessionLinkedWallet) {
        setAllowed(true);
        setChecking(false);
        return;
      }

      if (session?.access_token) {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (cancelled) return;

        const userLinkedWallet =
          !userError && typeof userData.user?.user_metadata?.wallet_address === 'string'
            ? userData.user.user_metadata.wallet_address
            : null;

        if (userLinkedWallet) {
          setAllowed(true);
          setChecking(false);
          return;
        }
      }

      router.replace(session?.access_token ? walletLinkTarget : loginTarget);
    })();

    return () => {
      cancelled = true;
    };
  }, [hasWalletSession, router, returnPath]);

  if (!allowed) {
    return (
      <main className="min-h-screen px-6 py-20">
        <div className="mx-auto flex max-w-xl items-center justify-center rounded-[2rem] border border-monolith-outline-variant/20 bg-monolith-surface-lowest py-14 text-sm text-monolith-on-surface-muted shadow-monolith">
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          로그인 상태를 확인하는 중입니다.
        </div>
      </main>
    );
  }

  if (checking) {
    return (
      <main className="min-h-screen px-6 py-20">
        <div className="mx-auto flex max-w-xl items-center justify-center rounded-[2rem] border border-monolith-outline-variant/20 bg-monolith-surface-lowest py-14 text-sm text-monolith-on-surface-muted shadow-monolith">
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          로그인 상태를 확인하는 중입니다.
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
