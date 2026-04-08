'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAccount, useDisconnect, useSignMessage } from 'wagmi';
import WalletConnectPanel from '@/components/wallet/WalletConnectPanel';
import { useWalletConnectModal } from '@/lib/auth/use-wallet-connect-modal';
import { buildWalletLinkMessage, isReownProjectIdConfigured } from '@/lib/auth/wagmi-config';
import { getBrowserSupabase, isBrowserSupabaseConfigured } from '@/lib/auth/supabase-browser';
import { useLanguageStore } from '@/lib/auth/language-store';
import { textContent } from '@/lib/text-content';

type WalletLinkPanelProps = {
  content: any;
  redirectTo?: string;
  intent?: string;
};

export default function WalletLinkPanel({ content, redirectTo = '/mypage', intent }: WalletLinkPanelProps) {
  const router = useRouter();
  const { language } = useLanguageStore();
  const d = textContent[language];
  const supabase = getBrowserSupabase();
  const supabaseConfigured = isBrowserSupabaseConfigured();
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
        if (!supabase) return;

        const { data, error: userError } = await supabase.auth.getUser();
        if (userError) {
          throw userError;
        }

        if (!data.user) {
          setUser(null);
          return;
        }

        setUser({
          email: data.user.email ?? undefined,
          linkedAddress:
            typeof data.user.user_metadata?.wallet_address === 'string'
              ? data.user.user_metadata.wallet_address
              : null,
        });
      } catch (err) {
        console.error('Fetch user error:', err);
      } finally {
        setLoading(false);
      }
    };
    void fetchUser();
  }, [supabase]);

  const handleLink = async () => {
    if (!address || !supabase || !user) return;

    try {
      setLinking(true);
      setError(null);

      const signature = await signMessageAsync({
        message: buildWalletLinkMessage(address),
      });

      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          wallet_address: address,
          wallet_chain_id: chain?.id ?? null,
          wallet_linked_at: new Date().toISOString(),
          wallet_signature_preview: `${signature.slice(0, 10)}...${signature.slice(-8)}`,
        },
      });
      if (updateError) throw updateError;

      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) throw refreshError;

      setUser((current) =>
        current
          ? {
              ...current,
              linkedAddress: address,
            }
          : current,
      );

      router.refresh();
      router.replace(redirectTo);
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
          helperText={
            !supabaseConfigured
              ? <p>Supabase 브라우저 인증 설정이 필요합니다.</p>
              : !isReownProjectIdConfigured
                ? <p>{d.auth.walletLinkMissingProjectId}</p>
                : intent === 'link' && !user.linkedAddress
                  ? <p>{language === 'ko' ? 'Google 로그인은 완료되었습니다. 출석을 Google 로그인만으로 사용하려면 지갑을 연결하세요.' : 'Google login is complete. Link a wallet to use attendance with Google login only.'}</p>
                  : undefined
          }
        />
      </div>
    </div>
  );
}
