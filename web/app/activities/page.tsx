'use client';

import SiteChrome from '@/components/SiteChrome';
import ActivitiesGallery from '@/components/activities/ActivitiesGallery';
import { mockActivityGalleryPhotos } from '@/lib/site-content';
import { textContent } from '@/lib/text-content';
import { useLanguageStore } from '@/lib/auth/language-store';

export default function ActivitiesPage() {
  const { language } = useLanguageStore();
  const d = textContent[language].activities;

  return (
    <SiteChrome activePath="/activities">
      <main className="mx-auto max-w-7xl px-6 py-16 sm:py-20 lg:px-8 lg:py-24">
        <div className="mb-12">
          <span className="mb-4 block font-display text-xs font-bold uppercase tracking-[0.22em] text-monolith-primaryContainer">
            Archive
          </span>
          <h1 className="text-4xl font-black uppercase tracking-[-0.06em] text-monolith-onSurface sm:text-5xl">
            {d.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-monolith-onSurfaceMuted">
            {d.intro}
          </p>
        </div>

        <ActivitiesGallery photos={mockActivityGalleryPhotos} />
      </main>
    </SiteChrome>
  );
}
