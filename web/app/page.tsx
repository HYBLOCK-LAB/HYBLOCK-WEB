import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import SiteChrome from '@/components/SiteChrome';
import AttendanceLanding from '@/components/AttendanceLanding';
import ActivitiesGallery from '@/components/activities/ActivitiesGallery';
import { getActiveEvents, getAdminMembers, getAttendanceSessions } from '@/lib/supabase-attendance';
import { aboutValues, aboutVision, homeNotices, mockActivityGalleryPhotos } from '@/lib/site-content';
import { textContent } from '@/lib/text-content';

export const dynamic = 'force-dynamic';

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = (await searchParams) ?? {};
  const hasEventParam = typeof params.event === 'string' && params.event.length > 0;

  const [sessions, activeEvents, members] = await Promise.all([
    getAttendanceSessions(),
    getActiveEvents().catch(() => []),
    getAdminMembers().catch(() => []),
  ]);
  const pastActivities = mockActivityGalleryPhotos.slice(0, 8);

  if (hasEventParam) {
    return (
      <SiteChrome activePath="/attendance">
        <AttendanceLanding
          sessions={sessions}
          activeEvents={activeEvents}
          members={members.filter((member) => member.isActive).map((member) => member.name)}
        />
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
              <span className="inline-block rounded-full bg-monolith-primaryFixed px-4 py-1.5 font-display text-md font-bold uppercase leading-tight tracking-[0.18em] text-monolith-primary">
                Hanyang University
                <br />
                <span className="hidden sm:inline">{' '}</span>
                Blockchain Academic Club
              </span>
              <h1 className="mt-8 text-5xl font-black uppercase leading-[0.9] tracking-[-0.08em] sm:text-6xl md:text-8xl">
                HYBLOCK
              </h1>
              <p className="mt-8 max-w-[132rem] break-keep text-lg leading-8 text-monolith-primaryFixed md:text-xl md:leading-9">
                한양대학교 블록체인 학술 동아리 HYBLOCK은 연구, 개발, 세미나, 네트워킹을 통해 Web3를 깊이 있게 탐구하는 커뮤니티입니다.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link href="/about" className="interactive-soft rounded-lg bg-white px-8 py-4 font-display text-lg font-bold text-monolith-primary transition hover:bg-monolith-surface">
                  HYBLOCK 소개
                </Link>
                <Link href="/attendance" className="interactive-soft rounded-lg border border-white/30 px-8 py-4 font-display text-lg font-bold text-white transition hover:bg-white/10">
                  출석하기
                </Link>
              </div>
            </div>
            <div className="md:col-span-4">
              <div className="rounded-[28px] border border-white/10 bg-white/8 p-6 sm:p-8">
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
                {textContent.home.aboutBlueprint}
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
            <div className="mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <span className="font-display text-xs font-bold uppercase tracking-[0.22em] text-monolith-primaryContainer">
                  {textContent.home.pastActivitiesEyebrow}
                </span>
                <h2 className="mt-4 text-4xl font-black uppercase tracking-[-0.06em] text-monolith-onSurface md:text-5xl">
                  {textContent.home.pastActivitiesTitle}
                </h2>
                <p className="mt-5 text-lg leading-8 text-monolith-onSurfaceMuted">
                  {textContent.home.pastActivitiesDescription}
                </p>
              </div>
              <Link href="/activities" className="interactive-soft flex items-center gap-2 rounded-full px-1 font-display text-sm font-bold uppercase text-monolith-primaryContainer">
                {textContent.home.pastActivitiesCta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {pastActivities.length > 0 ? (
              <ActivitiesGallery photos={pastActivities} />
            ) : (
              <div className="rounded-[28px] border border-monolith-outlineVariant/30 bg-monolith-surfaceLowest px-6 py-16 text-center text-monolith-onSurfaceMuted">
                {textContent.home.pastActivitiesEmpty}
              </div>
            )}
          </div>
        </section>
      </main>
    </SiteChrome>
  );
}
