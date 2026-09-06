'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CalendarDays, CheckCircle2, Clock3 } from 'lucide-react';
import { decodeEvent } from '@/lib/utils';
import type { ActiveAttendanceEvent, AttendanceSessionSummary } from '@/lib/supabase-attendance';
import { textContent } from '@/lib/text-content';
import { useLanguageStore } from '@/lib/auth/language-store';

type AttendanceLandingProps = {
  sessions: AttendanceSessionSummary[];
  activeEvents: ActiveAttendanceEvent[];
};

function translateCategory(category: string | undefined, lang: 'ko' | 'en') {
  if (!category) return lang === 'ko' ? '세션' : 'Session';
  if (category === '대외활동') return lang === 'ko' ? '외부 활동' : 'External Activity';
  return category;
}

function getSessionPresentation(status: AttendanceSessionSummary['status'], isActive: boolean, lang: 'ko' | 'en') {
  const d = textContent[lang].attendance;
  
  if (isActive || status === 'in_progress') {
    return {
      badgeLabel: 'Active',
      badgeClassName: 'bg-monolith-primary text-white',
      hint: d.activeStatusHint,
      actionLabel: lang === 'ko' ? '출석 체크하기' : 'Check-In Now',
      actionClassName: 'bg-monolith-primary-container text-monolith-on-primary shadow-lg shadow-monolith-primary/10',
      iconClassName: 'bg-monolith-secondary-container text-monolith-primary-container',
    };
  }

  if (status === 'completed') {
    return {
      badgeLabel: 'Closed',
      badgeClassName: 'bg-[#ffe2e0] text-[#b3261e]',
      hint: lang === 'ko' ? '종료됨' : 'Closed',
      actionLabel: lang === 'ko' ? '세션 보기' : 'View Session',
      actionClassName: 'bg-monolith-surface-high text-monolith-on-surface-muted hover:bg-monolith-surface-container',
      iconClassName: 'bg-[#ffe2e0] text-[#b3261e]',
    };
  }

  if (status === 'cancelled') {
    return {
      badgeLabel: 'Cancelled',
      badgeClassName: 'bg-monolith-surface-container text-monolith-on-surface-muted',
      hint: lang === 'ko' ? '취소됨' : 'Cancelled',
      actionLabel: lang === 'ko' ? '세션 보기' : 'View Session',
      actionClassName: 'bg-monolith-surface-high text-monolith-on-surface-muted hover:bg-monolith-surface-container',
      iconClassName: 'bg-monolith-surface-container text-monolith-on-surface-muted',
    };
  }

  return {
    badgeLabel: 'Upcoming',
    badgeClassName: 'bg-monolith-surface-container text-monolith-on-surface-muted',
    hint: d.pendingStatusHint,
    actionLabel: lang === 'ko' ? '세션 보기' : 'View Session',
    actionClassName: 'bg-monolith-surface-high text-monolith-on-surface-muted hover:bg-monolith-surface-container',
    iconClassName: 'bg-monolith-surface-container text-monolith-on-surface-muted',
  };
}

