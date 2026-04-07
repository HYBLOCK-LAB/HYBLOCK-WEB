'use client';

import { useEffect, useRef, useState } from 'react';
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { parseEventLogs, type Hex } from 'viem';
import { AlertCircle, Award, BadgeCheck, ChevronRight, ExternalLink, LoaderCircle, ShieldCheck, Users } from 'lucide-react';
import {
  CERTIFICATE_TYPE_LABELS,
  EAS_ABI,
  HYBLOCK_ISSUER_ABI,
  HYBLOCK_ISSUER_ADDRESS,
  computePersonalDataHash,
  getEasContractAddress,
  isHyblockIssuerConfigured,
  isEasSchemaConfigured,
  type CertificateType,
} from '@/lib/eas';
import type { CertificateCandidate, IssuedAttestationSummary, MemberCertificateDetail } from '@/lib/supabase-certificate';

type AttestState = 'idle' | 'signing' | 'pending' | 'success' | 'error';

type PendingAttest = {
  candidate: CertificateCandidate;
  type: CertificateType;
  txHash: Hex | null;
};

type SelectedEntry =
  | { kind: 'pending'; item: CertificateCandidate }
  | { kind: 'issued'; item: IssuedAttestationSummary };

type SuccessInfo = {
  uid: string;
  createdAt: string;
};

const AFFILIATION_LABELS: Record<string, string> = {
  development: '개발팀',
  business: '비즈니스팀',
};

const CERTIFICATE_TYPE_ARRAY: CertificateType[] = ['attendance', 'external_activity', 'assignment', 'participation_period'];

