'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, Images } from 'lucide-react';
import SiteChrome from '@/components/SiteChrome';
import { useLanguageStore } from '@/lib/auth/language-store';
import type { ActivityAlbum } from '@/lib/site-content';
import { textContent } from '@/lib/text-content';

type ActivityAlbumDetailProps = {
  album: ActivityAlbum;
};

function formatActivityDate(date: string, language: 'ko' | 'en') {
  return new Intl.DateTimeFormat(language === 'ko' ? 'ko-KR' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(`${date}T00:00:00`));
}

function formatPhotoCount(count: number, language: 'ko' | 'en') {
  if (language === 'ko') return `${count}장의 사진`;
  return `${count} ${count === 1 ? 'photo' : 'photos'}`;
}

export default function ActivityAlbumDetail({ album }: ActivityAlbumDetailProps) {
  const { language } = useLanguageStore();
  const copy = textContent[language].activities;

  return (
    <SiteChrome activePath="/activities">
      <main>
        <section className="border-b border-monolith-outline-variant/30 bg-monolith-surface-low">
          <div className="mx-auto max-w-7xl px-6 py-12 sm:py-16 lg:px-8 lg:py-20">
            <Link
              href="/activities"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-bold text-monolith-primary transition hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-monolith-primary focus-visible:ring-offset-4"
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              {copy.backToArchive}
            </Link>

            <div className="mt-10 grid items-end gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12">
              <div>
                <div className="flex flex-wrap items-center gap-3 text-sm font-bold">
                  <span className="border-l-2 border-monolith-primary pl-2 text-monolith-primary">
                    {copy.filters[album.category]}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-monolith-on-surface-muted">
                    <CalendarDays aria-hidden="true" className="h-4 w-4" />
                    {album.date ? formatActivityDate(album.date, language) : copy.datePending}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-monolith-on-surface-muted">
                    <Images aria-hidden="true" className="h-4 w-4" />
                    {formatPhotoCount(album.photos.length, language)}
                  </span>
                </div>

                <h1 className="mt-6 text-4xl font-black tracking-[-0.06em] text-monolith-on-surface sm:text-5xl lg:text-6xl">
                  {album.title[language]}
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-monolith-on-surface-muted">
                  {album.description[language]}
                </p>
              </div>

              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-monolith-outline-variant bg-monolith-surface-container">
                <Image
                  src={album.coverPhoto.src}
                  alt={album.coverPhoto.alt[language]}
                  fill
                  priority
                  sizes="(min-width: 1024px) 55vw, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="activity-photos-heading" className="mx-auto max-w-7xl px-6 py-14 sm:py-20 lg:px-8">
          <div className="mb-8 flex items-end justify-between gap-4 border-b border-monolith-outline-variant/40 pb-5">
            <h2 id="activity-photos-heading" className="text-3xl font-black tracking-[-0.05em] text-monolith-on-surface sm:text-4xl">
              {copy.photoArchiveTitle}
            </h2>
            <span className="text-sm font-bold text-monolith-on-surface-muted">{album.photos.length}</span>
          </div>

          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {album.photos.map((photo, index) => {
              const isFeatured = index === 0 && album.photos.length > 3;

              return (
                <li key={photo.id} className={isFeatured ? 'sm:col-span-2 sm:row-span-2' : undefined}>
                  <figure className={`relative overflow-hidden rounded-xl bg-monolith-surface-container ${isFeatured ? 'aspect-[4/3] h-full' : 'aspect-[4/3]'}`}>
                    <Image
                      src={photo.src}
                      alt={photo.alt[language]}
                      fill
                      sizes={isFeatured ? '(min-width: 1024px) 66vw, 100vw' : '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw'}
                      className="object-cover transition duration-500 hover:scale-[1.02]"
                    />
                  </figure>
                </li>
              );
            })}
          </ul>
        </section>
      </main>
    </SiteChrome>
  );
}
