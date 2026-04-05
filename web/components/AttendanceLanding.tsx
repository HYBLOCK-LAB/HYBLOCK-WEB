import Link from 'next/link';
import { CalendarDays, CheckCircle2, Clock3, Lock, QrCode } from 'lucide-react';
import { encodeEvent } from '@/lib/utils';
import CheckInForm from '@/components/CheckInForm';

type AttendanceLandingProps = {
  events: string[];
  activeEvent: { name: string; activatedAt: string } | null;
  categories: Record<string, string>;
};

function translateCategory(category?: string) {
  if (!category) return '세션';
  if (category === '대외활동') return '외부 활동';
  return category;
}

export default function AttendanceLanding({
  events,
  activeEvent,
  categories,
}: AttendanceLandingProps) {
  const visibleEvents = events.slice(0, 6);

  return (
    <main className="pb-28 pt-12 md:pt-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-12">
          <span className="mb-4 block font-display text-xs font-bold uppercase tracking-[0.22em] text-monolith-primaryContainer">
            Attendance Management
          </span>
          <h1 className="max-w-3xl text-5xl font-bold leading-none tracking-[-0.06em] text-monolith-onSurface md:text-6xl">
            세션 출석 체크
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-monolith-onSurfaceMuted md:text-lg">
            진행 중인 세션을 확인하고 QR 또는 수동 입력으로 출석을 완료할 수 있습니다.
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

            {visibleEvents.map((event, index) => {
              const isActive = event === activeEvent?.name;
              const encoded = encodeURIComponent(encodeEvent(event));

              return (
                <div
                  key={event}
                  className={[
                    'grid gap-4 rounded-xl border bg-monolith-surfaceLowest p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-ambient md:grid-cols-12 md:items-center md:p-6',
                    isActive ? 'border-monolith-primaryFixed/70' : 'border-monolith-outlineVariant/30',
                  ].join(' ')}
                >
                  <div className="col-span-1 flex justify-start">
                    <div className={['rounded-lg p-3', isActive ? 'bg-monolith-secondaryContainer' : 'bg-monolith-surfaceContainer'].join(' ')}>
                      <CheckCircle2 className={['h-5 w-5', isActive ? 'text-monolith-primaryContainer' : 'text-monolith-onSurfaceMuted'].join(' ')} />
                    </div>
                  </div>

                  <div className="col-span-5">
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-bold text-monolith-primaryContainer">{event}</h3>
                      <span
                        className={[
                          'rounded-full px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-[0.18em]',
                          isActive
                            ? 'bg-monolith-primary text-monolith-onPrimary'
                            : 'bg-monolith-surfaceContainer text-monolith-onSurfaceMuted',
                        ].join(' ')}
                      >
                        {isActive ? 'Active' : 'Upcoming'}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-monolith-onSurfaceMuted">Session #{String(index + 1).padStart(2, '0')}</p>
                  </div>

                  <div className="col-span-3">
                    <div className="flex items-center gap-2 text-sm text-monolith-onSurfaceMuted">
                      <CalendarDays className="h-4 w-4" />
                      <span>{translateCategory(categories[event])}</span>
                    </div>
                    <p className="ml-6 mt-1 flex items-center gap-2 text-xs text-monolith-onSurfaceMuted">
                      <Clock3 className="h-3.5 w-3.5" />
                      {isActive ? '지금 출석 가능' : '오픈 전'}
                    </p>
                  </div>

                  <div className="col-span-3 flex gap-2 md:justify-end">
                    <Link
                      href={`/attendance?event=${encoded}`}
                      className="flex flex-1 items-center justify-center rounded-lg bg-monolith-surfaceContainer px-4 py-2.5 font-display text-sm font-bold text-monolith-primaryContainer transition hover:bg-monolith-surfaceHigh md:flex-none"
                    >
                      <QrCode className="h-4 w-4" />
                    </Link>
                    <Link
                      href={`/attendance?event=${encoded}`}
                      className={[
                        'flex flex-[2] items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-bold transition md:flex-none',
                        isActive
                          ? 'bg-monolith-primaryContainer text-monolith-onPrimary shadow-lg shadow-monolith-primary/10'
                          : 'cursor-not-allowed bg-monolith-surfaceHigh text-monolith-onSurfaceMuted pointer-events-none opacity-70',
                      ].join(' ')}
                    >
                      {isActive ? <CheckCircle2 className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                      {isActive ? '출석 체크하기' : '대기 중'}
                    </Link>
                  </div>
                </div>
              );
            })}
          </section>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-monolith-outlineVariant/30 bg-monolith-gradient p-6 text-monolith-onPrimary shadow-monolith">
              <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-monolith-primaryFixed">Live Session</p>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.04em]">
                {activeEvent?.name ?? '진행 중인 세션 없음'}
              </h2>
              <p className="mt-4 text-sm leading-6 text-monolith-primaryFixed">
                현재 활성 세션만 출석 처리할 수 있습니다. 운영진이 세션을 열면 아래 입력 폼이 즉시 활성화됩니다.
              </p>
            </div>

            <div className="rounded-2xl border border-monolith-outlineVariant/30 bg-monolith-surfaceLowest p-6 shadow-sm">
              <div className="mb-5">
                <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-monolith-primaryContainer">
                  Manual Check-In
                </p>
                <h2 className="mt-3 text-2xl font-bold tracking-[-0.04em] text-monolith-onSurface">수동 출석</h2>
              </div>
              <CheckInForm />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
