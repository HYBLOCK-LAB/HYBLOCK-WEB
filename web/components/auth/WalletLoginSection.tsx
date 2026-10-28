'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle, Wallet } from 'lucide-react';
import { useAccount, useSignMessage } from 'wagmi';
import { getAccount } from '@wagmi/core';
import { withWalletSessionLock, notifyWalletSessionChanged } from '@/lib/auth/wallet-session-client';
import { isReownProjectIdConfigured, wagmiConfig } from '@/lib/auth/wagmi-config';
import { textContent } from '@/lib/text-content';
import { useLanguageStore } from '@/lib/auth/language-store';
import { useWalletConnectModal } from '@/lib/auth/use-wallet-connect-modal';

type WalletLoginSectionProps = {
  redirectTo?: string;
  adminOnly?: boolean;
};

export default function WalletLoginSection({ redirectTo = '/', adminOnly = false }: WalletLoginSectionProps) {
  const router = useRouter();
  const { language } = useLanguageStore();
  const d = textContent[language].auth;
  
  const { openWalletConnectModal } = useWalletConnectModal();
  const { address, isConnected } = useAccount();
  const { signMessageAsync, isPending: isSigning } = useSignMessage();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const submittingRef = useRef(false);

  const handleOpenConnectModal = async () => {
    setError(null);
    setMessage(null);

    const modalError = await openWalletConnectModal();
    if (modalError) {
      setError(modalError);
    }
  };

  const handleWalletLogin = async () => {
    if (submittingRef.current) return;
    if (!address) {
      setError(language === 'ko' ? '먼저 지갑을 연결하세요.' : 'Please connect your wallet first.');
      return;
    }

    submittingRef.current = true;
    try {
      setError(null);
      setMessage(language === 'ko' ? '서명 요청을 준비하는 중입니다.' : 'Preparing signature request...');
      setIsVerifying(true);

      const nonceResponse = await withWalletSessionLock(() => fetch(`/api/auth/wallet/nonce?address=${encodeURIComponent(address)}`, { cache: 'no-store' }));
      if (!nonceResponse.ok) {
        const noncePayload = (await nonceResponse.json().catch(() => ({}))) as { error?: string };
        throw new Error(noncePayload.error ?? (language === 'ko' ? '로그인 요청을 시작하지 못했습니다.' : 'Failed to start login request.'));
      }

      const noncePayload = (await nonceResponse.json()) as { message: string };
      setMessage(language === 'ko' ? '지갑에서 서명을 완료해주세요.' : 'Please sign the message in your wallet.');
      const signature = await signMessageAsync({
        message: noncePayload.message,
      });

      setMessage(language === 'ko' ? '서명을 확인하는 중입니다.' : 'Verifying signature...');
      const verifyResponse = await withWalletSessionLock(() => {
        if (getAccount(wagmiConfig).address?.toLowerCase() !== address.toLowerCase()) {
          throw new Error(language === 'ko' ? '연결된 지갑이 변경되었습니다. 다시 로그인하세요.' : 'Wallet changed. Please log in again.');
        }
        return fetch('/api/auth/wallet/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address,
            message: noncePayload.message,
            signature,
            adminOnly,
          }),
        });
      });

      const data = (await verifyResponse.json().catch(() => ({}))) as { exists?: boolean; error?: string };
      if (!verifyResponse.ok) {
        if (verifyResponse.status === 404) {
          router.push(`/signup?redirect=${encodeURIComponent(redirectTo)}`);
          return;
        }

        throw new Error(data.error ?? (language === 'ko' ? '회원 정보 확인에 실패했습니다.' : 'Failed to verify member info.'));
      }

      setMessage(language === 'ko' ? '지갑 로그인 세션이 연결되었습니다.' : 'Wallet login session connected.');
      notifyWalletSessionChanged();
      router.replace(redirectTo);
      router.refresh();
    } catch (loginError) {
      setError(formatWalletLoginError(loginError, language));
      setMessage(null);
    } finally {
      submittingRef.current = false;
      setIsVerifying(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-4">
      {!isConnected ? (
        <button
          type="button"
          onClick={handleOpenConnectModal}
          disabled={!isReownProjectIdConfigured}
          className="interactive-soft flex w-full items-center justify-center gap-3 rounded-2xl border border-monolith-outline-variant/30 bg-monolith-surface-low px-5 py-2 text-sm font-semibold text-monolith-on-surface transition-colors hover:bg-monolith-surface disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-monolith-primary-fixed text-monolith-primary">
            <Wallet className="h-4 w-4" />
          </span>
          Connect Wallet
        </button>
      ) : null}

      {isConnected && address ? (
        <div className="rounded-2xl border border-monolith-outline-variant/20 bg-monolith-surface-lowest p-5 text-center shadow-[0_16px_40px_rgba(0,51,97,0.06)]">
          <button
            type="button"
            onClick={handleWalletLogin}
            disabled={isSigning || isVerifying}
            className="interactive-soft flex w-full items-center justify-center gap-2 rounded-xl border border-[#0e4a84] bg-[linear-gradient(135deg,#003361,#0e4a84)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(0,51,97,0.2)] transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSigning || isVerifying ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            {language === 'ko' ? '지갑으로 로그인' : 'Login with Wallet'}
          </button>
        </div>
      ) : null}

      {error ? <p className="text-center text-sm text-monolith-error">{error}</p> : null}
      {message ? <p className="text-center text-sm text-monolith-primary-container">{message}</p> : null}
      {!isReownProjectIdConfigured ? <p className="text-center text-sm text-monolith-on-surface-muted">{d.walletLoginMissingProjectId}</p> : null}
    </div>
  );
}

function formatWalletLoginError(error: unknown, lang: 'ko' | 'en') {
  if (!(error instanceof Error)) {
    return lang === 'ko' ? '지갑 로그인 중 오류가 발생했습니다.' : 'Error occurred during wallet login.';
  }

  const message = error.message.toLowerCase();

  if (message.includes('user rejected') || message.includes('rejected the request')) {
    return lang === 'ko' ? '서명이 취소되었습니다.' : 'Signature cancelled.';
  }

  return error.message;
}
