'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, QrCode, SquareArrowOutUpRight, X } from 'lucide-react';
import { encodeEvent } from '@/lib/utils';
import AdminSessionAttendanceQr from '@/components/admin/AdminSessionAttendanceQr';

type AttendanceRow = Record<string, string>;
type ParticipantStatus = 'present' | 'late' | 'absent' | 'nonParticipation';
type EventParticipant = {
  memberId: number;
  name: string;
  status: ParticipantStatus;
};

type EventPayload = {
  events: string[];
  attendanceData: AttendanceRow[];
  activeEvent: { name: string; activatedAt: string; checkInCode?: string | null; sessionType?: string; targetAffiliation?: string | null } | null;
  activeEvents: Array<{ name: string; activatedAt: string; checkInCode?: string | null; sessionType?: string; targetAffiliation?: string | null }>;
  categories: Record<string, string>;
  contents: Record<string, string | null>;
  statuses: Record<string, 'scheduled' | 'in_progress' | 'completed' | 'cancelled'>;
};

type TabType = '전체' | '기본 세션' | '심화 세션' | '기타 활동' | '외부 활동' | '해커톤/아이디어톤';
type SessionStatus = EventPayload['statuses'][string];

type EventStats = {
  attendance: number;
  late: number;
  absence: number;
  nonParticipation: number;
};

