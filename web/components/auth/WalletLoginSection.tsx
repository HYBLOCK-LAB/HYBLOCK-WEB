'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle, Wallet } from 'lucide-react';
import { useAccount, useSignMessage } from 'wagmi';
import { isReownProjectIdConfigured } from '@/lib/auth/wagmi-config';
import { textContent } from '@/lib/text-content';
import { useLanguageStore } from '@/lib/auth/language-store';
import { useWalletConnectModal } from '@/lib/auth/use-wallet-connect-modal';

type WalletLoginSectionProps = {
  redirectTo?: string;
};

export default function WalletLoginSection({ redirectTo = '/' }: WalletLoginSectionProps) {
  const router = useRouter();
  const { language } = useLanguageStore();
  const d = textContent[language].auth;
  
  const { openWalletConnectModal } = useWalletConnectModal();
  const { address, chain, isConnected } = useAccount();
  const { signMessageAsync, isPending: isSigning } = useSignMessage();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const handledAddressRef = useRef<string | null>(null);

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
      setError(language === 'ko' ? '먼저 지갑을 연결하세요.' : 'Please connect your wallet first.');
      return;
    }

    try {
      setError(null);
      setMessage(language === 'ko' ? '서명 요청을 준비하는 중입니다.' : 'Preparing signature request...');
      setIsVerifying(true);

      const nonceResponse = await fetch(`/api/auth/wallet/nonce?address=${encodeURIComponent(address)}`);
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
      const verifyResponse = await fetch('/api/auth/wallet/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          message: noncePayload.message,
          signature,
        }),
      });

      const data = (await verifyResponse.json().catch(() => ({}))) as { exists?: boolean; error?: string };
      if (!verifyResponse.ok) {
        if (verifyResponse.status === 404) {
          router.push(`/signup?redirect=${encodeURIComponent(redirectTo)}`);
          return;
        }

        throw new Error(data.error ?? (language === 'ko' ? '회원 정보 확인에 실패했습니다.' : 'Failed to verify member info.'));
      }

      window.localStorage.setItem(
        'hyblock_wallet_login',
        JSON.stringify({
          address,
          chainId: chain?.id ?? null,
          signedAt: new Date().toISOString(),
          signaturePreview: `${signature.slice(0, 10)}...${signature.slice(-8)}`,
        }),
      );

      setMessage(language === 'ko' ? '지갑 로그인 세션이 연결되었습니다.' : 'Wallet login session connected.');
      router.replace(redirectTo);
    } catch (loginError) {
      handledAddressRef.current = null;
      setError(formatWalletLoginError(loginError, language));
      setMessage(null);
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (!isConnected || !address) {
      handledAddressRef.current = null;
      return;
    }

    if (handledAddressRef.current === address) {
      return;
    }

    handledAddressRef.current = address;
    void handleWalletLogin();
  }, [address, isConnected]);

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
            disabled={isSigning || isVerifying}
            className="interactive-soft flex w-full items-center justify-center gap-2 rounded-xl border border-[#0e4a84] bg-[linear-gradient(135deg,#003361,#0e4a84)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(0,51,97,0.2)] transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSigning || isVerifying ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            {language === 'ko' ? '지갑으로 로그인' : 'Login with Wallet'}
          </button>
        </div>
      ) : null}

      {error ? <p className="text-center text-sm text-monolith-error">{error}</p> : null}
      {message ? <p className="text-center text-sm text-monolith-primaryContainer">{message}</p> : null}
      {!isReownProjectIdConfigured ? <p className="text-center text-sm text-monolith-onSurfaceMuted">{d.walletLoginMissingProjectId}</p> : null}
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
