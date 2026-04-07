'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CalendarDays, CheckCircle2, Clock3, Lock, QrCode } from 'lucide-react';
import { decodeEvent, encodeEvent } from '@/lib/utils';
import CheckInForm from '@/components/CheckInForm';
import PersonalAttendanceQrCard from '@/components/PersonalAttendanceQrCard';
import type { ActiveAttendanceEvent, AttendanceSessionSummary } from '@/lib/supabase-attendance';
import { textContent } from '@/lib/text-content';
import { useLanguageStore } from '@/lib/auth/language-store';

type AttendanceLandingProps = {
  sessions: AttendanceSessionSummary[];
  activeEvents: ActiveAttendanceEvent[];
  members: string[];
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
      badgeClassName: 'bg-monolith-primary text-monolith-onPrimary',
      hint: d.activeStatusHint,
      actionLabel: lang === 'ko' ? '출석 체크하기' : 'Check-In Now',
      actionClassName: 'bg-monolith-primaryContainer text-monolith-onPrimary shadow-lg shadow-monolith-primary/10',
      iconClassName: 'bg-monolith-secondaryContainer text-monolith-primaryContainer',
    };
  }

  if (status === 'completed') {
    return {
      badgeLabel: 'Closed',
      badgeClassName: 'bg-[#ffe2e0] text-[#b3261e]',
      hint: lang === 'ko' ? '종료됨' : 'Closed',
      actionLabel: lang === 'ko' ? '세션 보기' : 'View Session',
      actionClassName: 'bg-monolith-surfaceHigh text-monolith-onSurfaceMuted hover:bg-monolith-surfaceContainer',
      iconClassName: 'bg-[#ffe2e0] text-[#b3261e]',
    };
  }

  if (status === 'cancelled') {
    return {
      badgeLabel: 'Cancelled',
      badgeClassName: 'bg-monolith-surfaceContainer text-monolith-onSurfaceMuted',
      hint: lang === 'ko' ? '취소됨' : 'Cancelled',
      actionLabel: lang === 'ko' ? '세션 보기' : 'View Session',
      actionClassName: 'bg-monolith-surfaceHigh text-monolith-onSurfaceMuted hover:bg-monolith-surfaceContainer',
      iconClassName: 'bg-monolith-surfaceContainer text-monolith-onSurfaceMuted',
    };
  }

  return {
    badgeLabel: 'Upcoming',
    badgeClassName: 'bg-monolith-surfaceContainer text-monolith-onSurfaceMuted',
    hint: d.pendingStatusHint,
    actionLabel: lang === 'ko' ? '세션 보기' : 'View Session',
    actionClassName: 'bg-monolith-surfaceHigh text-monolith-onSurfaceMuted hover:bg-monolith-surfaceContainer',
    iconClassName: 'bg-monolith-surfaceContainer text-monolith-onSurfaceMuted',
  };
}

export default function AttendanceLanding({
  sessions = [],
  activeEvents = [],
  members,
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
          <span className="mb-4 block font-display text-xs font-bold uppercase tracking-[0.22em] text-monolith-primaryContainer">
            Attendance Management
          </span>
          <h1 className="max-w-3xl text-5xl font-bold leading-none tracking-[-0.06em] text-monolith-onSurface md:text-6xl">
            {language === 'ko' ? '세션 출석 체크' : 'Session Check-In'}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-monolith-onSurfaceMuted md:text-lg">
            {d.description}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
          <section className="space-y-4">
            <div className="hidden grid-cols-12 gap-4 px-6 py-3 font-display text-xs font-bold uppercase tracking-[0.18em] text-monolith-onSurfaceMuted/70 md:grid">
              <div className="col-span-1">Icon</div>
              <div className="col-span-5">Session Info</div>
              <div className="col-span-3">Category</div>
              <div className="col-span-3 text-right">Status / Action</div>
            </div>

            {sessions.map((session, index) => {
              const isActive = activeEvents.some((activeEvent) => activeEvent.sessionId === session.id);
              const encoded = encodeURIComponent(encodeEvent(session.name));
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
                    'grid cursor-pointer gap-4 rounded-xl border bg-monolith-surfaceLowest p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-ambient md:grid-cols-12 md:items-center md:p-6',
                    isActive ? 'border-monolith-primaryFixed/70' : 'border-monolith-outlineVariant/30',
                    selectedSessionId === session.id ? 'ring-2 ring-monolith-primaryContainer/50' : '',
                  ].join(' ')}
                >
                  <div className="col-span-1 flex justify-start">
                    <div className={['rounded-lg p-3', presentation.iconClassName].join(' ')}>
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="col-span-5">
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-bold text-monolith-primaryContainer">{session.name}</h3>
                      <span
                        className={[
                          'rounded-full px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-[0.18em]',
                          presentation.badgeClassName,
                        ].join(' ')}
                      >
                        {presentation.badgeLabel}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-monolith-onSurfaceMuted">
                      {language === 'ko' ? `세션 #${String(index + 1).padStart(2, '0')}` : `Session #${String(index + 1).padStart(2, '0')}`}
                    </p>
                  </div>

                  <div className="col-span-3">
                    <div className="flex items-center gap-2 text-sm text-monolith-onSurfaceMuted">
                      <CalendarDays className="h-4 w-4" />
                      <span>{translateCategory(session.category, language)}</span>
                    </div>
                    <p className="ml-6 mt-1 flex items-center gap-2 text-xs text-monolith-onSurfaceMuted">
                      <Clock3 className="h-3.5 w-3.5" />
                      {presentation.hint}
                    </p>
                  </div>

                  <div className="col-span-3 flex gap-2 md:justify-end">
                    <Link
                      href={`/attendance?event=${encoded}`}
                      onClick={(event) => event.stopPropagation()}
                      className="flex flex-1 items-center justify-center rounded-lg bg-monolith-surfaceContainer px-4 py-2.5 font-display text-sm font-bold text-monolith-primaryContainer transition hover:bg-monolith-surfaceHigh md:flex-none"
                    >
                      <QrCode className="h-4 w-4" />
                    </Link>
                    <Link
                      href={`/attendance?event=${encoded}`}
                      onClick={(event) => event.stopPropagation()}
                      className={[
                        'flex flex-[2] items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-bold transition md:flex-none',
                        presentation.actionClassName,
                      ].join(' ')}
                    >
                      {isActive ? <CheckCircle2 className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                      {presentation.actionLabel}
                    </Link>
                  </div>
                </div>
              );
            })}
          </section>

          <aside className="space-y-6">
            {selectedSession ? (
              <>
                <PersonalAttendanceQrCard
                  selectedEventName={selectedSession.name}
                  activeEventNames={activeEvents.map((activeEvent) => activeEvent.name)}
                />
                <div className="rounded-2xl border border-monolith-outlineVariant/30 bg-monolith-surfaceLowest p-6 shadow-sm">
                  <div className="mb-5">
                    <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-monolith-primaryContainer">
                      {d.manualCheckInLabel}
                    </p>
                    <h2 className="mt-3 text-2xl font-bold tracking-[-0.04em] text-monolith-onSurface">
                      {d.manualCheckInTitle}
                    </h2>
                  </div>
                  <CheckInForm members={members} eventName={selectedSession.name} />
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-monolith-outlineVariant/35 bg-monolith-surfaceLow p-6 text-sm leading-7 text-monolith-onSurfaceMuted">
                {language === 'ko' 
                  ? '왼쪽에서 세션을 선택하면 해당 세션의 내 출석 QR과 수동 출석이 이 영역에 표시됩니다.' 
                  : 'Select a session on the left to display your attendance QR and manual check-in here.'}
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
