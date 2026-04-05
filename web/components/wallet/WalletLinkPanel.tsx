'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAccount, useDisconnect, useSignMessage } from 'wagmi';
import WalletConnectPanel from '@/components/wallet/WalletConnectPanel';
import { getBrowserSupabase, isBrowserSupabaseConfigured } from '@/lib/auth/supabase-browser';
import { buildWalletLinkMessage, isReownProjectIdConfigured } from '@/lib/auth/wagmi-config';
import { useWalletConnectModal } from '@/lib/auth/use-wallet-connect-modal';
import type { WalletLinkPageContent } from '@/lib/site-content';
import { textContent } from '@/lib/text-content';

type WalletLinkPanelProps = {
  content: WalletLinkPageContent;
};

type AuthUserSummary = {
  email: string | null;
  linkedAddress: string | null;
};

export default function WalletLinkPanel({ content }: WalletLinkPanelProps) {
  const supabaseConfigured = isBrowserSupabaseConfigured();
  const supabase = getBrowserSupabase();
  const { openWalletConnectModal } = useWalletConnectModal();
  const { address, chain, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { signMessageAsync, isPending: isSigning } = useSignMessage();
  const [user, setUser] = useState<AuthUserSummary | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setLoadingUser(false);
      return;
    }

    let active = true;

    supabase.auth.getUser().then(({ data, error: userError }) => {
      if (!active) return;
      if (userError) {
        setError(userError.message);
        setLoadingUser(false);
        return;
      }

      const authUser = data.user;
      setUser(
        authUser
          ? {
              email: authUser.email ?? null,
              linkedAddress:
                typeof authUser.user_metadata?.wallet_address === 'string'
                  ? authUser.user_metadata.wallet_address
                  : null,
            }
          : null,
      );
      setLoadingUser(false);
    });

    return () => {
      active = false;
    };
  }, [supabase]);

  const handleOpenWalletModal = async () => {
    setError(null);
    setMessage(null);
    const modalError = await openWalletConnectModal();
    if (modalError) {
      setError(modalError);
    }
  };

  const handleLinkWallet = async () => {
    if (!supabase || !user || !address) {
      setError('먼저 로그인한 뒤 지갑을 연결하세요.');
      return;
    }

    setIsLinking(true);
    setError(null);
    setMessage(null);

    try {
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

      setUser((current) => (current ? { ...current, linkedAddress: address } : current));
      setMessage('지갑이 연결되었습니다.');
    } catch (linkError) {
      setError(linkError instanceof Error ? linkError.message : '지갑 연동 중 오류가 발생했습니다.');
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <div className="rounded-[2rem] border border-monolith-outlineVariant/20 bg-monolith-surfaceLowest p-8 shadow-monolith md:p-10">
      <div className="border-b border-monolith-outlineVariant/20 pb-6">
        <p className="font-display text-xs font-bold uppercase tracking-[0.24em] text-monolith-primaryContainer">
          {content.cardTitle}
        </p>
        <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-monolith-primary">{content.cardDescription}</h2>
      </div>

      <div className="mt-8 space-y-6">
        <div className="rounded-2xl border border-monolith-outlineVariant/20 bg-monolith-surfaceLow p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-monolith-primary/60">{textContent.walletLink.currentAccountLabel}</p>
          {loadingUser ? (
            <p className="mt-3 text-sm text-monolith-onSurfaceMuted">{textContent.walletLink.loadingUser}</p>
          ) : user ? (
            <div className="mt-3 space-y-2 text-sm text-monolith-onSurfaceMuted">
              <p>{user.email ?? '이메일 없음'}</p>
              <p>연결된 지갑: {user.linkedAddress ?? textContent.walletLink.emptyLinkedWallet}</p>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              <p className="text-sm text-monolith-onSurfaceMuted">{textContent.walletLink.loginRequired}</p>
              <div className="flex gap-3 text-sm font-semibold text-monolith-primaryContainer">
                <Link href="/login">로그인</Link>
                <Link href="/signup">회원가입</Link>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-monolith-outlineVariant/20 bg-monolith-surfaceLow p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-monolith-primary/60">{textContent.walletLink.stepsLabel}</p>
          <ol className="mt-4 space-y-3 text-sm leading-7 text-monolith-onSurfaceMuted">
            {content.steps.map((step, index) => (
              <li key={step}>
                {index + 1}. {step}
              </li>
            ))}
          </ol>
        </div>

        <WalletConnectPanel
          address={address}
          chainName={chain?.name}
          isConnected={isConnected && Boolean(address)}
          isBusy={isLinking || isSigning}
          connectLabel="지갑 선택하기"
          primaryActionLabel="계정에 저장"
          onConnect={handleOpenWalletModal}
          onPrimaryAction={handleLinkWallet}
          onDisconnect={() => disconnect()}
          error={error}
          message={message}
          disabled={!supabaseConfigured}
          primaryActionDisabled={!user}
          helperText={
            !isReownProjectIdConfigured ? (
              <p>{textContent.auth.walletLinkMissingProjectId}</p>
            ) : (
              <p>연동 전에 지갑을 다시 선택하거나 연결 상태를 검토할 수 있게 진입 UX를 바꿨습니다.</p>
            )
          }
        />
      </div>
    </div>
  );
}
