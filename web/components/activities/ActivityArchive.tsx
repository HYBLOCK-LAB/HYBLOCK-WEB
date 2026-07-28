'use client';

import Image from 'next/image';
import Link from 'next/link';
import { CalendarDays, ChevronRight, ImageOff, Images } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useLanguageStore } from '@/lib/auth/language-store';
import type { ActivityAlbum, ActivityFilter } from '@/lib/site-content';
import { textContent } from '@/lib/text-content';

type ActivityArchiveProps = {
  albums: ActivityAlbum[];
  filters?: ActivityFilter[];
};

type DatedAlbum = ActivityAlbum & { date: string };

function formatAlbumDate(date: string, language: 'ko' | 'en') {
  return new Intl.DateTimeFormat(language === 'ko' ? 'ko-KR' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(`${date}T00:00:00`));
}

function formatMonth(month: number, language: 'ko' | 'en') {
  return new Intl.DateTimeFormat(language === 'ko' ? 'ko-KR' : 'en-US', {
    month: 'long',
  }).format(new Date(2026, month - 1, 1));
}

function formatAlbumCount(count: number, language: 'ko' | 'en') {
  if (language === 'ko') return `${count}개의 앨범`;
  return `${count} ${count === 1 ? 'album' : 'albums'}`;
}

function groupAlbumsByYearAndMonth(albums: DatedAlbum[]) {
  const grouped = new Map<number, Map<number, DatedAlbum[]>>();

  albums.forEach((album) => {
    const [year, month] = album.date.split('-').map(Number);
    const months = grouped.get(year) ?? new Map<number, DatedAlbum[]>();
    const monthAlbums = months.get(month) ?? [];

    monthAlbums.push(album);
    months.set(month, monthAlbums);
    grouped.set(year, months);
  });

  return [...grouped.entries()]
    .sort(([yearA], [yearB]) => yearB - yearA)
    .map(([year, months]) => ({
      year,
      months: [...months.entries()]
        .sort(([monthA], [monthB]) => monthB - monthA)
        .map(([month, monthAlbums]) => ({
          month,
          albums: monthAlbums.sort((a, b) => b.date.localeCompare(a.date)),
        })),
    }));
}

function ActivityAlbumCard({ album, language }: { album: ActivityAlbum; language: 'ko' | 'en' }) {
  const copy = textContent[language].activities;

  return (
    <li>
      <Link
        href={`/activities/${album.slug}`}
        className="group block h-full overflow-hidden rounded-xl border border-monolith-outline-variant bg-monolith-surface-lowest transition duration-200 hover:-translate-y-px hover:border-monolith-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-monolith-primary focus-visible:ring-offset-4"
      >
        <article className="flex h-full flex-col">
          <div className="relative aspect-[4/3] overflow-hidden bg-monolith-surface-container">
            <Image
              src={album.coverPhoto.src}
              alt={album.coverPhoto.alt[language]}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition duration-500 group-hover:scale-[1.04]"
            />
            <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-md bg-white/90 px-2.5 py-1.5 text-xs font-bold text-monolith-on-surface shadow-sm">
              <Images aria-hidden="true" className="h-3.5 w-3.5" />
              {album.photos.length}
            </span>
          </div>

          <div className="flex flex-1 flex-col p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
              <span className="border-l-2 border-monolith-primary pl-2 text-monolith-primary">
                {copy.filters[album.category]}
              </span>
              {album.date ? (
                <time dateTime={album.date} className="inline-flex items-center gap-1.5 text-monolith-on-surface-muted">
                  <CalendarDays aria-hidden="true" className="h-3.5 w-3.5" />
                  {formatAlbumDate(album.date, language)}
                </time>
              ) : (
                <span className="text-monolith-on-surface-muted">{copy.datePending}</span>
              )}
            </div>

            <h4 className="mt-4 text-xl font-black tracking-[-0.035em] text-monolith-on-surface">
              {album.title[language]}
            </h4>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-monolith-on-surface-muted">
              {album.description[language]}
            </p>
            <span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-monolith-primary">
              {copy.viewAlbum}
              <ChevronRight aria-hidden="true" className="h-4 w-4 transition group-hover:translate-x-1" />
            </span>
          </div>
        </article>
      </Link>
    </li>
  );
}

