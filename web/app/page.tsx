import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Plus, Terminal, Users } from 'lucide-react';
import SiteChrome from '@/components/SiteChrome';
import AttendanceLanding from '@/components/AttendanceLanding';
import { getActiveEvent, getEventCategories, getEvents } from '@/lib/supabase-attendance';
import { aboutValues, aboutVision, homeNotices, upcomingActivities } from '@/lib/site-content';

export const dynamic = 'force-dynamic';

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = (await searchParams) ?? {};
  const hasEventParam = typeof params.event === 'string' && params.event.length > 0;

  const [events, activeEvent, categories] = await Promise.all([
    getEvents().catch(() => []),
    getActiveEvent().catch(() => null),
    getEventCategories().catch(() => ({})),
  ]);

  if (hasEventParam) {
    return (
      <SiteChrome activePath="/attendance">
        <AttendanceLanding events={events} activeEvent={activeEvent} categories={categories} />
      </SiteChrome>
    );
  }

  return (
    <SiteChrome activePath="/">
      <main>
        <section className="relative overflow-hidden bg-monolith-primary text-monolith-onPrimary">
          <div className="absolute inset-0 bg-monolith-grid opacity-20" />
          <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-black/20 to-transparent" />
          <div className="relative mx-auto grid min-h-[760px] max-w-7xl items-center gap-12 px-6 py-20 md:grid-cols-12 lg:px-8 lg:py-24">
            <div className="md:col-span-8">
              <span className="inline-block rounded-full bg-monolith-primaryFixed px-4 py-1 font-display text-xs font-bold uppercase tracking-[0.22em] text-monolith-primary">
                Academic Society
              </span>
              <h1 className="mt-8 text-5xl font-black uppercase leading-[0.9] tracking-[-0.08em] sm:text-6xl md:text-8xl">
                Share Insight,
                <br />
                Engage
                <br />
                <span className="text-monolith-primaryFixed">in Web3.</span>
              </h1>
              <p className="mt-8 max-w-2xl text-lg leading-8 text-monolith-primaryFixed md:text-xl md:leading-9">
                {aboutVision}
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link href="/about" className="interactive-soft rounded-lg bg-white px-8 py-4 font-display text-lg font-bold text-monolith-primary transition hover:bg-monolith-surface">
                  소개 보기
                </Link>
                <Link href="/attendance" className="interactive-soft rounded-lg border border-white/30 px-8 py-4 font-display text-lg font-bold text-white transition hover:bg-white/10">
                  출석 체크
                </Link>
              </div>
            </div>
            <div className="md:col-span-4">
              <div className="rounded-[28px] border border-white/10 bg-white/8 p-6 shadow-2xl backdrop-blur sm:p-8">
                <Image
                  src="/logo_name.png"
                  alt="HYBLOCK"
                  width={1975}
                  height={780}
                  className="mx-auto w-full max-w-xs object-contain brightness-125 contrast-125"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-monolith-surface px-6 py-28 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-16 md:grid-cols-12">
            <div className="md:col-span-4">
              <h2 className="border-l-8 border-monolith-primaryContainer pl-6 text-4xl font-black uppercase tracking-[-0.06em] text-monolith-onSurface">
                About Us
              </h2>
              <p className="mt-4 font-display text-sm font-bold uppercase tracking-[0.2em] text-monolith-onSurfaceMuted">
                The Society Blueprint
              </p>
            </div>
            <div className="md:col-span-8">
              <p className="text-3xl leading-tight text-monolith-onSurface">
                {aboutVision}
              </p>
              <div className="mt-12 grid gap-8 sm:grid-cols-3">
                {aboutValues.map((value) => (
                  <div key={value.title} className="interactive-card rounded-xl border border-monolith-outlineVariant/20 border-t-4 border-monolith-primaryContainer bg-monolith-surfaceLow p-8">
                    <h3 className="text-xl font-black uppercase">{value.title}</h3>
                    <p className="mt-4 text-monolith-onSurfaceMuted">{value.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-monolith-surfaceLowest px-6 py-28 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 flex items-end justify-between gap-6">
              <div>
                <h2 className="text-4xl font-black uppercase tracking-[-0.06em] text-monolith-onSurface">Latest Notices</h2>
                <div className="mt-3 h-1.5 w-24 rounded-full bg-monolith-primaryContainer" />
              </div>
              <Link href="/notices" className="interactive-soft flex items-center gap-2 rounded-full px-1 font-display text-sm font-bold uppercase text-monolith-primaryContainer">
                View All Archives
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="divide-y divide-monolith-outlineVariant/40">
              {homeNotices.map((notice) => (
                <div key={notice.title} className="interactive-soft rounded-xl px-4 py-8 md:py-10">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-12">
                      <span className="w-24 text-sm font-bold text-monolith-onSurfaceMuted">{notice.date}</span>
                      <h3 className="text-2xl font-bold text-monolith-onSurface">{notice.title}</h3>
                    </div>
                    <span className="w-fit rounded bg-monolith-secondaryContainer px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-monolith-primaryContainer">
                      {notice.tag}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-monolith-surface px-6 py-28 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h2 className="mb-16 text-center text-4xl font-black uppercase tracking-[-0.06em] text-monolith-onSurface">
              Upcoming Activities
            </h2>
            <div className="grid auto-rows-[280px] gap-6 md:grid-cols-4">
              <div className="interactive-card relative overflow-hidden rounded-2xl bg-monolith-primary p-8 text-white md:col-span-2 md:row-span-2 md:p-10">
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20" />
                <div className="relative flex h-full flex-col justify-end">
                  <span className="mb-4 inline-block w-fit rounded bg-white px-3 py-1 text-xs font-black uppercase text-monolith-primary">
                    Hackathon
                  </span>
                  <h3 className="text-4xl font-black uppercase leading-tight tracking-[-0.06em]">
                    {upcomingActivities[0].title}
                  </h3>
                  <p className="mt-4 text-monolith-primaryFixed">{upcomingActivities[0].subtitle}</p>
                </div>
              </div>

              <div className="interactive-card relative overflow-hidden rounded-2xl bg-monolith-primaryFixed p-8 md:col-span-2">
                <Terminal className="absolute right-8 top-8 h-10 w-10 text-monolith-primary/20" />
                <div className="flex h-full flex-col justify-end">
                  <h3 className="text-2xl font-black uppercase text-monolith-primary">{upcomingActivities[1].title}</h3>
                  <p className="mt-3 text-monolith-onSurfaceMuted">{upcomingActivities[1].subtitle}</p>
                  <button className="interactive-soft mt-5 flex w-fit items-center gap-2 rounded-full px-1 font-display text-xs font-bold uppercase tracking-[0.18em] text-monolith-primaryContainer">
                    RSVP
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="interactive-card flex flex-col justify-between rounded-2xl bg-monolith-primary p-8 text-white">
                <h3 className="text-2xl font-black uppercase leading-tight">{upcomingActivities[2].title}</h3>
                <Users className="h-10 w-10" />
              </div>

              <div className="interactive-card flex flex-col justify-between rounded-2xl border border-monolith-outlineVariant/50 bg-monolith-surfaceLow p-8 hover:bg-monolith-primaryFixed">
                <h3 className="text-2xl font-black uppercase leading-tight text-monolith-onSurface">{upcomingActivities[3].title}</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-monolith-onSurfaceMuted">{upcomingActivities[3].subtitle}</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </SiteChrome>
  );
}
