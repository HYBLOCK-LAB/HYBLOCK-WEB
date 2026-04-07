'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LoaderCircle, Wallet } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useWalletConnectModal } from '@/lib/auth/use-wallet-connect-modal';
import { getBrowserSupabase, isBrowserSupabaseConfigured } from '@/lib/auth/supabase-browser';

type WalletMemberSignupFormProps = {
  redirectTo?: string;
  source?: 'wallet' | 'google';
};

type LookupResponse = {
  exists: boolean;
};

const COHORT_OPTIONS = [
  { value: '9', label: '9기 (26학년도 1학기)' },
  { value: '8', label: '8기 (25학년도 2학기)' },
  { value: '7', label: '7기 (25학년도 1학기)' },
  { value: '6', label: '6기 (24학년도 2학기)' },
  { value: '5', label: '5기 (24학년도 1학기)' },
  { value: '4', label: '4기 (23학년도 2학기)' },
  { value: '3', label: '3기 (23학년도 1학기)' },
  { value: '2', label: '2기 (22학년도 2학기)' },
  { value: '1', label: '1기 (22학년도 1학기)' },
] as const;

export default function WalletMemberSignupForm({ redirectTo = '/', source = 'wallet' }: WalletMemberSignupFormProps) {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { openWalletConnectModal } = useWalletConnectModal();
  const supabase = getBrowserSupabase();

  const [name, setName] = useState('');
  const [major, setMajor] = useState('');
  const [affiliation, setAffiliation] = useState<'development' | 'business'>('development');
  const [cohort, setCohort] = useState('9');
  const [linkedWalletAddress, setLinkedWalletAddress] = useState<string | null>(null);
  const [checkingMember, setCheckingMember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resolvedWalletAddress = source === 'google' ? linkedWalletAddress : linkedWalletAddress ?? address ?? null;

  useEffect(() => {
    if (!isBrowserSupabaseConfigured() || !supabase) {
      return;
    }

    let active = true;

    void (async () => {
      const { data, error: userError } = await supabase.auth.getUser();
      if (!active) return;

      if (userError) {
        setError(userError.message);
        return;
      }

      const walletAddress =
        typeof data.user?.user_metadata?.wallet_address === 'string'
          ? data.user.user_metadata.wallet_address
          : null;

      setLinkedWalletAddress(walletAddress);
    })();

    return () => {
      active = false;
    };
  }, [supabase]);

  useEffect(() => {
    if (!resolvedWalletAddress) {
      return;
    }

    let active = true;

    void (async () => {
      setCheckingMember(true);
      try {
        const response = await fetch(`/api/members/by-wallet?wallet=${resolvedWalletAddress}`);
        if (!response.ok) {
          throw new Error('멤버 확인에 실패했습니다.');
        }

        const data = (await response.json()) as LookupResponse;
        if (active && data.exists) {
          router.replace(redirectTo);
        }
      } catch (lookupError) {
        if (active) {
          setError(lookupError instanceof Error ? lookupError.message : '멤버 확인 중 오류가 발생했습니다.');
        }
      } finally {
        if (active) {
          setCheckingMember(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [redirectTo, resolvedWalletAddress, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!resolvedWalletAddress) {
      setError(source === 'google' ? '먼저 Google 계정에 지갑을 연동하세요.' : '먼저 지갑을 연결하세요.');
      return;
    }

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: resolvedWalletAddress,
          name,
          major,
          affiliation,
          cohort: Number(cohort),
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? '회원가입에 실패했습니다.');
      }

      setMessage('회원가입이 완료되었습니다.');
      router.replace(redirectTo);
    } catch (signupError) {
      setError(signupError instanceof Error ? signupError.message : '회원가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectWallet = async () => {
    setError(null);
    await openWalletConnectModal();
  };

  return (
    <div className="mx-auto max-w-xl space-y-4 text-center">
      <div className="rounded-2xl border border-monolith-outlineVariant/20 bg-monolith-surfaceLow px-5 py-4 text-left">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-monolith-onSurfaceMuted">연결된 지갑</p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="font-mono text-sm text-monolith-onSurface">
            {resolvedWalletAddress ?? '지갑이 연결되지 않았습니다.'}
          </p>
          {!resolvedWalletAddress && source === 'wallet' ? (
            <button
              type="button"
              onClick={handleConnectWallet}
              className="interactive-soft flex items-center gap-2 rounded-xl bg-monolith-primary px-4 py-2 text-sm font-semibold text-white"
            >
              <Wallet className="h-4 w-4" />
              지갑 연결
            </button>
          ) : null}
        </div>
        {!resolvedWalletAddress && source === 'google' ? (
          <div className="mt-4 rounded-xl border border-monolith-outlineVariant/20 bg-monolith-surfaceLowest px-4 py-3 text-sm leading-6 text-monolith-onSurfaceMuted">
            Google 회원가입은 지갑 연동이 먼저 필요합니다.{' '}
            <Link href={`/wallet-link?intent=link&next=${encodeURIComponent(`/signup?source=google&redirect=${encodeURIComponent(redirectTo)}`)}`} className="font-semibold text-monolith-primaryContainer">
              지갑 연동 페이지로 이동
            </Link>
          </div>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-monolith-onSurface">이름</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-xl border border-monolith-outlineVariant/30 bg-monolith-surfaceLow px-4 py-3 outline-none transition focus:border-monolith-primaryContainer"
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-monolith-onSurface">전공</span>
          <input
            value={major}
            onChange={(event) => setMajor(event.target.value)}
            className="w-full rounded-xl border border-monolith-outlineVariant/30 bg-monolith-surfaceLow px-4 py-3 outline-none transition focus:border-monolith-primaryContainer"
            required
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-monolith-onSurface">소속</span>
            <select
              value={affiliation}
              onChange={(event) => setAffiliation(event.target.value as 'development' | 'business')}
              className="w-full rounded-xl border border-monolith-outlineVariant/30 bg-monolith-surfaceLow px-4 py-3 outline-none transition focus:border-monolith-primaryContainer"
            >
              <option value="development">개발팀</option>
              <option value="business">비즈니스팀</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-monolith-onSurface">기수</span>
            <select
              value={cohort}
              onChange={(event) => setCohort(event.target.value)}
              className="w-full rounded-xl border border-monolith-outlineVariant/30 bg-monolith-surfaceLow px-4 py-3 outline-none transition focus:border-monolith-primaryContainer"
            >
              {COHORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error ? <p className="text-center text-sm text-monolith-error">{error}</p> : null}
        {message ? <p className="text-center text-sm text-monolith-primaryContainer">{message}</p> : null}

        <button
          type="submit"
          disabled={!resolvedWalletAddress || loading || checkingMember}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-monolith-primaryContainer/20 bg-monolith-primaryFixed px-5 py-4 text-sm font-semibold text-monolith-primary transition-colors hover:bg-monolith-secondaryContainer disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading || checkingMember ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
          회원가입
        </button>
      </form>
    </div>
  );
}
