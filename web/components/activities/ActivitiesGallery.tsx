'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { ImageOff } from 'lucide-react';
import type { ActivityFilter, ActivityGalleryPhoto } from '@/lib/site-content';
import { textContent } from '@/lib/text-content';
import { useLanguageStore } from '@/lib/auth/language-store';

type ActivitiesGalleryProps = {
  filters?: ActivityFilter[];
  photos: ActivityGalleryPhoto[];
};

function formatActivityDate(date: string, language: 'ko' | 'en') {
  return new Intl.DateTimeFormat(language === 'ko' ? 'ko-KR' : 'en-US', {
    year: 'numeric',
    month: language === 'ko' ? 'long' : 'short',
    day: 'numeric',
  }).format(new Date(`${date}T00:00:00`));
}

export default function ActivitiesGallery({ filters = [], photos }: ActivitiesGalleryProps) {
  const { language } = useLanguageStore();
  const copy = textContent[language].activities;
  const [selectedFilter, setSelectedFilter] = useState<ActivityFilter>('all');

  const filteredPhotos = useMemo(
    () => photos.filter((photo) => selectedFilter === 'all' || photo.category === selectedFilter),
    [photos, selectedFilter],
  );

  if (photos.length === 0) {
    return (
      <div className="rounded-[28px] border border-monolith-outline-variant/20 bg-monolith-surface-lowest px-6 py-12 text-center text-sm text-monolith-on-surface-muted">
        {copy.emptyTitle}
      </div>
    );
  }

  return (
    <section aria-labelledby="activity-archive-heading">
      <h2 id="activity-archive-heading" className="sr-only">
        {copy.title}
      </h2>

      {filters.length > 0 ? (
        <div className="mb-8 border-y border-monolith-outline-variant/40 py-5 sm:mb-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div
              aria-label={copy.filterLabel}
              className="-mx-2 flex gap-2 overflow-x-auto px-2 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              role="group"
            >
              {filters.map((filter) => {
                const isSelected = selectedFilter === filter;

                return (
                  <button
                    key={filter}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedFilter(filter)}
                    className={[
                      'shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-monolith-primary focus-visible:ring-offset-2',
                      isSelected
                        ? 'border-monolith-primary bg-monolith-primary text-white shadow-sm'
                        : 'border-monolith-outline-variant/70 bg-monolith-surface-lowest text-monolith-on-surface-muted hover:border-monolith-primary/40 hover:text-monolith-primary',
                    ].join(' ')}
                  >
                    {copy.filters[filter]}
                  </button>
                );
              })}
            </div>

            <p aria-live="polite" className="shrink-0 text-sm font-semibold text-monolith-on-surface-muted">
              <span className="text-monolith-primary">{filteredPhotos.length}</span> {copy.resultCount}
            </p>
          </div>
        </div>
      ) : null}

      {filteredPhotos.length === 0 ? (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-[28px] border border-dashed border-monolith-outline-variant/70 bg-monolith-surface-low px-6 py-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-monolith-primary-fixed text-monolith-primary">
            <ImageOff aria-hidden="true" className="h-6 w-6" />
          </span>
          <h3 className="mt-5 text-xl font-bold text-monolith-on-surface">{copy.emptyTitle}</h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-monolith-on-surface-muted">{copy.emptyDescription}</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredPhotos.map((photo) => (
            <li key={photo.id}>
              <article className="group h-full overflow-hidden rounded-[24px] border border-monolith-outline-variant/30 bg-monolith-surface-lowest shadow-[0_16px_44px_rgba(0,51,97,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_56px_rgba(0,51,97,0.14)]">
                <figure>
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-monolith-surface-container">
                    <Image
                      src={photo.src}
                      alt={photo.alt[language]}
                      fill
                      sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition duration-500 group-hover:scale-[1.04]"
                    />
                  </div>
                  {filters.length > 0 ? (
                    <figcaption className="p-5">
                      <div className="flex items-center justify-between gap-3">
                        <span className="rounded-full bg-monolith-primary-fixed px-3 py-1 text-xs font-bold text-monolith-primary">
                          {copy.filters[photo.category]}
                        </span>
                        {photo.date ? (
                          <time dateTime={photo.date} className="text-xs font-semibold text-monolith-on-surface-muted">
                            {formatActivityDate(photo.date, language)}
                          </time>
                        ) : (
                          <span className="text-xs font-semibold text-monolith-on-surface-muted">{copy.datePending}</span>
                        )}
                      </div>
                      <h3 className="mt-4 text-lg font-bold tracking-[-0.03em] text-monolith-on-surface">
                        {photo.title[language]}
                      </h3>
                    </figcaption>
                  ) : null}
                </figure>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
