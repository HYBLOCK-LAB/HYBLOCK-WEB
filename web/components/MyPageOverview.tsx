'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BadgeCheck,
  ExternalLink,
  LoaderCircle,
  ShieldCheck,
  UserRound,
  Wallet,
} from 'lucide-react';
import PersonalAttendanceQrCard from '@/components/PersonalAttendanceQrCard';
import { useWalletConnectModal } from '@/lib/auth/use-wallet-connect-modal';
import { useWalletSessionStore } from '@/lib/auth/wallet-session-store';

type MemberProfile = {
  id: number;
  wallet_address: string | null;
  name: string;
  major: string;
  affiliation: 'development' | 'business';
  cohort: number;
  role: string;
  is_active: boolean;
};

const AFFILIATION_LABELS: Record<string, string> = {
  development: 'Development',
  business: 'Business',
};

export default function MyPageOverview() {
  const { openWalletConnectModal } = useWalletConnectModal();
  const address = useWalletSessionStore((state) => state.address);
  const chainName = useWalletSessionStore((state) => state.chainName);
  const isConnected = useWalletSessionStore((state) => state.isConnected);
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [loadingMember, setLoadingMember] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      setMember(null);
      setMemberError(null);
      setLoadingMember(false);
      return;
    }

    let disposed = false;

    const fetchMember = async () => {
      setLoadingMember(true);
      setMemberError(null);

      try {
        const response = await fetch(`/api/members/by-wallet?wallet=${encodeURIComponent(address)}`);
        const result = (await response.json().catch(() => ({}))) as {
          error?: string;
          exists?: boolean;
          member?: MemberProfile | null;
        };

        if (!response.ok) {
          throw new Error(result.error ?? '회원 정보를 불러오지 못했습니다.');
        }

        if (disposed) return;

        setMember(result.member ?? null);
        if (!result.member) {
          setMemberError('연결된 지갑과 매칭되는 회원 정보가 없습니다.');
        }
      } catch (error) {
        if (disposed) return;
        setMember(null);
        setMemberError(error instanceof Error ? error.message : '회원 정보를 불러오지 못했습니다.');
      } finally {
        if (!disposed) {
          setLoadingMember(false);
        }
      }
    };

    void fetchMember();

    return () => {
      disposed = true;
    };
  }, [address]);

  return (
    <main className="min-h-screen pb-24 pt-12 md:pt-16">
      <section className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-12">
          <span className="mb-4 block font-display text-xs font-bold uppercase tracking-[0.22em] text-monolith-primaryContainer">
            Member Space
          </span>
          <h1 className="max-w-3xl text-5xl font-bold leading-none tracking-[-0.06em] text-monolith-onSurface md:text-6xl">
            마이페이지
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-monolith-onSurfaceMuted md:text-lg">
            연결된 지갑과 회원 정보를 확인하고, 개인 출석 QR을 바로 사용할 수 있습니다.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-monolith-outlineVariant/30 bg-monolith-surfaceLowest p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-monolith-primaryContainer">
                    Wallet Session
                  </p>
                  <h2 className="mt-3 text-2xl font-bold tracking-[-0.04em] text-monolith-onSurface">지갑 연결 상태</h2>
                </div>
                <span className="rounded-full bg-monolith-secondaryContainer px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-monolith-primaryContainer">
                  {isConnected && address ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              {isConnected && address ? (
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <InfoTile label="지갑 주소" value={address} icon={<Wallet className="h-4 w-4" />} mono />
                  <InfoTile label="네트워크" value={chainName ?? 'Wallet'} icon={<ShieldCheck className="h-4 w-4" />} />
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-monolith-outlineVariant/35 bg-monolith-surfaceLow p-6">
                  <p className="text-sm leading-7 text-monolith-onSurfaceMuted">
                    지갑이 연결되어 있지 않습니다. 연결 후 회원 정보를 자동으로 조회합니다.
                  </p>
                  <button
                    type="button"
                    onClick={() => void openWalletConnectModal()}
                    className="interactive-soft mt-4 inline-flex items-center gap-2 rounded-xl bg-monolith-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-monolith-primaryContainer"
                  >
                    <Wallet className="h-4 w-4" />
                    지갑 연결하기
                  </button>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-monolith-outlineVariant/30 bg-monolith-surfaceLowest p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-monolith-primaryContainer">
                    Member Profile
                  </p>
                  <h2 className="mt-3 text-2xl font-bold tracking-[-0.04em] text-monolith-onSurface">회원 정보</h2>
                </div>
                <UserRound className="h-5 w-5 text-monolith-primaryContainer" />
              </div>

              {loadingMember ? (
                <div className="mt-6 flex items-center justify-center rounded-2xl bg-monolith-surfaceLow py-12 text-sm text-monolith-onSurfaceMuted">
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  회원 정보 불러오는 중
                </div>
              ) : member ? (
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <InfoTile label="이름" value={member.name} icon={<BadgeCheck className="h-4 w-4" />} />
                  <InfoTile label="기수" value={`${member.cohort}기`} icon={<ShieldCheck className="h-4 w-4" />} />
                  <InfoTile label="전공" value={member.major} icon={<UserRound className="h-4 w-4" />} />
                  <InfoTile
                    label="파트"
                    value={AFFILIATION_LABELS[member.affiliation] ?? member.affiliation}
                    icon={<BadgeCheck className="h-4 w-4" />}
                  />
                  <InfoTile label="권한" value={member.role} icon={<ShieldCheck className="h-4 w-4" />} />
                  <InfoTile label="상태" value={member.is_active ? '활성 회원' : '비활성 회원'} icon={<BadgeCheck className="h-4 w-4" />} />
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-monolith-outlineVariant/35 bg-monolith-surfaceLow p-6">
                  <p className="text-sm leading-7 text-monolith-onSurfaceMuted">
                    {memberError ?? '연결된 지갑 기준 회원 정보를 찾지 못했습니다.'}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      href="/signup"
                      className="interactive-soft inline-flex items-center gap-2 rounded-xl border border-monolith-outlineVariant/30 bg-monolith-surface px-4 py-2.5 text-sm font-semibold text-monolith-onSurface transition hover:bg-monolith-surfaceHigh"
                    >
                      회원 등록
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/wallet-link"
                      className="interactive-soft inline-flex items-center gap-2 rounded-xl border border-monolith-outlineVariant/30 bg-monolith-surface px-4 py-2.5 text-sm font-semibold text-monolith-onSurface transition hover:bg-monolith-surfaceHigh"
                    >
                      지갑 연동 관리
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              )}
            </section>
          </div>

          <div>
            <PersonalAttendanceQrCard />
          </div>
        </div>
      </section>
    </main>
  );
}

type InfoTileProps = {
  label: string;
  value: string;
  icon: React.ReactNode;
  mono?: boolean;
};

function InfoTile({ label, value, icon, mono = false }: InfoTileProps) {
  return (
    <div className="rounded-2xl border border-monolith-outlineVariant/25 bg-monolith-surfaceLow p-4">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-monolith-primaryContainer">
        {icon}
        <span>{label}</span>
      </div>
      <p className={['mt-3 break-all text-sm text-monolith-onSurface', mono ? 'font-mono' : 'font-semibold'].join(' ')}>
        {value}
      </p>
    </div>
  );
}