export default function AttendanceLanding({
  sessions = [],
  activeEvents = [],
}: AttendanceLandingProps) {
  const { language } = useLanguageStore();
  const d = textContent[language].attendance;
  
  const searchParams = useSearchParams();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const selectedQueryEvent = useMemo(() => {
    const encodedParam = searchParams.get('event');
    return encodedParam ? decodeEvent(encodedParam) : null;
  }, [searchParams]);

  const selectedSession = sessions.find((session) => session.id === selectedSessionId) ?? null;

  useEffect(() => {
    if (!selectedQueryEvent) return;

    const matchedSession = sessions.find((session) => session.name === selectedQueryEvent);
    if (!matchedSession) return;

    setSelectedSessionId((current) => (current === matchedSession.id ? current : matchedSession.id));
  }, [selectedQueryEvent, sessions]);

  const toggleSelectedEvent = (sessionId: string) => {
    setSelectedSessionId((current) => (current === sessionId ? null : sessionId));
  };

  return (
    <main className="pb-28 pt-12 md:pt-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-12">
          <span className="mb-4 block font-display text-xs font-bold uppercase tracking-[0.22em] text-monolith-primary-container">
            Attendance Management
          </span>
          <h1 className="max-w-3xl text-5xl font-bold leading-none tracking-[-0.06em] text-monolith-on-surface md:text-6xl">
            {language === 'ko' ? '세션 출석 체크' : 'Session Check-In'}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-monolith-on-surface-muted md:text-lg">
            {d.description}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
          <section className="space-y-4">
            <div className="hidden grid-cols-12 gap-4 px-6 py-3 font-display text-xs font-bold uppercase tracking-[0.18em] text-monolith-on-surface-muted/70 md:grid">
              <div className="col-span-1">Icon</div>
              <div className="col-span-5">Session Info</div>
              <div className="col-span-3">Category</div>
              <div className="col-span-3 text-right">Status / Action</div>
            </div>

            {sessions.map((session) => {
              const isActive = activeEvents.some((activeEvent) => activeEvent.sessionId === session.id);
              const presentation = getSessionPresentation(session.status, isActive, language);

              return (
                <div
                  key={session.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleSelectedEvent(session.id)}
                  onKeyDown={(keyboardEvent) => {
                    if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
                      keyboardEvent.preventDefault();
                      toggleSelectedEvent(session.id);
                    }
                  }}
                  className={[
                    'grid cursor-pointer gap-4 rounded-xl border bg-monolith-surface-lowest p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-ambient md:grid-cols-12 md:items-center md:p-6',
                    isActive ? 'border-monolith-primary-fixed/70' : 'border-monolith-outline-variant/30',
                    selectedSessionId === session.id ? 'ring-2 ring-monolith-primary-container/50' : '',
                  ].join(' ')}
                >
                  <div className="col-span-1 flex justify-start">
                    <div className={['rounded-lg p-3', presentation.iconClassName].join(' ')}>
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="col-span-5">
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-bold text-monolith-primary-container">{session.name}</h3>
                      <span
                        className={[
                          'rounded-full px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-[0.18em]',
                          presentation.badgeClassName,
                        ].join(' ')}
                      >
                        {presentation.badgeLabel}
                      </span>
                    </div>
                  </div>

                  <div className="col-span-3">
                    <div className="flex items-center gap-2 text-sm text-monolith-on-surface-muted">
                      <CalendarDays className="h-4 w-4" />
                      <span>{translateCategory(session.category, language)}</span>
                    </div>
                    <p className="ml-6 mt-1.5 flex items-center gap-2 text-xs text-monolith-on-surface-muted">
                      <Clock3 className="h-3.5 w-3.5" />
                      {presentation.hint}
                    </p>
                  </div>

                  <div className="col-span-3 flex md:justify-end">
                    {isActive ? (
                      <span
                        className={[
                          'flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-bold',
                          presentation.actionClassName,
                        ].join(' ')}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {language === 'ko' ? '진행 중' : 'In Progress'}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </section>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-monolith-outline-variant/30 bg-monolith-surface-lowest p-6 shadow-sm">
              <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-monolith-primary-container">
                {language === 'ko' ? '출석 방법' : 'How to check in'}
              </p>
              <h2 className="mt-3 text-2xl font-bold tracking-[-0.04em] text-monolith-on-surface">
                {selectedSession && activeEvents.some((activeEvent) => activeEvent.name === selectedSession.name)
                  ? selectedSession.name
                  : language === 'ko'
                    ? '세션 현장에서 스캔'
                    : 'Scan on-site'}
              </h2>
              <p className="mt-4 text-sm leading-7 text-monolith-on-surface-muted">
                {language === 'ko'
                  ? '진행 중인 세션 현장에서 운영진이 띄운 출석 QR을 휴대폰 카메라로 스캔하면 로그인된 계정으로 바로 출석 처리됩니다. 지갑을 연결하지 않았다면 먼저 로그인 또는 지갑 연동을 완료하세요.'
                  : 'At an in-progress session, scan the attendance QR shown by the staff with your phone camera. You will be checked in with your logged-in account. Link a wallet first if you have not.'}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
