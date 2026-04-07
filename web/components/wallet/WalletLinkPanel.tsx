'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAccount, useDisconnect, useSignMessage } from 'wagmi';
import WalletConnectPanel from '@/components/wallet/WalletConnectPanel';
import { useWalletConnectModal } from '@/lib/auth/use-wallet-connect-modal';
import { isReownProjectIdConfigured } from '@/lib/auth/wagmi-config';
import { useLanguageStore } from '@/lib/auth/language-store';
import { textContent } from '@/lib/text-content';

type WalletLinkPanelProps = {
  content: any;
  redirectTo?: string;
  intent?: string;
};

export default function WalletLinkPanel({ content, redirectTo = '/mypage', intent }: WalletLinkPanelProps) {
  const { language } = useLanguageStore();
  const d = textContent[language];
  
  const { openWalletConnectModal } = useWalletConnectModal();
  const { disconnect } = useDisconnect();
  const { address, chain, isConnected } = useAccount();
  const { signMessageAsync, isPending: isSigning } = useSignMessage();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ email?: string; linkedAddress?: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (err) {
        console.error('Fetch user error:', err);
      } finally {
        setLoading(false);
      }
    };
    void fetchUser();
  }, []);

  const handleLink = async () => {
    if (!address) return;

    try {
      setLinking(true);
      setError(null);

      const nonceRes = await fetch(`/api/auth/wallet/nonce?address=${encodeURIComponent(address)}`);
      const { message: nonceMessage } = await nonceRes.json();

      const signature = await signMessageAsync({ message: nonceMessage });

      const linkRes = await fetch('/api/auth/wallet/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, message: nonceMessage, signature }),
      });

      if (!linkRes.ok) {
        const { error: linkError } = await linkRes.json();
        throw new Error(linkError || '연동에 실패했습니다.');
      }

      window.location.href = redirectTo;
    } catch (err: any) {
      setError(err.message || '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLinking(false);
    }
  };

  const handleConnectClick = async () => {
    const modalError = await openWalletConnectModal();
    if (modalError) {
      setError(modalError);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-3xl border border-monolith-outlineVariant/20 bg-monolith-surfaceLowest">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-monolith-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-3xl border border-monolith-outlineVariant/20 bg-monolith-surfaceLowest p-8 text-center shadow-ambient">
        <p className="font-bold text-monolith-onSurface">{d.walletLink.loginRequired}</p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-full bg-monolith-primary px-8 py-3 text-sm font-bold text-white transition hover:brightness-110"
        >
          {d.auth.loginCta}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Account Info */}
      <div className="rounded-3xl border border-monolith-outlineVariant/20 bg-monolith-surfaceLowest p-8 shadow-ambient">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tight text-monolith-onSurface">{d.walletLink.stepsLabel} 01. {content.cardTitle}</h2>
          <span className="rounded-full bg-monolith-primaryFixed px-3 py-1 text-[10px] font-black uppercase tracking-widest text-monolith-primary">
            Account Info
          </span>
        </div>

        <div className="rounded-2xl border border-monolith-outlineVariant/20 bg-monolith-surfaceLow p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-monolith-primary/60">{d.walletLink.currentAccountLabel}</p>
          <p className="mt-2 text-lg font-bold text-monolith-onSurface">{user.email}</p>
          <div className="mt-4 border-t border-monolith-outlineVariant/20 pt-4 text-xs font-bold text-monolith-onSurfaceMuted">
            {!user.linkedAddress ? <p>{language === 'ko' ? '연결된 지갑' : 'Linked Wallet'}: {d.walletLink.emptyLinkedWallet}</p> : (
              <p className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                {user.linkedAddress}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Wallet Link Action */}
      <div className="rounded-3xl border border-monolith-outlineVariant/20 bg-monolith-surfaceLowest p-8 shadow-ambient">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tight text-monolith-onSurface">{d.walletLink.stepsLabel} 02. {language === 'ko' ? '지갑 연동하기' : 'Link Wallet'}</h2>
        </div>

        <WalletConnectPanel
          isConnected={isConnected}
          address={address}
          chainName={chain?.name || d.walletLink.unknownNetwork}
          isLinking={linking || isSigning}
          onConnect={handleConnectClick}
          onDisconnect={disconnect}
          onLink={handleLink}
          error={error}
          title={d.walletLink.connectedWalletLabel}
          helperText={!isReownProjectIdConfigured ? <p>{d.auth.walletLinkMissingProjectId}</p> : undefined}
        />
      </div>
    </div>
  );
}
