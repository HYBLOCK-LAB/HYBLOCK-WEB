'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BadgeCheck,
  CircleCheck,
  Copy,
  ExternalLink,
  Check,
  LoaderCircle,
  ShieldCheck,
  UserRound,
  Wallet,
  Award,
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
  is_admin: boolean;
};

type Eligibility = {
  memberId: number | null;
  eligible: boolean;
  alreadyMinted: boolean;
  missingTypes: string[];
  currentCount: number;
  totalRequired: number;
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

  const [eligibility, setEligibility] = useState<Eligibility | null>(null);
  const [loadingEligibility, setLoadingEligibility] = useState(false);
  const [minting, setMinting] = useState(false);
  const [mintTxHash, setMintTxHash] = useState<string | null>(null);
  const [mintError, setMintError] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);

  useEffect(() => {
    if (!address) {
      setMember(null);
      setMemberError(null);
      setLoadingMember(false);
      setEligibility(null);
      return;
    }

    let disposed = false;

    const fetchData = async () => {
      setLoadingMember(true);
      setLoadingEligibility(true);
      setMemberError(null);

      try {
        const [memberRes, eligibilityRes] = await Promise.all([
          fetch(`/api/members/by-wallet?wallet=${encodeURIComponent(address)}`),
          fetch(`/api/certificates/sbt-eligibility?wallet=${encodeURIComponent(address)}`)
        ]);

        const memberResult = await memberRes.json();
        const eligibilityResult = await eligibilityRes.json();

        if (disposed) return;

        if (memberRes.ok) {
          setMember(memberResult.member ?? null);
          if (!memberResult.member) setMemberError('회원 정보를 찾을 수 없습니다.');
        }
        
        if (eligibilityRes.ok) {
          setEligibility(eligibilityResult);
        }
      } catch (error) {
        if (disposed) return;
        setMemberError('데이터를 불러오지 못했습니다.');
      } finally {
        if (!disposed) {
          setLoadingMember(false);
          setLoadingEligibility(false);
        }
      }
    };

    void fetchData();

    return () => {
      disposed = true;
    };
  }, [address]);

  const handleMintSbt = async () => {
    if (!address || !eligibility?.eligible || eligibility.alreadyMinted) return;

    try {
      setMinting(true);
      setMintError(null);

      const memberWallet = member?.wallet_address?.toLowerCase() ?? null;
      const activeWallet = address.toLowerCase();
      if (memberWallet && memberWallet !== activeWallet) {
        throw new Error('현재 마이페이지 회원 정보의 지갑과 연결된 지갑이 다릅니다. 다시 로그인하거나 지갑을 다시 연결하세요.');
      }

      const response = await fetch('/api/certificates/mint-sbt', {
        method: 'POST',
      });

      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
        txHash?: string;
      };

      if (!response.ok) {
        throw new Error(result.error ?? 'SBT 발급에 실패했습니다.');
      }

      setMintTxHash(result.txHash ?? null);
      setEligibility((prev) => (prev ? { ...prev, alreadyMinted: true } : prev));
    } catch (err) {
      console.error('SBT Mint Error:', err);
      setMintError(err instanceof Error ? err.message : 'SBT 발급 중 오류가 발생했습니다.');
    } finally {
      setMinting(false);
    }
  };

  const handleCopyAddress = async () => {
    if (!address) return;

    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(true);
      window.setTimeout(() => setCopiedAddress(false), 1600);
    } catch (error) {
      console.error('Copy wallet address error:', error);
    }
  };

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
                  <InfoTile
                    label="지갑 주소"
                    value={address}
                    icon={<Wallet className="h-4 w-4" />}
                    mono
                    action={
                      <button
                        type="button"
                        onClick={() => void handleCopyAddress()}
                        className="interactive-soft inline-flex items-center gap-1 rounded-lg border border-monolith-outlineVariant/25 bg-monolith-surfaceLowest px-2.5 py-1 text-[11px] font-bold text-monolith-primaryContainer"
                      >
                        {copiedAddress ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {copiedAddress ? '복사됨' : '복사'}
                      </button>
                    }
                  />
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
                  <InfoTile label="권한" value={member.is_admin ? 'admin' : member.role} icon={<ShieldCheck className="h-4 w-4" />} />
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
            
            {/* SBT Minting Section */}
            <section className="mt-8 rounded-2xl border border-monolith-outlineVariant/30 bg-monolith-surfaceLowest p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-monolith-primaryContainer">
                    SBT Certificate
                  </p>
                  <h2 className="mt-3 text-2xl font-bold tracking-[-0.04em] text-monolith-onSurface">수료증 발급</h2>
                </div>
                <Award className="h-5 w-5 text-monolith-primaryContainer" />
              </div>

              {loadingEligibility ? (
                <div className="mt-6 flex items-center justify-center py-8">
                  <LoaderCircle className="h-6 w-6 animate-spin text-monolith-onSurfaceMuted" />
                </div>
              ) : eligibility ? (
                <div className="mt-6 space-y-6">
                  {/* Attestation Status Tiles */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {['attendance', 'external_activity', 'assignment', 'participation_period'].map((type) => {
                      const isMet = !eligibility.missingTypes.includes(type);
                      return (
                        <div 
                          key={type} 
                          className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all ${
                            isMet ? 'border-monolith-primaryContainer bg-monolith-primaryFixed text-monolith-primary' : 'border-monolith-outlineVariant/20 bg-monolith-surfaceLow text-monolith-onSurfaceMuted opacity-50'
                          }`}
                        >
                          <CircleCheck className={`h-5 w-5 ${isMet ? 'text-monolith-primary' : 'text-monolith-onSurfaceMuted'}`} />
                          <span className="mt-2 text-[10px] font-bold uppercase tracking-tight">
                            {type === 'attendance' ? '출석' : type === 'external_activity' ? '외부활동' : type === 'assignment' ? '산출물' : '기간'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Minting Action */}
                  {eligibility.alreadyMinted ? (
                    <div className="flex items-center gap-3 rounded-xl bg-monolith-primaryFixed px-4 py-3 text-monolith-primary">
                      <BadgeCheck className="h-5 w-5" />
                      <p className="text-sm font-bold">이미 수료증이 발급되었습니다.</p>
                    </div>
                  ) : mintTxHash ? (
                    <div className="flex flex-col items-center gap-3 rounded-xl bg-[#e6f4ea] p-6 text-center text-[#1a6831]">
                      <BadgeCheck className="h-10 w-10" />
                      <div>
                        <p className="text-lg font-black">수료증 발급 완료!</p>
                        <p className="mt-1 text-sm opacity-80">학회의 정식 수료자로 등록되셨습니다.</p>
                      </div>
                      <a 
                        href={`https://sepolia.etherscan.io/tx/${mintTxHash}`}
                        target="_blank" 
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-bold underline"
                      >
                        View on Etherscan <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm leading-6 text-monolith-onSurfaceMuted">
                        4가지 증명(출석, 외부활동, 산출물, 참여기간)을 모두 획득하면 공식 SBT 수료증을 민팅할 수 있습니다.
                      </p>
                      <button
                        type="button"
                        onClick={handleMintSbt}
                        disabled={!eligibility.eligible || minting}
                        className="interactive-soft flex w-full items-center justify-center gap-2 rounded-xl border border-[#0e4a84] bg-[linear-gradient(135deg,#003361,#0e4a84)] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(0,51,97,0.2)] transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {minting ? (
                          <>
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                            발급 처리 중...
                          </>
                        ) : (
                          <>
                            <Award className="h-4 w-4" />
                            SBT 수료증 발급하기
                          </>
                        )}
                      </button>
                      {mintError ? (
                        <p className="text-center text-[11px] font-semibold text-monolith-error">{mintError}</p>
                      ) : null}
                      {!eligibility.eligible && (
                        <p className="text-center text-[11px] font-semibold text-monolith-error">
                          모든 증명을 획득해야 발급 가능합니다. ({eligibility.currentCount}/{eligibility.totalRequired})
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </section>
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
  action?: React.ReactNode;
};

function InfoTile({ label, value, icon, mono = false, action }: InfoTileProps) {
  return (
    <div className="rounded-2xl border border-monolith-outlineVariant/25 bg-monolith-surfaceLow p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-monolith-primaryContainer">
          {icon}
          <span>{label}</span>
        </div>
        {action}
      </div>
      <p className={['mt-3 break-all text-sm text-monolith-onSurface', mono ? 'font-mono' : 'font-semibold'].join(' ')}>
        {value}
      </p>
    </div>
  );
}
