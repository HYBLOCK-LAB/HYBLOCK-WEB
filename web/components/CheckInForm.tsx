'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, Clock3 } from 'lucide-react';
import members from '@/lib/members.json';
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

export default function CheckInForm() {
  const searchParams = useSearchParams();
  const encodedParam = searchParams.get('event');
  const event = encodedParam ? decodeEvent(encodedParam) : null;
  
  const [activeEvent, setActiveEvent] = useState<{ name: string, activatedAt: string | null } | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    const fetchEventStatus = async () => {
      try {
        const response = await fetch('/api/events');
        const data = await response.json();
        if (response.ok) {
          setActiveEvent(data.activeEvent);
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
    const activatedAtValue = activeEvent?.activatedAt;
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
  }, [activeEvent]);

  const isEventOpen = event && activeEvent && event === activeEvent.name;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!isEventOpen) {
      setMessage({ type: 'error', text: '현재 세션 또는 이벤트가 존재하지 않습니다.' });
      setLoading(false);
      return;
    }

    const trimmedName = name.trim();
    if (!members.includes(trimmedName)) {
      setMessage({ type: 'error', text: '등록되지 않은 이름입니다. 관리자에게 문의하세요.' });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName, event }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.alreadyCheckedIn) {
          setMessage({ type: 'error', text: '이미 출석 완료되었습니다.' });
        } else {
          setMessage({ type: 'success', text: `${trimmedName}님, 출석이 완료되었습니다!` });
          setName('');
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
          현재 세션 또는 이벤트가 존재하지 않습니다.
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
            placeholder="예: 홍길동"
            required
            disabled={loading || !isEventOpen}
            className="w-full rounded-lg border border-monolith-outlineVariant/40 bg-monolith-surfaceLow px-4 py-3 text-monolith-onSurface outline-none transition placeholder:text-monolith-onSurfaceMuted focus:border-monolith-primaryContainer focus:bg-monolith-surfaceLowest"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !isEventOpen}
          className="w-full rounded-lg bg-monolith-primaryContainer px-5 py-3 font-display text-base font-bold text-monolith-onPrimary transition hover:bg-monolith-primary disabled:cursor-not-allowed disabled:bg-monolith-primaryContainer/45"
        >
          {loading ? '처리 중...' : '출석하기'}
        </button>
      </form>
    </div>
  );
}
