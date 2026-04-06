'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, Clock3 } from 'lucide-react';
import { decodeEvent } from '@/lib/utils';

const translateEvent = (eventName: string | null) => {
  if (!eventName) return '';
  // BasicN -> 기본세션 N주차
  if (eventName.startsWith('Basic')) {
    const week = eventName.replace('Basic', '');
    return `기본세션 ${week}주차`;
  }
  // AdvancedN -> 심화세션 N주차
  if (eventName.startsWith('Advanced')) {
    const week = eventName.replace('Advanced', '');
    return `심화세션 ${week}주차`;
  }
  return eventName;
};

export default function CheckInForm({
  members = [],
  eventName,
}: {
  members?: string[];
  eventName?: string | null;
}) {
  const searchParams = useSearchParams();
  const encodedParam = searchParams.get('event');
  const queryEvent = encodedParam ? decodeEvent(encodedParam) : null;
  const event = eventName ?? queryEvent;
  
  const [activeEvents, setActiveEvents] = useState<Array<{ name: string; activatedAt: string | null }>>([]);
  const [eventStatuses, setEventStatuses] = useState<Record<string, 'scheduled' | 'in_progress' | 'completed' | 'cancelled'>>({});
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    const fetchEventStatus = async () => {
      try {
        const response = await fetch('/api/events');
        const data = await response.json();
        if (response.ok) {
          setActiveEvents(Array.isArray(data.activeEvents) ? data.activeEvents : data.activeEvent ? [data.activeEvent] : []);
          setEventStatuses(data.statuses ?? {});
        }
      } catch (error) {
        console.error('Failed to fetch event status:', error);
      } finally {
        setLoadingEvents(false);
      }
    };
    fetchEventStatus();
  }, []);

  useEffect(() => {
    const currentActiveEvent = activeEvents.find((activeEvent) => activeEvent.name === event) ?? null;
    const activatedAtValue = currentActiveEvent?.activatedAt;
    if (!activatedAtValue) return;

    const timer = setInterval(() => {
      const activatedAt = new Date(activatedAtValue).getTime();
      const now = new Date().getTime();
      const diff = (activatedAt + 15 * 60 * 1000) - now;

      if (diff <= 0) {
        setTimeLeft('00:00');
        clearInterval(timer);
      } else {
        const minutes = Math.floor(diff / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [activeEvents, event]);

  const eventStatus = event ? eventStatuses[event] : undefined;
  const currentActiveEvent = event ? activeEvents.find((activeEvent) => activeEvent.name === event) ?? null : null;
  const isEventOpen = Boolean(event && currentActiveEvent);
  const inactiveReason =
    eventStatus === 'completed'
      ? '종료된 세션입니다.'
      : eventStatus === 'cancelled'
        ? '취소된 세션입니다.'
        : event
          ? '아직 오픈 전인 세션입니다.'
          : '현재 세션 또는 이벤트가 존재하지 않습니다.';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!isEventOpen) {
      setMessage({ type: 'error', text: inactiveReason });
      setLoading(false);
      return;
    }

    const trimmedName = name.trim();
    const trimmedCode = code.trim();

    try {
      const response = await fetch('/api/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName, event, code: trimmedCode }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.alreadyCheckedIn) {
          setMessage({ type: 'error', text: '이미 출석 완료되었습니다.' });
        } else {
          setMessage({ type: 'success', text: `${trimmedName}님, 출석이 완료되었습니다!` });
          setName('');
          setCode('');
        }
      } else {
        setMessage({ type: 'error', text: data.error || '출석 체크 중 오류가 발생했습니다.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '서버와의 통신에 실패했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  if (loadingEvents) {
    return <div className="py-6 text-center text-sm text-monolith-onSurfaceMuted">이벤트 정보 확인 중...</div>;
  }

  return (
    <div>
      {!isEventOpen ? (
        <div className="mb-5 rounded-xl border border-monolith-error/15 bg-monolith-errorContainer px-4 py-3 text-sm font-semibold text-monolith-error">
          {inactiveReason}
        </div>
      ) : (
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-monolith-secondaryContainer px-3 py-1 font-display text-xs font-bold tracking-[0.12em] text-monolith-onSecondaryContainer">
            {translateEvent(event)}
          </span>
          {timeLeft && (
            <span
              className={[
                'inline-flex items-center gap-1 rounded-lg px-3 py-1 font-mono text-sm',
                timeLeft === '00:00'
                  ? 'bg-monolith-errorContainer text-monolith-error'
                  : 'bg-monolith-primaryFixed text-monolith-primary',
              ].join(' ')}
            >
              <Clock3 className="h-3.5 w-3.5" />
              {timeLeft}
            </span>
          )}
        </div>
      )}
      
      {message && (
        <div
          className={[
            'mb-5 flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-semibold',
            message.type === 'success'
              ? 'bg-monolith-primaryFixed text-monolith-primary'
              : 'bg-monolith-errorContainer text-monolith-error',
          ].join(' ')}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="mb-2 block font-display text-xs font-bold uppercase tracking-[0.18em] text-monolith-primaryContainer"
          >
            이름을 입력하세요
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading || !isEventOpen}
            placeholder="이름을 입력하세요"
            className="w-full rounded-lg border border-monolith-outlineVariant/40 bg-monolith-surfaceLow px-4 py-3 text-monolith-onSurface outline-none transition focus:border-monolith-primaryContainer focus:bg-monolith-surfaceLowest"
            list={members.length > 0 ? 'member-name-suggestions' : undefined}
            autoComplete="name"
          />
          {members.length > 0 ? (
            <datalist id="member-name-suggestions">
              {members.map((member) => (
                <option key={member} value={member} />
              ))}
            </datalist>
          ) : null}
        </div>
        <div>
          <label
            htmlFor="code"
            className="mb-2 block font-display text-xs font-bold uppercase tracking-[0.18em] text-monolith-primaryContainer"
          >
            출석 코드를 입력하세요
          </label>
          <input
            id="code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
            required
            disabled={loading || !isEventOpen}
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            placeholder="4자리 숫자 코드를 입력하세요"
            className="w-full rounded-lg border border-monolith-outlineVariant/40 bg-monolith-surfaceLow px-4 py-3 text-monolith-onSurface outline-none transition focus:border-monolith-primaryContainer focus:bg-monolith-surfaceLowest"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !isEventOpen || !name || code.trim().length !== 4}
          className="w-full rounded-lg bg-monolith-primaryContainer px-5 py-3 font-display text-base font-bold text-monolith-onPrimary transition hover:bg-monolith-primary disabled:cursor-not-allowed disabled:bg-monolith-primaryContainer/45"
        >
          {loading ? '처리 중...' : '출석하기'}
        </button>
      </form>
    </div>
  );
}
