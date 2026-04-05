'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle, Wallet } from 'lucide-react';
import { useAccount, useSignMessage } from 'wagmi';
import { buildWalletLinkMessage, isReownProjectIdConfigured } from '@/lib/auth/wagmi-config';
import { textContent } from '@/lib/text-content';
import { useWalletConnectModal } from '@/lib/auth/use-wallet-connect-modal';

type WalletLoginSectionProps = {
  redirectTo?: string;
};

export default function WalletLoginSection({ redirectTo = '/' }: WalletLoginSectionProps) {
  const router = useRouter();
  const { openWalletConnectModal } = useWalletConnectModal();
  const { address, chain, isConnected } = useAccount();
  const { signMessageAsync, isPending: isSigning } = useSignMessage();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected && address) {
      router.replace(redirectTo);
    }
  }, [address, isConnected, redirectTo, router]);

  const handleOpenConnectModal = async () => {
    setError(null);
    setMessage(null);

    const modalError = await openWalletConnectModal();
    if (modalError) {
      setError(modalError);
    }
  };

  const handleWalletLogin = async () => {
    if (!address) {
      setError('먼저 지갑을 연결하세요.');
      return;
    }

    try {
      setError(null);
      const signature = await signMessageAsync({
        message: buildWalletLinkMessage(address),
      });

      window.localStorage.setItem(
        'hyblock_wallet_login',
        JSON.stringify({
          address,
          chainId: chain?.id ?? null,
          signedAt: new Date().toISOString(),
          signaturePreview: `${signature.slice(0, 10)}...${signature.slice(-8)}`,
        }),
      );

      setMessage('지갑 서명이 완료되었습니다.');
      router.push('/wallet-link?intent=wallet-login');
    } catch (loginError) {
      setError(formatWalletLoginError(loginError));
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-4">
      {!isConnected ? (
        <button
          type="button"
          onClick={handleOpenConnectModal}
          disabled={!isReownProjectIdConfigured}
          className="interactive-soft flex w-full items-center justify-center gap-3 rounded-2xl border border-monolith-outlineVariant/30 bg-monolith-surfaceLow px-5 py-2 text-sm font-semibold text-monolith-onSurface transition-colors hover:bg-monolith-surface disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-monolith-primaryFixed text-monolith-primary">
            <Wallet className="h-4 w-4" />
          </span>
          Connect Wallet
        </button>
      ) : null}

      {isConnected && address ? (
        <div className="rounded-2xl border border-monolith-outlineVariant/20 bg-monolith-surfaceLowest p-5 text-center shadow-[0_16px_40px_rgba(0,51,97,0.06)]">
          <button
            type="button"
            onClick={handleWalletLogin}
            disabled={isSigning}
            className="interactive-soft flex w-full items-center justify-center gap-2 rounded-xl border border-[#0e4a84] bg-[linear-gradient(135deg,#003361,#0e4a84)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(0,51,97,0.2)] transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSigning ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            지갑으로 로그인
          </button>
        </div>
      ) : null}

      {error ? <p className="text-center text-sm text-monolith-error">{error}</p> : null}
      {message ? <p className="text-center text-sm text-monolith-primaryContainer">{message}</p> : null}
      {!isReownProjectIdConfigured ? <p className="text-center text-sm text-monolith-onSurfaceMuted">{textContent.auth.walletLoginMissingProjectId}</p> : null}
    </div>
  );
}

function formatWalletLoginError(error: unknown) {
  if (!(error instanceof Error)) {
    return '지갑 로그인 중 오류가 발생했습니다.';
  }

  const message = error.message.toLowerCase();

  if (message.includes('user rejected') || message.includes('rejected the request')) {
    return '서명이 취소되었습니다.';
  }

  return error.message;
}
