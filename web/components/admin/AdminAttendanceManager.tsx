'use client';

import { useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { AlertCircle, CheckCircle2, Link2, Plus, QrCode, SquareArrowOutUpRight } from 'lucide-react';
import { encodeEvent } from '@/lib/utils';

type AttendanceRow = Record<string, string>;

type EventPayload = {
  events: string[];
  attendanceData: AttendanceRow[];
  activeEvent: { name: string; activatedAt: string } | null;
  categories: Record<string, string>;
};

type TabType = '세션' | '대외활동' | '특별세션';

type EventStats = {
  attendance: number;
  late: number;
  absence: number;
};

export default function AdminAttendanceManager() {
  const [data, setData] = useState<EventPayload | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('세션');
  const [newEventName, setNewEventName] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingEvent, setProcessingEvent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState('');
  const [viewingQR, setViewingQR] = useState<string | null>(null);

  useEffect(() => {
    setBaseUrl(window.location.origin);
    void fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/events');
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

  const handleDeactivate = async () => {
    if (!window.confirm('세션을 마감하시겠습니까? 남은 인원은 자동으로 결석 처리됩니다.')) {
      return;
    }

    setProcessingEvent('deactivating');
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deactivate: true }),
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

  const handleAddEvent = async () => {
    if (!newEventName.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName: newEventName.trim(),
          category: activeTab,
        }),
      });

      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error || '이벤트 추가 실패');
      }

      setNewEventName('');
      await fetchData();
    } catch (eventError) {
      setError(eventError instanceof Error ? eventError.message : '이벤트 추가 실패');
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = useMemo(() => {
    if (!data) return [];

    return data.events.filter((event) => {
      const category = data.categories[event];
      if (category) return category === activeTab;
      if (activeTab === '세션') return !event.includes('대외') && !event.includes('특별');
      return event.includes(activeTab);
    });
  }, [activeTab, data]);

  const getStats = (eventName: string): EventStats => {
    if (!data) return { attendance: 0, late: 0, absence: 0 };

    return data.attendanceData.reduce(
      (acc, row) => {
        const status = row[eventName];
        if (status === 'Attendence') acc.attendance += 1;
        if (status === 'Late') acc.late += 1;
        if (status === 'Absence') acc.absence += 1;
        return acc;
      },
      { attendance: 0, late: 0, absence: 0 },
    );
  };

  if (loading && !data) {
    return <p className="text-sm text-monolith-onSurfaceMuted">출석 관리 데이터를 불러오는 중입니다.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-2xl bg-monolith-surfaceLow p-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-monolith-primaryContainer">현재 활성 세션</p>
          <p className="mt-3 text-2xl font-black tracking-tight text-monolith-onSurface">{data?.activeEvent?.name ?? '없음'}</p>
          <p className="mt-3 text-sm leading-7 text-monolith-onSurfaceMuted">세션 활성화, 마감, QR 생성까지 이 화면에서 바로 처리할 수 있습니다.</p>
        </div>

        <div className="rounded-2xl bg-monolith-surfaceLow p-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-monolith-primaryContainer">새 이벤트 추가</p>
          <div className="mt-4 flex gap-3">
            <input
              type="text"
              value={newEventName}
              onChange={(event) => setNewEventName(event.target.value)}
              placeholder={`새 ${activeTab} 이름`}
              className="min-w-0 flex-1 rounded-xl border border-monolith-outlineVariant/30 bg-monolith-surfaceLowest px-4 py-3 text-sm outline-none transition focus:border-monolith-primaryContainer"
            />
            <button
              type="button"
              onClick={handleAddEvent}
              disabled={loading}
              className="interactive-soft flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,#0e4a84,#003361)] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(0,51,97,0.18)] transition-all hover:brightness-105 disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              추가
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {(['세션', '대외활동', '특별세션'] as TabType[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={[
              'interactive-soft rounded-full border px-4 py-2 text-sm font-semibold transition-all',
              activeTab === tab
                ? 'border-monolith-primaryContainer bg-monolith-primaryFixed text-monolith-primary shadow-[0_10px_20px_rgba(0,51,97,0.12)]'
                : 'border-monolith-outlineVariant/30 bg-monolith-surfaceLow text-monolith-onSurface hover:border-monolith-primaryContainer/35 hover:bg-monolith-surfaceLowest',
            ].join(' ')}
          >
            {tab}
          </button>
        ))}
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-2xl bg-monolith-errorContainer px-4 py-4 text-sm font-semibold text-monolith-error">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredEvents.map((event) => {
          const stats = getStats(event);
          const isActive = event === data?.activeEvent?.name;
          const isProcessing = event === processingEvent;
          const eventLink = `${baseUrl}/attendance?event=${encodeURIComponent(encodeEvent(event))}`;

          return (
            <div key={event} className="rounded-2xl bg-monolith-surfaceLow p-5 shadow-[0_14px_30px_rgba(0,51,97,0.05)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-monolith-primaryContainer">
                    {data?.categories[event] ?? '미분류'}
                  </p>
                  <h2 className="mt-2 text-lg font-black tracking-tight text-monolith-onSurface">{event}</h2>
                </div>
                {isActive ? (
                  <span className="rounded-full bg-monolith-primary px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white">
                    active
                  </span>
                ) : null}
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                <MiniStat label="출석" value={stats.attendance} tone="primary" />
                <MiniStat label="지각" value={stats.late} tone="warning" />
                <MiniStat label="결석" value={stats.absence} tone="muted" />
              </div>

              <div className="mt-5 space-y-3">
                {isActive ? (
                  <button
                    type="button"
                    onClick={handleDeactivate}
                    disabled={processingEvent === 'deactivating'}
                    className="interactive-soft flex w-full items-center justify-center gap-2 rounded-xl bg-[#c62828] px-4 py-3 text-sm font-semibold text-white transition-colors hover:brightness-105 disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {processingEvent === 'deactivating' ? '마감 중...' : '세션 마감'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetActive(event)}
                    disabled={Boolean(data?.activeEvent) || isProcessing}
                    className="interactive-soft flex w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#1b66b3,#0e4a84)] px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(14,74,132,0.22)] transition-all hover:brightness-105 disabled:opacity-60"
                  >
                    {isProcessing ? '처리 중...' : '세션 활성화'}
                  </button>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setViewingQR(viewingQR === event ? null : event)}
                    className="interactive-soft flex items-center justify-center gap-2 rounded-xl border border-monolith-outlineVariant/25 bg-monolith-surfaceLowest px-4 py-3 text-sm font-semibold text-monolith-onSurface transition-colors hover:bg-monolith-surface"
                  >
                    <QrCode className="h-4 w-4" />
                    {viewingQR === event ? 'QR 닫기' : 'QR 보기'}
                  </button>

                  <a
                    href={eventLink}
                    target="_blank"
                    rel="noreferrer"
                    className="interactive-soft flex items-center justify-center gap-2 rounded-xl border border-monolith-outlineVariant/25 bg-monolith-surfaceLowest px-4 py-3 text-sm font-semibold text-monolith-onSurface transition-colors hover:bg-monolith-surface"
                  >
                    <SquareArrowOutUpRight className="h-4 w-4" />
                    링크 테스트
                  </a>
                </div>

                {viewingQR === event ? (
                  <div className="rounded-2xl bg-white p-5 text-center shadow-[0_14px_30px_rgba(0,51,97,0.08)]">
                    <QRCodeSVG value={eventLink} size={180} includeMargin />
                    <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-monolith-onSurfaceMuted">
                      <Link2 className="h-3.5 w-3.5" />
                      <span>{eventLink}</span>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: number; tone: 'primary' | 'warning' | 'muted' }) {
  const toneClass =
    tone === 'primary'
      ? 'bg-monolith-primaryFixed text-monolith-primary'
      : tone === 'warning'
        ? 'bg-[#fff1cc] text-[#8a5a00]'
        : 'bg-monolith-surfaceLowest text-monolith-onSurfaceMuted';

  return (
    <div className={['rounded-xl px-3 py-4', toneClass].join(' ')}>
      <p className="text-[11px] font-bold uppercase tracking-[0.14em]">{label}</p>
      <p className="mt-2 text-xl font-black">{value}</p>
    </div>
  );
}
