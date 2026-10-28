'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { getAccount } from '@wagmi/core';
import { wagmiConfig } from '@/lib/auth/wagmi-config';
import { useWalletSessionStore, type AuthSession } from '@/lib/auth/wallet-session-store';
import { withWalletSessionLock } from '@/lib/auth/wallet-session-client';

export default function WalletSessionSync() {
  const { address, chain, isConnected, status } = useAccount();
  const pathname = usePathname();
  const router = useRouter();
  const previousAddress = useRef<string | null>(null);
  const session = useWalletSessionStore((state) => state.session);
  const setAuthSession = useWalletSessionStore((state) => state.setAuthSession);
  const resetWalletSession = useWalletSessionStore((state) => state.resetWalletSession);
  const setWalletSession = useWalletSessionStore((state) => state.setWalletSession);

  useEffect(() => {
    if (!isConnected || !address) {
      resetWalletSession();
      return;
    }
    setWalletSession({ address, chainName: chain?.name ?? null, isConnected: true });
  }, [address, chain?.name, isConnected, resetWalletSession, setWalletSession]);

  useEffect(() => {
    if (status === 'connecting' || status === 'reconnecting') return;
    let cancelled = false;
    const disconnected = Boolean(previousAddress.current && !address);
    previousAddress.current = address ?? null;
    // Hide the previous identity immediately, while the server clears its cookie.
    const old = useWalletSessionStore.getState().session;
    if (disconnected || (address && old && address.toLowerCase() !== old.address.toLowerCase())) {
      setAuthSession(null);
    }

    const sync = (clearDisconnected = false) => withWalletSessionLock(async () => {
      try {
        const account = getAccount(wagmiConfig);
        if (account.status === 'connecting' || account.status === 'reconnecting') return;
        const response = await fetch('/api/auth/wallet/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: account.address ?? null, disconnected: clearDisconnected }),
          cache: 'no-store',
        });
        if (!response.ok) throw new Error('Session check failed');
        const data = await response.json() as { session: AuthSession | null };
        if (cancelled) return;
        const previous = useWalletSessionStore.getState().session;
        setAuthSession(data.session);
        if (previous?.memberId !== data.session?.memberId || (old && !data.session)) router.refresh();
      } catch {
        if (!cancelled) setAuthSession(null);
      }
    });
    void sync(disconnected);
    const onChange = () => { void sync(); };
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'hyblock_session_changed') onChange();
    };
    const onVisibility = () => { if (document.visibilityState === 'visible') onChange(); };
    window.addEventListener('focus', onChange);
    window.addEventListener('hyblock:session-changed', onChange);
    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', onChange);
      window.removeEventListener('hyblock:session-changed', onChange);
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [address, status, pathname, router, setAuthSession]);

  useEffect(() => {
    if (!session) return;
    const timeout = window.setTimeout(() => {
      setAuthSession(null);
      router.refresh();
    }, Math.max(0, session.expiresAt - Date.now()));
    return () => window.clearTimeout(timeout);
  }, [session, router, setAuthSession]);

  return null;
}