export default function AdminAttendanceManager() {
  const [data, setData] = useState<EventPayload | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('전체');
  const [loading, setLoading] = useState(true);
  const [processingEvent, setProcessingEvent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState('');
  const [qrModalEvent, setQrModalEvent] = useState<string | null>(null);
  const [statModalEvent, setStatModalEvent] = useState<string | null>(null);
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [participantProcessingId, setParticipantProcessingId] = useState<number | null>(null);

  useEffect(() => {
    setBaseUrl(window.location.origin);
    void fetchData();
  }, []);

  useEffect(() => {
    if (!statModalEvent) {
      setParticipants([]);
      setParticipantsLoading(false);
      setParticipantProcessingId(null);
      return;
    }

    void fetchParticipants(statModalEvent);
  }, [statModalEvent]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/events', { cache: 'no-store' });
      const result = (await response.json()) as EventPayload | { error?: string };
      if (!response.ok) {
        setError('error' in result && result.error ? result.error : '데이터를 불러오지 못했습니다.');
        return;
      }

      setData(result as EventPayload);
    } catch {
      setError('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async (eventName: string) => {
    setParticipantsLoading(true);

    try {
      const response = await fetch(`/api/events?includeParticipants=true&eventName=${encodeURIComponent(eventName)}`, {
        cache: 'no-store',
      });
      const result = (await response.json()) as { participants?: EventParticipant[]; error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? '참여자 데이터를 불러오지 못했습니다.');
      }

      setParticipants(result.participants ?? []);
    } catch {
      setError('참여자 데이터를 불러오지 못했습니다.');
      setParticipants([]);
    } finally {
      setParticipantsLoading(false);
    }
  };

  const formatTargetAffiliation = (targetAffiliation?: string | null) => {
    if (targetAffiliation === 'development') return 'Development';
    if (targetAffiliation === 'business') return 'Business';
    return '전체';
  };

  const handleSetActive = async (eventName: string) => {
    setProcessingEvent(eventName);
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventName, setActive: true }),
      });

      if (!response.ok) {
        throw new Error('세션 활성화 실패');
      }

      await fetchData();
    } catch {
      setError('세션 활성화에 실패했습니다.');
    } finally {
      setProcessingEvent(null);
    }
  };

  const handleDeactivate = async (eventName: string) => {
    if (!window.confirm('세션을 마감하시겠습니까? 남은 인원은 자동으로 결석 처리됩니다.')) {
      return;
    }

    setProcessingEvent(`deactivate:${eventName}`);
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventName, deactivate: true }),
      });

      if (!response.ok) {
        throw new Error('세션 마감 실패');
      }

      await fetchData();
    } catch {
      setError('세션 마감에 실패했습니다.');
    } finally {
      setProcessingEvent(null);
    }
  };

  const handleStatusChange = async (eventName: string, status: SessionStatus) => {
    setProcessingEvent(`status:${eventName}`);
    setError(null);

    try {
      const response = await fetch('/api/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventName, status }),
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? '세션 상태 변경에 실패했습니다.');
      }

      await fetchData();
    } catch {
      setError('세션 상태 변경에 실패했습니다.');
    } finally {
      setProcessingEvent(null);
    }
  };

  const filteredEvents = useMemo(() => {
    if (!data) return [];

    return data.events.filter((event) => {
      if (activeTab === '전체') return true;
      const category = data.categories[event];
      return category === activeTab;
    });
  }, [activeTab, data]);

  const getStatusMeta = (status: EventPayload['statuses'][string] | undefined) => {
    if (status === 'in_progress') {
      return { label: '진행중', className: 'bg-monolith-primary-fixed text-monolith-primary' };
    }
    if (status === 'completed') {
      return { label: '종료', className: 'bg-[#ffe2e0] text-[#b3261e]' };
    }
    if (status === 'cancelled') {
      return { label: '취소', className: 'bg-monolith-surface-container text-monolith-on-surface-muted' };
    }
    return { label: '예정', className: 'bg-monolith-surface-container text-monolith-on-surface-muted' };
  };

  const getStats = (eventName: string): EventStats => {
    if (!data) return { attendance: 0, late: 0, absence: 0, nonParticipation: 0 };

    return data.attendanceData.reduce(
      (acc, row) => {
        const status = row[eventName];
        if (status === 'Attendence') acc.attendance += 1;
        if (status === 'Late') acc.late += 1;
        if (status === 'Absence') acc.absence += 1;
        if (!status) acc.nonParticipation += 1;
        return acc;
      },
      { attendance: 0, late: 0, absence: 0, nonParticipation: 0 },
    );
  };

  const handleParticipantStatusChange = async (eventName: string, memberId: number, status: ParticipantStatus) => {
    setParticipantProcessingId(memberId);
    setError(null);

    try {
      const response = await fetch('/api/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventName, memberId, attendanceStatus: status }),
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? '참여 상태 변경에 실패했습니다.');
      }

      setParticipants((current) =>
        current.map((participant) => (participant.memberId === memberId ? { ...participant, status } : participant)),
      );
      await Promise.all([fetchData(), fetchParticipants(eventName)]);
    } catch {
      setError('참여 상태 변경에 실패했습니다.');
    } finally {
      setParticipantProcessingId(null);
    }
  };

  const getParticipantStatusLabel = (status: ParticipantStatus) => {
    if (status === 'present') return '출석';
    if (status === 'late') return '지각';
    if (status === 'absent') return '결석';
    return '미참여';
  };

  if (loading && !data) {
    return <p className="text-sm text-monolith-on-surface-muted">출석 관리 데이터를 불러오는 중입니다.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-monolith-surface-low p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-monolith-primary-container">현재 활성 세션</p>
            <p className="mt-2 text-sm leading-7 text-monolith-on-surface-muted">
              진행 중인 출석만 표시합니다. 심화 세션은 파트별로 따로 활성화될 수 있고, 공용 세션은 단독으로만 활성화됩니다.
            </p>
          </div>
        </div>
        {data?.activeEvents?.length ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {data.activeEvents.map((activeEvent) => (
              <div
                key={activeEvent.name}
                className="rounded-2xl border border-monolith-outline-variant/20 bg-monolith-surface-lowest p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-monolith-primary-container">
                      {data.categories[activeEvent.name] ?? '미분류'}
                    </p>
                    <h3 className="mt-2 text-lg font-black tracking-tight text-monolith-on-surface">{activeEvent.name}</h3>
                    <p className="mt-1 text-sm text-monolith-on-surface-muted">
                      대상: {activeEvent.sessionType === 'advanced' ? formatTargetAffiliation(activeEvent.targetAffiliation) : '전체'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setQrModalEvent(activeEvent.name);
                    }}
                    className="interactive-soft inline-flex h-10 w-10 items-center justify-center rounded-xl border border-monolith-outline-variant/25 bg-monolith-surface text-monolith-on-surface transition hover:bg-monolith-surface-low"
                    aria-label={`${activeEvent.name} QR 보기`}
                    title="QR 보기"
                  >
                    <QrCode className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-3 text-xs leading-6 text-monolith-on-surface-muted">
                  참가자는 QR 아이콘의 출석 QR을 휴대폰으로 스캔해 직접 출석합니다. 지갑을 연결하지 않은 회원은
                  참여 현황에서 수동으로 보정하세요.
                </p>
                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setQrModalEvent(activeEvent.name)}
                    className="interactive-soft flex flex-1 items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#1b66b3,#0e4a84)] px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(14,74,132,0.18)] transition-all hover:brightness-105"
                  >
                    <QrCode className="h-4 w-4" />
                    출석 QR 표시
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeactivate(activeEvent.name)}
                    disabled={processingEvent === `deactivate:${activeEvent.name}`}
                    className="interactive-soft flex flex-1 items-center justify-center gap-2 rounded-xl border border-monolith-outline-variant/25 bg-monolith-surface px-4 py-3 text-sm font-semibold text-monolith-on-surface transition hover:bg-monolith-surface-low disabled:opacity-60"
                  >
                    세션 마감
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-2xl font-black tracking-tight text-monolith-on-surface">없음</p>
        )}
        <p className="mt-3 text-sm leading-7 text-monolith-on-surface-muted">활동 생성은 활동 관리 화면에서 처리하고, 이 화면에서는 기존 세션의 활성화, 마감, QR 생성만 수행합니다.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        {(['전체', '기본 세션', '심화 세션', '기타 활동', '외부 활동', '해커톤/아이디어톤'] as TabType[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={[
              'interactive-soft rounded-full border px-4 py-2 text-sm font-semibold transition-all',
              activeTab === tab
                ? 'border-monolith-outline-variant/45 bg-monolith-surface-container text-monolith-on-surface shadow-[0_8px_18px_rgba(0,24,46,0.08)]'
                : 'border-monolith-outline-variant/40 bg-monolith-surface-lowest text-monolith-on-surface hover:border-monolith-primary-container/35 hover:bg-monolith-surface-low',
            ].join(' ')}
          >
            {tab}
          </button>
        ))}
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-2xl bg-monolith-error-container px-4 py-4 text-sm font-semibold text-monolith-error">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {filteredEvents.map((event) => {
          const stats = getStats(event);
          const isActive = Boolean(data?.activeEvents?.some((activeEvent) => activeEvent.name === event));
          const isProcessing = event === processingEvent;
          const isStatusProcessing = processingEvent === `status:${event}`;
          const isDeactivateProcessing = processingEvent === `deactivate:${event}`;
          const eventLink = `${baseUrl}/attendance?event=${encodeURIComponent(encodeEvent(event))}`;
          const statusMeta = getStatusMeta(data?.statuses[event]);

          return (
            <div
              key={event}
              className="rounded-2xl bg-monolith-surface-low p-5 shadow-[0_14px_30px_rgba(0,51,97,0.05)] transition hover:bg-monolith-surface"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-monolith-primary-container">
                    {data?.categories[event] ?? '미분류'}
                  </p>
                  <h2 className="mt-2 text-lg font-black tracking-tight text-monolith-on-surface">{event}</h2>
                </div>
                <span
                  className={[
                    'rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em]',
                    statusMeta.className,
                  ].join(' ')}
                >
                  {statusMeta.label}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
                <MiniStat label="미참여" value={stats.nonParticipation} tone="neutral" onClick={() => setStatModalEvent(event)} />
                <MiniStat label="출석" value={stats.attendance} tone="primary" onClick={() => setStatModalEvent(event)} />
                <MiniStat label="지각" value={stats.late} tone="warning" onClick={() => setStatModalEvent(event)} />
                <MiniStat label="결석" value={stats.absence} tone="danger" onClick={() => setStatModalEvent(event)} />
              </div>

              <div className="mt-5 space-y-3">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-monolith-on-surface-muted">
                    세션 상태
                  </label>
                  <select
                    value={data?.statuses[event] ?? 'scheduled'}
                    onChange={(changeEvent) => void handleStatusChange(event, changeEvent.target.value as SessionStatus)}
                    disabled={isStatusProcessing}
                    className="w-full rounded-xl border border-monolith-outline-variant/25 bg-monolith-surface-lowest px-4 py-3 text-sm font-semibold text-monolith-on-surface outline-none transition focus:border-monolith-primary-container disabled:opacity-60"
                  >
                    <option value="scheduled">예정</option>
                    <option value="in_progress">진행중</option>
                    <option value="completed">종료</option>
                    <option value="cancelled">취소</option>
                  </select>
                </div>

                {isActive ? (
                  <button
                    type="button"
                    onClick={() => void handleDeactivate(event)}
                    disabled={isDeactivateProcessing}
                    className="interactive-soft flex w-full items-center justify-center gap-2 rounded-xl bg-[#c62828] px-4 py-3 text-sm font-semibold text-white transition-colors hover:brightness-105 disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {isDeactivateProcessing ? '마감 중...' : '세션 마감'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetActive(event)}
                    disabled={isProcessing}
                    className="interactive-soft flex w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#1b66b3,#0e4a84)] px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(14,74,132,0.22)] transition-all hover:brightness-105 disabled:opacity-60"
                  >
                    {isProcessing ? '처리 중...' : '세션 활성화'}
                  </button>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={(clickEvent) => {
                      clickEvent.stopPropagation();
                      setQrModalEvent(event);
                    }}
                    className="interactive-soft flex items-center justify-center gap-2 rounded-xl border border-monolith-outline-variant/25 bg-monolith-surface-lowest px-4 py-3 text-sm font-semibold text-monolith-on-surface transition-colors hover:bg-monolith-surface"
                  >
                    <QrCode className="h-4 w-4" />
                    QR 보기
                  </button>

                  <a
                    href={eventLink}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(clickEvent) => clickEvent.stopPropagation()}
                    className="interactive-soft flex items-center justify-center gap-2 rounded-xl border border-monolith-outline-variant/25 bg-monolith-surface-lowest px-4 py-3 text-sm font-semibold text-monolith-on-surface transition-colors hover:bg-monolith-surface"
                  >
                    <SquareArrowOutUpRight className="h-4 w-4" />
                    링크 테스트
                  </a>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {statModalEvent ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#00172d]/40 px-4 py-8 backdrop-blur-[2px]">
          <div className="w-full max-w-5xl rounded-[2rem] border border-monolith-outline-variant/20 bg-white p-6 shadow-[0_24px_80px_rgba(0,24,46,0.22)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-monolith-primary-container">참여 현황</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-monolith-on-surface">{statModalEvent}</h2>
              </div>
              <button
                type="button"
                onClick={() => setStatModalEvent(null)}
                className="interactive-soft inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-monolith-outline-variant/25 bg-monolith-surface-low text-monolith-on-surface-muted transition hover:border-monolith-outline-variant/40 hover:text-monolith-on-surface"
                aria-label="닫기"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-monolith-outline-variant/20 bg-monolith-surface-low">
              <div className="grid grid-cols-[1.1fr_0.8fr] gap-4 border-b border-monolith-outline-variant/20 bg-monolith-surface-lowest px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-monolith-on-surface-muted">
                <span>참여자</span>
                <span>상태 변경</span>
              </div>
              <div className="max-h-[28rem] overflow-y-auto">
                {participantsLoading ? (
                  <div className="px-4 py-6 text-sm text-monolith-on-surface-muted">참여자 목록을 불러오는 중입니다.</div>
                ) : participants.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-monolith-on-surface-muted">표시할 참여자가 없습니다.</div>
                ) : (
                  participants.map((participant) => (
                    <div
                      key={participant.memberId}
                      className="grid grid-cols-[1.1fr_0.8fr] items-center gap-4 border-b border-monolith-outline-variant/15 bg-white px-4 py-3 last:border-b-0"
                    >
                      <div>
                        <p className="font-semibold text-monolith-on-surface">{participant.name}</p>
                        <p className="mt-1 text-xs text-monolith-on-surface-muted">
                          현재 상태: {getParticipantStatusLabel(participant.status)}
                        </p>
                      </div>
                      <select
                        value={participant.status}
                        onChange={(changeEvent) =>
                          void handleParticipantStatusChange(
                            statModalEvent,
                            participant.memberId,
                            changeEvent.target.value as ParticipantStatus,
                          )
                        }
                        disabled={participantProcessingId === participant.memberId}
                        className="w-full rounded-xl border border-monolith-outline-variant/25 bg-monolith-surface-lowest px-4 py-3 text-sm font-semibold text-monolith-on-surface outline-none transition focus:border-monolith-primary-container disabled:opacity-60"
                      >
                        <option value="nonParticipation">미참여</option>
                        <option value="present">출석</option>
                        <option value="late">지각</option>
                        <option value="absent">결석</option>
                      </select>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {qrModalEvent ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#00172d]/40 px-4 py-8 backdrop-blur-[2px]">
          <div className="w-full max-w-lg rounded-[2rem] border border-monolith-outline-variant/20 bg-white p-6 text-center shadow-[0_24px_80px_rgba(0,24,46,0.22)]">
            <div className="flex items-start justify-between gap-4 text-left">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-monolith-primary-container">세션 출석 QR</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-monolith-on-surface">{qrModalEvent}</h2>
                <p className="mt-1 text-xs text-monolith-on-surface-muted">
                  참가자가 휴대폰으로 이 QR을 스캔해 직접 출석합니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQrModalEvent(null)}
                className="interactive-soft inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-monolith-outline-variant/25 bg-monolith-surface-low text-monolith-on-surface-muted transition hover:border-monolith-outline-variant/40 hover:text-monolith-on-surface"
                aria-label="닫기"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <AdminSessionAttendanceQr
              eventName={qrModalEvent}
              isActive={Boolean(data?.activeEvents?.some((activeEvent) => activeEvent.name === qrModalEvent))}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
  onClick,
}: {
  label: string;
  value: number;
  tone: 'primary' | 'warning' | 'danger' | 'neutral';
  onClick: () => void;
}) {
  const toneClass =
    tone === 'primary'
      ? 'bg-[#e7f6ec] text-[#1f7a3d]'
      : tone === 'warning'
        ? 'bg-[#fff1cc] text-[#8a5a00]'
        : tone === 'danger'
          ? 'bg-monolith-error-container text-monolith-error'
          : 'bg-[#eceff3] text-[#5f6b7a]';

  return (
    <button
      type="button"
      onClick={onClick}
      className={['interactive-soft rounded-xl px-3 py-4 transition hover:brightness-[0.98]', toneClass].join(' ')}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.14em]">{label}</p>
      <p className="mt-2 text-xl font-black">{value}</p>
    </button>
  );
}