export default function CertificateManager() {
  const { address, chain } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const [selectedType, setSelectedType] = useState<CertificateType>('attendance');
  const [candidates, setCandidates] = useState<CertificateCandidate[]>([]);
  const [issuedAttestations, setIssuedAttestations] = useState<IssuedAttestationSummary[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<SelectedEntry | null>(null);
  const [memberDetail, setMemberDetail] = useState<MemberCertificateDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [attestState, setAttestState] = useState<AttestState>('idle');
  const [attestError, setAttestError] = useState<string | null>(null);
  const [pendingAttest, setPendingAttest] = useState<PendingAttest | null>(null);
  const [successInfo, setSuccessInfo] = useState<SuccessInfo | null>(null);

  const pendingAttestRef = useRef<PendingAttest | null>(null);
  pendingAttestRef.current = pendingAttest;

  const { data: txReceipt } = useWaitForTransactionReceipt({
    hash: pendingAttest?.txHash ?? undefined,
    query: { enabled: Boolean(pendingAttest?.txHash) },
  });

  // Fetch member list when type changes
  useEffect(() => {
    void fetchLists(selectedType);
    setSelectedEntry(null);
    setMemberDetail(null);
    setAttestState('idle');
    setAttestError(null);
    setSuccessInfo(null);
  }, [selectedType]);

  // Handle receipt after tx confirmed
  useEffect(() => {
    if (!txReceipt || !pendingAttestRef.current?.txHash) return;

    void (async () => {
      try {
        const logs = parseEventLogs({
          abi: EAS_ABI,
          logs: txReceipt.logs,
          eventName: 'Attested',
        });

        const uid = logs[0]?.args?.uid as Hex | undefined;
        if (!uid) {
          throw new Error('트랜잭션에서 Attestation UID를 찾지 못했습니다.');
        }

        const current = pendingAttestRef.current!;
        const personalDataHash = computePersonalDataHash(
          current.candidate.wallet_address as `0x${string}`,
          current.candidate.cohort,
        );

        const res = await fetch('/api/certificates/save-attestation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wallet_address: current.candidate.wallet_address,
            attestation_type: current.type,
            eas_uid: uid,
            personal_data_hash: personalDataHash,
            revealed_data: buildRevealedData(current.candidate, current.type),
            is_graduated: false,
          }),
        });

        if (!res.ok) {
          const json = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(json.error ?? '증명 저장에 실패했습니다.');
        }

        setAttestState('success');
        setSuccessInfo({
          uid,
          createdAt: new Date().toISOString(),
        });
        setPendingAttest(null);
        setCandidates((prev) => prev.filter((c) => c.wallet_address !== current.candidate.wallet_address));
        const issuedItem: IssuedAttestationSummary = {
          wallet_address: current.candidate.wallet_address,
          name: current.candidate.name,
          major: current.candidate.major,
          affiliation: current.candidate.affiliation,
          cohort: current.candidate.cohort,
          eas_uid: uid,
          created_at: new Date().toISOString(),
          attestation_type: current.type,
          criteria_details: buildRevealedData(current.candidate, current.type),
        };
        setIssuedAttestations((prev) => [issuedItem, ...prev]);
        setSelectedEntry({ kind: 'issued', item: issuedItem });
      } catch (err) {
        setAttestError(err instanceof Error ? err.message : '증명 처리 중 오류가 발생했습니다.');
        setAttestState('error');
        setPendingAttest(null);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txReceipt]);

  async function fetchLists(type: CertificateType) {
    setListLoading(true);
    setListError(null);
    try {
      const [candidateRes, issuedRes] = await Promise.all([
        fetch(`/api/certificates/members?type=${type}`),
        fetch(`/api/certificates/issued?type=${type}`),
      ]);

      if (!candidateRes.ok || !issuedRes.ok) throw new Error('멤버 목록 로드 실패');

      const [candidateData, issuedData] = await Promise.all([
        candidateRes.json() as Promise<CertificateCandidate[]>,
        issuedRes.json() as Promise<IssuedAttestationSummary[]>,
      ]);

      setCandidates(candidateData);
      setIssuedAttestations(issuedData);
    } catch {
      setListError('멤버 목록을 불러오지 못했습니다.');
    } finally {
      setListLoading(false);
    }
  }

  async function handleSelectEntry(entry: SelectedEntry) {
    const walletAddress = entry.item.wallet_address;

    setSelectedEntry(entry);
    setMemberDetail(null);
    setAttestState(entry.kind === 'issued' ? 'success' : 'idle');
    setAttestError(null);
    setSuccessInfo(
      entry.kind === 'issued'
        ? {
            uid: entry.item.eas_uid,
            createdAt: entry.item.created_at ?? new Date().toISOString(),
          }
        : null,
    );
    setDetailLoading(true);

    try {
      const res = await fetch(`/api/certificates/member-detail?wallet=${walletAddress}`);
      if (!res.ok) throw new Error('상세 정보 로드 실패');
      const data = (await res.json()) as MemberCertificateDetail;
      setMemberDetail(data);
    } catch {
      // non-blocking; detail is supplementary
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleAttest() {
    if (selectedEntry?.kind !== 'pending' || !address) return;
    const selectedCandidate = selectedEntry.item;

    const contractAddress = getEasContractAddress(chain?.id ?? 0);
    if (!contractAddress) {
      setAttestError('지원하지 않는 네트워크입니다. Mainnet 또는 Sepolia로 전환해주세요.');
      setAttestState('error');
      return;
    }

    if (!isEasSchemaConfigured()) {
      setAttestError('EAS Schema UID가 설정되지 않았습니다. 환경변수를 확인해주세요.');
      setAttestState('error');
      return;
    }

    setAttestError(null);
    setAttestState('signing');

    try {
      const personalDataHash = computePersonalDataHash(
        selectedCandidate.wallet_address as `0x${string}`,
        selectedCandidate.cohort,
      );
      const revealedData = JSON.stringify(buildRevealedData(selectedCandidate, selectedType));

      const txHash = await writeContractAsync({
        address: HYBLOCK_ISSUER_ADDRESS,
        abi: HYBLOCK_ISSUER_ABI,
        functionName: 'issue',
        args: [
          selectedCandidate.wallet_address as `0x${string}`,
          personalDataHash,
          selectedType,
          revealedData,
          false, // isGraduated - 일단 false로 설정 (수료증 발급 시 로직 확장 가능)
        ],
      });

      setPendingAttest({ candidate: selectedCandidate, type: selectedType, txHash });
      setAttestState('pending');
    } catch (err) {
      const msg = err instanceof Error ? err.message.toLowerCase() : '';
      if (msg.includes('user rejected') || msg.includes('rejected the request')) {
        setAttestError('서명이 취소되었습니다.');
      } else {
        setAttestError(err instanceof Error ? err.message : '증명 발급 중 오류가 발생했습니다.');
      }
      setAttestState('error');
    }
  }

  const schemaConfigured = isEasSchemaConfigured();
  const issuerConfigured = isHyblockIssuerConfigured();

  return (
    <div className="space-y-6">
      {/* Certificate type selector */}
      <div className="flex flex-wrap gap-2">
        {CERTIFICATE_TYPE_ARRAY.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setSelectedType(type)}
            className={[
              'interactive-soft rounded-full border px-4 py-2 text-sm font-semibold transition-all',
              selectedType === type
                ? 'border-monolith-primaryContainer bg-monolith-primaryFixed text-monolith-primary shadow-[0_10px_20px_rgba(0,51,97,0.12)]'
                : 'border-monolith-outlineVariant/30 bg-monolith-surfaceLow text-monolith-onSurface hover:border-monolith-primaryContainer/30 hover:bg-monolith-surfaceLowest',
            ].join(' ')}
          >
            {CERTIFICATE_TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      {/* Schema UID warning */}
      {!schemaConfigured || !issuerConfigured ? (
        <div className="flex items-start gap-2.5 rounded-2xl bg-[#fff8e1] px-4 py-4 text-sm font-semibold text-[#8a5a00]">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {!schemaConfigured ? (
              <>
                EAS Schema UID가 설정되지 않았습니다. <span className="font-mono text-xs">NEXT_PUBLIC_EAS_SCHEMA</span> 환경변수를 확인해주세요.
              </>
            ) : (
              <>
                Issuer 컨트랙트 주소가 설정되지 않았습니다. <span className="font-mono text-xs">NEXT_PUBLIC_HYBLOCK_ISSUER_ADDRESS</span> 환경변수를 확인해주세요.
              </>
            )}{' '}
            테스트 발급은 불가합니다.
          </span>
        </div>
      ) : null}

      {/* Two-column layout: member list + detail panel */}
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">

        {/* Member list */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-monolith-onSurfaceMuted" />
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-monolith-onSurfaceMuted">
              발급 대기 멤버
            </p>
            {!listLoading && (
              <span className="ml-auto rounded-full bg-monolith-primaryFixed px-2.5 py-0.5 text-xs font-bold text-monolith-primary">
                {candidates.length}
              </span>
            )}
          </div>

          {listLoading ? (
            <div className="flex items-center justify-center rounded-2xl bg-monolith-surfaceLow py-12">
              <LoaderCircle className="h-5 w-5 animate-spin text-monolith-onSurfaceMuted" />
            </div>
          ) : listError ? (
            <div className="flex items-start gap-2 rounded-2xl bg-monolith-errorContainer px-4 py-4 text-sm text-monolith-error">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {listError}
            </div>
          ) : candidates.length === 0 ? (
            <div className="rounded-2xl bg-monolith-surfaceLow px-5 py-10 text-center">
              <BadgeCheck className="mx-auto h-8 w-8 text-monolith-primaryFixed" />
              <p className="mt-3 text-sm font-semibold text-monolith-onSurfaceMuted">
                발급 대기 중인 멤버가 없습니다.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {candidates.map((candidate) => {
                const isSelected =
                  selectedEntry?.kind === 'pending' &&
                  selectedEntry.item.wallet_address === candidate.wallet_address;
                return (
                  <button
                    key={candidate.wallet_address}
                    type="button"
                    onClick={() => handleSelectEntry({ kind: 'pending', item: candidate })}
                    className={[
                      'interactive-soft group flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left transition-all',
                      isSelected
                        ? 'bg-monolith-primary text-white shadow-[0_12px_28px_rgba(0,51,97,0.2)]'
                        : 'bg-monolith-surfaceLow text-monolith-onSurface hover:bg-monolith-surfaceLowest hover:shadow-[0_10px_24px_rgba(0,51,97,0.07)]',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black',
                        isSelected ? 'bg-white/20 text-white' : 'bg-monolith-primaryFixed text-monolith-primary',
                      ].join(' ')}
                    >
                      {candidate.name.charAt(0)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{candidate.name}</p>
                      <p className={['mt-0.5 text-xs', isSelected ? 'text-white/70' : 'text-monolith-onSurfaceMuted'].join(' ')}>
                        {candidate.cohort}기 · {AFFILIATION_LABELS[candidate.affiliation] ?? candidate.affiliation}
                      </p>
                    </div>
                    <ChevronRight className={['h-4 w-4 shrink-0 transition-transform', isSelected ? 'text-white/70 translate-x-0.5' : 'text-monolith-onSurfaceMuted/50'].join(' ')} />
                  </button>
                );
              })}
            </div>
          )}

          <div className="pt-4">
            <div className="mb-3 flex items-center gap-2">
              <Award className="h-4 w-4 text-monolith-onSurfaceMuted" />
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-monolith-onSurfaceMuted">
                기발급 증명
              </p>
              {!listLoading && (
                <span className="ml-auto rounded-full bg-monolith-surfaceHigh px-2.5 py-0.5 text-xs font-bold text-monolith-onSurfaceMuted">
                  {issuedAttestations.length}
                </span>
              )}
            </div>

            {listLoading ? null : issuedAttestations.length === 0 ? (
              <div className="rounded-2xl bg-monolith-surfaceLow px-5 py-6 text-center">
                <p className="text-sm font-semibold text-monolith-onSurfaceMuted">아직 발급된 증명이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {issuedAttestations.map((issued) => {
                  const isSelected =
                    selectedEntry?.kind === 'issued' &&
                    selectedEntry.item.wallet_address === issued.wallet_address &&
                    selectedEntry.item.eas_uid === issued.eas_uid;
                  return (
                    <button
                      key={`${issued.wallet_address}-${issued.eas_uid}`}
                      type="button"
                      onClick={() => handleSelectEntry({ kind: 'issued', item: issued })}
                      className={[
                        'interactive-soft group flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left transition-all',
                        isSelected
                          ? 'bg-monolith-primary text-white shadow-[0_12px_28px_rgba(0,51,97,0.2)]'
                          : 'bg-monolith-surfaceLowest text-monolith-onSurface hover:bg-monolith-surfaceLowest/80 hover:shadow-[0_10px_24px_rgba(0,51,97,0.07)]',
                      ].join(' ')}
                    >
                      <span
                        className={[
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black',
                          isSelected ? 'bg-white/20 text-white' : 'bg-monolith-primaryFixed text-monolith-primary',
                        ].join(' ')}
                      >
                        {issued.name.charAt(0)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">{issued.name}</p>
                        <p className={['mt-0.5 text-xs', isSelected ? 'text-white/70' : 'text-monolith-onSurfaceMuted'].join(' ')}>
                          {issued.created_at ? new Date(issued.created_at).toLocaleString('ko-KR') : '발급 시각 없음'}
                        </p>
                      </div>
                      <ChevronRight className={['h-4 w-4 shrink-0 transition-transform', isSelected ? 'text-white/70 translate-x-0.5' : 'text-monolith-onSurfaceMuted/50'].join(' ')} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Certificate detail panel */}
        <div className="rounded-[2rem] bg-monolith-surfaceLow p-6 shadow-[0_20px_50px_rgba(0,51,97,0.06)]">
          {!selectedEntry ? (
            <EmptyDetailState />
          ) : (
            <DetailPanel
              entry={selectedEntry}
              detail={memberDetail}
              detailLoading={detailLoading}
              selectedType={selectedType}
              attestState={attestState}
              attestError={attestError}
              successInfo={successInfo}
              onAttest={handleAttest}
              isWalletConnected={Boolean(address)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Sub-components ----

function EmptyDetailState() {
  return (
    <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-monolith-primaryFixed">
        <ShieldCheck className="h-6 w-6 text-monolith-primary" />
      </span>
      <p className="mt-5 text-sm font-bold text-monolith-onSurface">멤버를 선택하세요</p>
      <p className="mt-2 max-w-[240px] text-xs leading-6 text-monolith-onSurfaceMuted">
        좌측 목록에서 발급 대기 멤버를 선택하면 상세 정보와 증명 발급 버튼이 표시됩니다.
      </p>
    </div>
  );
}

type DetailPanelProps = {
  entry: SelectedEntry;
  detail: MemberCertificateDetail | null;
  detailLoading: boolean;
  selectedType: CertificateType;
  attestState: AttestState;
  attestError: string | null;
  successInfo: SuccessInfo | null;
  onAttest: () => void;
  isWalletConnected: boolean;
};

function DetailPanel({ entry, detail, detailLoading, selectedType, attestState, attestError, successInfo, onAttest, isWalletConnected }: DetailPanelProps) {
  const isBusy = attestState === 'signing' || attestState === 'pending';
  const candidate = entry.item;
  const isIssuedEntry = entry.kind === 'issued';

  return (
    <div className="space-y-6">
      {/* Member info header */}
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-monolith-primaryFixed text-xl font-black text-monolith-primary">
          {candidate.name.charAt(0)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-xl font-black tracking-[-0.03em] text-monolith-primary">{candidate.name}</h2>
            <span className="rounded-full bg-monolith-primaryFixed px-3 py-0.5 text-xs font-bold text-monolith-primary">
              {candidate.cohort}기
            </span>
            <span className="rounded-full bg-monolith-surfaceHigh px-3 py-0.5 text-xs font-bold text-monolith-onSurfaceMuted">
              {AFFILIATION_LABELS[candidate.affiliation] ?? candidate.affiliation}
            </span>
          </div>
          <p className="mt-1 text-sm text-monolith-onSurfaceMuted">{candidate.major}</p>
          <p className="mt-1 font-mono text-xs text-monolith-onSurfaceMuted/60">
            {candidate.wallet_address.slice(0, 10)}...{candidate.wallet_address.slice(-8)}
          </p>
        </div>
      </div>

      {/* Certificate type label */}
      <div className="rounded-xl bg-monolith-primaryFixed/60 px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-monolith-primaryContainer">
          증명 유형
        </p>
        <p className="mt-1 font-display text-lg font-black tracking-tight text-monolith-primary">
          {CERTIFICATE_TYPE_LABELS[selectedType]}
        </p>
      </div>

      {isIssuedEntry && successInfo ? (
        <div className="rounded-xl border border-[#1a6831]/15 bg-[#e6f4ea] px-4 py-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1a6831]">기발급 증명 정보</p>
          <p className="mt-2 break-all font-mono text-xs text-[#1a6831]">{successInfo.uid}</p>
          <p className="mt-2 text-xs text-[#1a6831]/75">
            발급 시각: {new Date(successInfo.createdAt).toLocaleString('ko-KR')}
          </p>
        </div>
      ) : null}

      {/* Criteria details from semester_criteria_tracking */}
      {candidate.criteria_details ? (
        <CriteriaDetailsCard type={selectedType} details={candidate.criteria_details} />
      ) : null}

      {/* Individual records */}
      {detailLoading ? (
        <div className="flex items-center gap-2 text-xs text-monolith-onSurfaceMuted">
          <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
          <span>세부 기록을 불러오는 중...</span>
        </div>
      ) : detail ? (
        <RecordList type={selectedType} detail={detail} />
      ) : null}

      {/* Attestation result */}
      {attestState === 'success' ? (
        <div className="flex items-center gap-3 rounded-2xl bg-[#e6f4ea] px-5 py-4">
          <BadgeCheck className="h-5 w-5 shrink-0 text-[#1a6831]" />
          <div>
            <p className="text-sm font-bold text-[#1a6831]">{isIssuedEntry ? '기발급 증명' : '증명 발급 완료'}</p>
            <p className="mt-0.5 text-xs text-[#1a6831]/70">
              {successInfo?.uid
                ? `EAS UID ${successInfo.uid.slice(0, 10)}...${successInfo.uid.slice(-8)}`
                : 'EAS UID가 DB에 기록되었습니다.'}
            </p>
          </div>
        </div>
      ) : null}

      {attestError ? (
        <div className="flex items-start gap-2.5 rounded-2xl bg-monolith-errorContainer px-4 py-4 text-sm text-monolith-error">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{attestError}</span>
        </div>
      ) : null}

      {/* Attest button */}
      {attestState !== 'success' && !isIssuedEntry ? (
        <button
          type="button"
          onClick={onAttest}
          disabled={isBusy || !isWalletConnected}
          className="interactive-soft flex w-full items-center justify-center gap-2 rounded-xl border border-[#0e4a84] bg-[linear-gradient(135deg,#003361,#0e4a84)] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(0,51,97,0.2)] transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isBusy ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              {attestState === 'signing' ? '서명 요청 중...' : '트랜잭션 처리 중...'}
            </>
          ) : (
            <>
              <Award className="h-4 w-4" />
              증명 발급
            </>
          )}
        </button>
      ) : null}

      {!isWalletConnected ? (
        <p className="text-center text-xs text-monolith-onSurfaceMuted">증명 발급은 지갑 연결 후 가능합니다.</p>
      ) : null}
    </div>
  );
}

function CriteriaDetailsCard({ type, details }: { type: CertificateType; details: Record<string, unknown> }) {
  const entries: Array<{ label: string; value: string }> = [];

  if (type === 'attendance') {
    if (details.present_count !== undefined) entries.push({ label: '출석', value: `${details.present_count}회` });
    if (details.late_count !== undefined) entries.push({ label: '지각', value: `${details.late_count}회` });
    if (details.total_sessions !== undefined) entries.push({ label: '전체 세션', value: `${details.total_sessions}회` });
  } else if (type === 'external_activity') {
    if (details.activity_count !== undefined) entries.push({ label: '외부 활동', value: `${details.activity_count}회` });
  } else if (type === 'assignment') {
    if (details.submission_count !== undefined) entries.push({ label: '제출 건수', value: `${details.submission_count}건` });
    if (details.affiliation !== undefined) entries.push({ label: '소속', value: AFFILIATION_LABELS[details.affiliation as string] ?? String(details.affiliation) });
  } else if (type === 'participation_period') {
    if (details.completed_semesters !== undefined) entries.push({ label: '이수 학기', value: `${details.completed_semesters}학기` });
    if (details.minimum_required !== undefined) entries.push({ label: '최소 요건', value: `${details.minimum_required}학기` });
    if (details.current_status !== undefined) entries.push({ label: '상태', value: String(details.current_status) });
  }

  if (entries.length === 0) return null;

  return (
    <div className="rounded-xl border border-monolith-outlineVariant/20 bg-monolith-surfaceLowest p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-monolith-onSurfaceMuted">수료 조건 달성 현황</p>
      <div className="mt-3 flex flex-wrap gap-3">
        {entries.map((entry) => (
          <div key={entry.label} className="rounded-lg bg-monolith-surfaceLow px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-monolith-onSurfaceMuted">{entry.label}</p>
            <p className="mt-0.5 text-base font-black text-monolith-primary">{entry.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecordList({ type, detail }: { type: CertificateType; detail: MemberCertificateDetail }) {
  if (type === 'attendance') {
    const records = detail.attendance;
    if (records.length === 0) return null;
    return (
      <RecordSection title="출석 기록" count={records.length}>
        {records.map((r) => (
          <RecordRow
            key={r.attendance_id}
            primary={r.session_name ?? r.session_id}
            secondary={r.attended_at ? new Date(r.attended_at).toLocaleDateString('ko-KR') : '-'}
            badge={r.status === 'present' ? { label: '출석', tone: 'primary' } : { label: '지각', tone: 'warning' }}
          />
        ))}
      </RecordSection>
    );
  }

  if (type === 'external_activity') {
    const records = detail.external_activity;
    if (records.length === 0) return null;
    return (
      <RecordSection title="외부 활동 기록" count={records.length}>
        {records.map((r) => (
          <RecordRow
            key={r.activity_id}
            primary={r.session_name ?? r.session_id}
            secondary={
              <a href={r.evidence_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-monolith-primaryContainer hover:underline">
                증빙 링크
                <ExternalLink className="h-3 w-3" />
              </a>
            }
          />
        ))}
      </RecordSection>
    );
  }

  if (type === 'assignment') {
    const records = detail.assignment;
    if (records.length === 0) return null;
    return (
      <RecordSection title="산출물 기록" count={records.length}>
        {records.map((r) => (
          <RecordRow
            key={r.assignment_id}
            primary={r.assignment_title}
            secondary={AFFILIATION_LABELS[r.affiliation] ?? r.affiliation}
            badge={r.evidence_url ? { label: '증빙 있음', tone: 'primary' } : undefined}
          />
        ))}
      </RecordSection>
    );
  }

  if (type === 'participation_period') {
    return (
      <div className="rounded-xl border border-monolith-outlineVariant/20 bg-monolith-surfaceLowest px-4 py-4">
        <p className="text-sm font-semibold text-monolith-onSurface">참여 기간 증명</p>
        <p className="mt-1 text-xs leading-6 text-monolith-onSurfaceMuted">
          참여 기간은 개별 레코드보다 학기별 집계 기준으로 판정됩니다. 위의 달성 현황 카드와 `semester_criteria_tracking.details` 값을 기준으로 발급하세요.
        </p>
      </div>
    );
  }

  return null;
}

function RecordSection({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-monolith-onSurfaceMuted">{title}</p>
        <span className="rounded-full bg-monolith-surfaceHigh px-2 py-0.5 text-[10px] font-bold text-monolith-onSurfaceMuted">
          {count}
        </span>
      </div>
      <div className="space-y-1.5 overflow-hidden rounded-2xl border border-monolith-outlineVariant/20 bg-monolith-surfaceLowest">
        {children}
      </div>
    </div>
  );
}

type RecordBadge = { label: string; tone: 'primary' | 'warning' | 'muted' };

function RecordRow({
  primary,
  secondary,
  badge,
}: {
  primary: string;
  secondary: React.ReactNode;
  badge?: RecordBadge;
}) {
  const badgeTone =
    badge?.tone === 'primary'
      ? 'bg-monolith-primaryFixed text-monolith-primary'
      : badge?.tone === 'warning'
        ? 'bg-[#fff1cc] text-[#8a5a00]'
        : 'bg-monolith-surfaceLow text-monolith-onSurfaceMuted';

  return (
    <div className="flex items-center justify-between gap-3 border-b border-monolith-outlineVariant/10 px-4 py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-monolith-onSurface">{primary}</p>
        <p className="mt-0.5 text-xs text-monolith-onSurfaceMuted">{secondary}</p>
      </div>
      {badge ? (
        <span className={['shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]', badgeTone].join(' ')}>
          {badge.label}
        </span>
      ) : null}
    </div>
  );
}

// ---- Helpers ----

function buildRevealedData(candidate: CertificateCandidate, type: CertificateType): Record<string, unknown> {
  return {
    name: candidate.name,
    major: candidate.major,
    affiliation: candidate.affiliation,
    cohort: candidate.cohort,
    certificate_type: type,
    criteria_details: candidate.criteria_details,
  };
}
