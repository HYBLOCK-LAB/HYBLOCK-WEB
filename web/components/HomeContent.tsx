'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import SiteChrome from '@/components/SiteChrome';
import ActivitiesGallery from '@/components/activities/ActivitiesGallery';
import ProfessorSection from '@/components/ProfessorSection';
import HeroButtons from '@/components/HeroButtons';
import { aboutValues, homeNotices, mockActivityGalleryPhotos } from '@/lib/site-content';
import { textContent } from '@/lib/text-content';
import { useLanguageStore } from '@/lib/auth/language-store';

export default function HomeContent() {
  const { language } = useLanguageStore();
  const d = textContent[language].home;
  const pastActivities = mockActivityGalleryPhotos.slice(0, 12);

  return (
    <main>
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-[#0e4a84] py-24 text-white md:py-32">
        <div className="absolute inset-0 bg-monolith-grid" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-8 md:grid-cols-12">
          <div className="md:col-span-7 lg:col-span-8">
            <span className="inline-block rounded-full bg-white/10 px-4 py-1.5 font-display text-sm font-bold uppercase tracking-widest text-blue-200 backdrop-blur-sm">
              {d.heroEyebrow}
            </span>
            <h1 className="mt-8 text-6xl font-black uppercase leading-none tracking-tighter sm:text-7xl md:text-8xl lg:text-9xl">
              <span className="text-highlight">{d.heroTitle}</span>
            </h1>
            <p className="mt-10 max-w-2xl text-lg leading-relaxed text-blue-100/80 md:text-xl">
              {d.heroDescription}
            </p>
            <HeroButtons />
          </div>
          <div className="md:col-span-5 lg:col-span-4">
            <div className="relative">
              <div className="absolute -inset-4 rounded-full bg-blue-400/20 blur-3xl" />
              <Image
                src="/logo_white.png"
                alt="HYBLOCK Logo"
                width={800}
                height={800}
                className="relative mx-auto w-full max-w-[400px] object-contain drop-shadow-[0_0_100px_rgba(255,255,255,0.2)] transition-transform duration-1000 hover:scale-105"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT US SECTION */}
      <section className="bg-white px-8 py-32">
        <div className="mx-auto grid max-w-7xl gap-20 md:grid-cols-12">
          <div className="md:col-span-4">
            <h2 className="border-l-8 border-[#0e4a84] pl-8 text-4xl font-black uppercase tracking-tighter text-[#0a0c10]">
              {d.aboutUsTitle}
            </h2>
            <p className="mt-6 font-display text-xs font-bold uppercase tracking-widest text-slate-400">
              {d.aboutUsSubtitle}
            </p>
          </div>
          <div className="md:col-span-8">
            <p className="text-3xl font-medium leading-tight text-slate-900">
              {d.aboutUsVision}
            </p>
            <div className="mt-16 grid gap-10 sm:grid-cols-3">
              {aboutValues.map((value) => (
                <div key={value.title} className="group rounded-2xl border border-slate-100 bg-slate-50 p-10 transition-all hover:bg-white hover:shadow-2xl">
                  <h3 className="text-xl font-black uppercase text-[#0e4a84]">{value.title}</h3>
                  <p className="mt-6 text-slate-500 leading-relaxed">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* LATEST NOTICES SECTION */}
      <section className="bg-slate-50 px-8 py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 flex items-end justify-between gap-6">
            <div>
              <h2 className="text-4xl font-black uppercase tracking-tighter text-[#0a0c10]">{d.latestNoticesTitle}</h2>
              <div className="mt-4 h-2 w-24 rounded-full bg-[#0e4a84]" />
            </div>
            <Link href="/notices" className="group flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[#0e4a84]">
              {d.latestNoticesCta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="divide-y divide-slate-200">
            {homeNotices.map((notice) => (
              <div key={notice.title} className="group cursor-pointer py-10 transition-colors hover:bg-white/50">
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-16">
                    <span className="text-sm font-bold text-slate-400">{notice.date}</span>
                    <h3 className="text-2xl font-bold text-slate-900 group-hover:text-[#0e4a84] transition-colors">{notice.title}</h3>
                  </div>
                  <span className="w-fit rounded-full bg-blue-50 px-4 py-1 text-[10px] font-black uppercase tracking-widest text-[#0e4a84]">
                    {notice.tag}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ProfessorSection />

      {/* PAST ACTIVITIES SECTION */}
      <section className="bg-white px-8 py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mb-20 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <span className="font-display text-xs font-bold uppercase tracking-[0.3em] text-[#0e4a84]">
                {d.pastActivitiesEyebrow}
              </span>
              <h2 className="mt-6 text-5xl font-black uppercase tracking-tighter text-slate-900 md:text-6xl">
                {d.pastActivitiesTitle}
              </h2>
              <p className="mt-8 text-lg leading-relaxed text-slate-500">
                {d.pastActivitiesDescription}
              </p>
            </div>
            <Link href="/activities" className="group flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[#0e4a84]">
              {d.pastActivitiesCta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <ActivitiesGallery photos={pastActivities} />
        </div>
      </section>
    </main>
  );
}