export default function ActivityArchive({ albums, filters = [] }: ActivityArchiveProps) {
  const { language } = useLanguageStore();
  const copy = textContent[language].activities;
  const [selectedFilter, setSelectedFilter] = useState<ActivityFilter>('all');

  const filteredAlbums = useMemo(
    () => albums.filter((album) => selectedFilter === 'all' || album.category === selectedFilter),
    [albums, selectedFilter],
  );
  const datedAlbums = filteredAlbums.filter((album): album is DatedAlbum => album.date !== null);
  const undatedAlbums = filteredAlbums.filter((album) => album.date === null);
  const groupedAlbums = groupAlbumsByYearAndMonth(datedAlbums);

  if (albums.length === 0) {
    return (
      <div className="rounded-[28px] border border-monolith-outline-variant/20 bg-monolith-surface-lowest px-6 py-12 text-center text-sm text-monolith-on-surface-muted">
        {copy.emptyTitle}
      </div>
    );
  }

  return (
    <section aria-labelledby="activity-archive-heading">
      <h2 id="activity-archive-heading" className="sr-only">
        {copy.archiveTitle}
      </h2>

      {filters.length > 0 ? (
        <div className="mb-12 border-y border-monolith-outline-variant py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <label className="sm:hidden">
              <span className="sr-only">{copy.filterLabel}</span>
              <select
                value={selectedFilter}
                onChange={(event) => setSelectedFilter(event.target.value as ActivityFilter)}
                className="w-full rounded-lg border border-monolith-outline-variant bg-monolith-surface-lowest px-4 py-3 text-sm font-bold text-monolith-on-surface focus:border-monolith-primary focus:outline-none focus:ring-2 focus:ring-monolith-primary/20"
              >
                {filters.map((filter) => (
                  <option key={filter} value={filter}>
                    {copy.filters[filter]}
                  </option>
                ))}
              </select>
            </label>

            <div aria-label={copy.filterLabel} className="hidden flex-wrap gap-x-1 gap-y-2 sm:flex" role="group">
              {filters.map((filter) => {
                const isSelected = selectedFilter === filter;

                return (
                  <button
                    key={filter}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedFilter(filter)}
                    className={[
                      'min-h-11 rounded-lg border px-4 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-monolith-primary focus-visible:ring-offset-2',
                      isSelected
                        ? 'border-monolith-primary bg-monolith-primary text-white'
                        : 'border-monolith-outline-variant/70 bg-monolith-surface-lowest text-monolith-on-surface-muted hover:border-monolith-primary/40 hover:text-monolith-primary',
                    ].join(' ')}
                  >
                    {copy.filters[filter]}
                  </button>
                );
              })}
            </div>

            <p aria-live="polite" className="shrink-0 text-sm font-semibold text-monolith-on-surface-muted">
              <span className="text-monolith-primary">{formatAlbumCount(filteredAlbums.length, language)}</span>
            </p>
          </div>
        </div>
      ) : null}

      {filteredAlbums.length === 0 ? (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-[28px] border border-dashed border-monolith-outline-variant/70 bg-monolith-surface-low px-6 py-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-monolith-primary-fixed text-monolith-primary">
            <ImageOff aria-hidden="true" className="h-6 w-6" />
          </span>
          <h3 className="mt-5 text-xl font-bold text-monolith-on-surface">{copy.emptyTitle}</h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-monolith-on-surface-muted">{copy.emptyDescription}</p>
        </div>
      ) : (
        <div className="space-y-20">
          {groupedAlbums.map(({ year, months }) => (
            <section key={year} aria-labelledby={`year-${year}`}>
              <div className="mb-8 flex items-baseline gap-3 border-b border-monolith-outline-variant pb-4">
                <span className="font-display text-xs font-bold uppercase tracking-[0.2em] text-monolith-primary-container">
                  {copy.yearLabel}
                </span>
                <h3 id={`year-${year}`} className="text-3xl font-black tracking-[-0.04em] text-monolith-on-surface sm:text-4xl">
                  {year}
                </h3>
              </div>

              <div className="space-y-12">
                {months.map(({ month, albums: monthAlbums }) => (
                  <section key={month} aria-labelledby={`month-${year}-${month}`}>
                    <div className="mb-5 flex items-baseline justify-between gap-4">
                      <h4 id={`month-${year}-${month}`} className="text-2xl font-black tracking-[-0.04em] text-monolith-on-surface">
                        {formatMonth(month, language)}
                      </h4>
                      <span className="text-sm font-semibold text-monolith-on-surface-muted">
                        {formatAlbumCount(monthAlbums.length, language)}
                      </span>
                    </div>
                    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {monthAlbums.map((album) => (
                        <ActivityAlbumCard key={album.slug} album={album} language={language} />
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </section>
          ))}

          {undatedAlbums.length > 0 ? (
            <section aria-labelledby="undated-activities-heading" className="rounded-2xl border border-monolith-outline-variant bg-monolith-surface-low p-6 sm:p-8">
              <span className="font-display text-xs font-bold uppercase tracking-[0.2em] text-monolith-primary-container">
                {copy.undatedEyebrow}
              </span>
              <h3 id="undated-activities-heading" className="mt-3 text-3xl font-black tracking-[-0.05em] text-monolith-on-surface">
                {copy.undatedTitle}
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-monolith-on-surface-muted">
                {copy.undatedDescription}
              </p>
              <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {undatedAlbums.map((album) => (
                  <ActivityAlbumCard key={album.slug} album={album} language={language} />
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </section>
  );
}
