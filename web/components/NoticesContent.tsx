'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useLanguageStore } from '@/lib/auth/language-store';
import { textContent } from '@/lib/text-content';

type NoticesContentProps = {
  initialNotices: any[];
  totalCount: number;
  categories: string[];
  currentCategory: string;
  query: string;
  currentPage: number;
  totalPages: number;
};

function buildNoticeHref(params: { page?: number; category?: string; query?: string }) {
  const searchParams = new URLSearchParams();
  if (params.page && params.page > 1) searchParams.set('page', String(params.page));
  if (params.category && params.category !== '전체') searchParams.set('category', params.category);
  if (params.query) searchParams.set('q', params.query);
  const queryString = searchParams.toString();
  return queryString ? `/notices?${queryString}` : '/notices';
}

function formatNoticeDate(date: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

export default function NoticesContent({
  initialNotices,
  totalCount,
  categories,
  currentCategory,
  query,
  currentPage,
  totalPages,
}: NoticesContentProps) {
  const { language } = useLanguageStore();
  const d = textContent[language].notices;

  const pageStart = Math.max(1, currentPage - 2);
  const pageEnd = Math.min(totalPages, pageStart + 4);
  const pageNumbers = Array.from({ length: pageEnd - pageStart + 1 }, (_, index) => pageStart + index);

  return (
    <main className="mx-auto max-w-7xl px-6 pb-20 pt-12 sm:pb-24 sm:pt-16 lg:px-8">
      <header className="pb-14 pt-6">
        <span className="mb-4 inline-block rounded-full bg-monolith-secondaryContainer px-3 py-1 font-display text-xs font-bold tracking-[0.18em] text-monolith-primaryContainer">
          RESOURCES
        </span>
        <h1 className="text-5xl font-bold tracking-[-0.06em] text-monolith-primary md:text-6xl">
          {language === 'ko' ? '공지사항' : 'Notices'}
        </h1>
        <p className="mt-4 max-w-xl break-keep text-lg text-monolith-onSurfaceMuted">
          {d.description}
        </p>
      </header>

      {/* Category & Search */}
      <section className="mb-8 flex flex-col gap-4 rounded-xl bg-monolith-surfaceLow p-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Link
              key={category}
              href={buildNoticeHref({ category, query })}
              className={[
                'interactive-soft rounded-lg px-4 py-2 text-sm transition',
                currentCategory === category
                  ? 'bg-monolith-surfaceLowest font-bold text-monolith-primary shadow-sm'
                  : 'text-monolith-onSurfaceMuted hover:bg-monolith-surfaceHigh',
              ].join(' ')}
            >
              {category}
            </Link>
          ))}
        </div>
        <form action="/notices" method="get" className="w-full md:w-auto">
          {currentCategory !== '전체' ? <input type="hidden" name="category" value={currentCategory} /> : null}
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder={language === 'ko' ? '검색어를 입력하세요' : 'Search...'}
            className="w-full rounded-lg border border-monolith-outlineVariant/40 bg-monolith-surfaceLowest px-4 py-2.5 text-sm outline-none ring-0 transition placeholder:text-monolith-onSurfaceMuted focus:border-monolith-primaryContainer focus:shadow-[0_10px_30px_rgba(0,51,97,0.08)] md:w-80"
          />
        </form>
      </section>

      {/* Table */}
      <section className="overflow-hidden rounded-xl border border-monolith-outlineVariant/30 bg-monolith-surfaceLowest shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-monolith-primaryContainer text-monolith-onPrimary">
                <th className="w-20 px-6 py-5 font-display text-xs font-bold uppercase tracking-[0.18em]">No.</th>
                <th className="w-32 px-6 py-5 text-center font-display text-xs font-bold uppercase tracking-[0.18em]">Category</th>
                <th className="px-6 py-5 font-display text-xs font-bold uppercase tracking-[0.18em]">Title</th>
                <th className="w-32 px-6 py-5 font-display text-xs font-bold uppercase tracking-[0.18em]">Author</th>
                <th className="w-40 px-6 py-5 text-right font-display text-xs font-bold uppercase tracking-[0.18em]">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-monolith-outlineVariant/20">
              {initialNotices.length > 0 ? (
                initialNotices.map((notice) => (
                  <tr key={notice.id} className="transition hover:bg-monolith-surfaceLow">
                    <td className="px-6 py-5 text-base font-bold text-monolith-primary">{notice.id}</td>
                    <td className="px-6 py-5 text-center">
                      <span className="rounded-md bg-monolith-surfaceHigh px-2 py-1 text-xs font-bold text-monolith-onSurfaceMuted">
                        {notice.category}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-lg font-semibold text-monolith-onSurface">
                      <Link href={`/notices/${notice.id}`} className="transition hover:text-monolith-primary">
                        {notice.title}
                      </Link>
                    </td>
                    <td className="px-6 py-5 text-base font-medium text-monolith-onSurfaceMuted">{notice.author}</td>
                    <td className="px-6 py-5 text-right font-display text-base text-monolith-onSurfaceMuted">{formatNoticeDate(notice.date)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-monolith-onSurfaceMuted">
                    {language === 'ko' ? '공지사항이 없습니다.' : 'No notices found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pagination */}
      <div className="mt-12 flex items-center justify-center gap-2">
        {[
          { icon: ChevronsLeft, page: 1, disabled: currentPage <= 1 },
          { icon: ChevronLeft, page: currentPage - 1, disabled: currentPage <= 1 },
        ].map(({ icon: Icon, page, disabled }, index) =>
          disabled ? (
            <span key={index} className="rounded-lg border border-monolith-outlineVariant/20 p-2 text-monolith-outlineVariant/70">
              <Icon className="h-4 w-4" />
            </span>
          ) : (
            <Link
              key={index}
              href={buildNoticeHref({ page, category: currentCategory, query })}
              className="interactive-soft rounded-lg border border-monolith-outlineVariant/30 p-2 text-monolith-onSurfaceMuted transition hover:bg-monolith-surfaceHigh"
            >
              <Icon className="h-4 w-4" />
            </Link>
          ),
        )}
        <div className="mx-4 flex gap-1">
          {pageNumbers.map((page) => (
            <Link
              key={page}
              href={buildNoticeHref({ page, category: currentCategory, query })}
              className={[
                'interactive-soft flex h-10 w-10 items-center justify-center rounded-lg font-display',
                page === currentPage ? 'bg-monolith-primary text-white' : 'text-monolith-onSurfaceMuted hover:bg-monolith-surfaceHigh',
              ].join(' ')}
            >
              {page}
            </Link>
          ))}
        </div>
        {[
          { icon: ChevronRight, page: currentPage + 1, disabled: currentPage >= totalPages },
          { icon: ChevronsRight, page: totalPages, disabled: currentPage >= totalPages },
        ].map(({ icon: Icon, page, disabled }, index) =>
          disabled ? (
            <span key={index} className="rounded-lg border border-monolith-outlineVariant/20 p-2 text-monolith-outlineVariant/70">
              <Icon className="h-4 w-4" />
            </span>
          ) : (
            <Link
              key={index}
              href={buildNoticeHref({ page, category: currentCategory, query })}
              className="interactive-soft rounded-lg border border-monolith-outlineVariant/30 p-2 text-monolith-onSurfaceMuted transition hover:bg-monolith-surfaceHigh"
            >
              <Icon className="h-4 w-4" />
            </Link>
          ),
        )}
      </div>
    </main>
  );
}
