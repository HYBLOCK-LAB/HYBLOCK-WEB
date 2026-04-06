import Link from 'next/link';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import SiteChrome from '@/components/SiteChrome';
import { getNoticeCategories, getPaginatedNotices } from '@/lib/supabase-notices';
import { textContent } from '@/lib/text-content';

type NoticesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const PAGE_SIZE = 10;

function getSingleParam(value: string | string[] | undefined) {
  return typeof value === 'string' ? value : undefined;
}

function buildNoticeHref(params: { page?: number; category?: string; query?: string }) {
  const searchParams = new URLSearchParams();

  if (params.page && params.page > 1) {
    searchParams.set('page', String(params.page));
  }

  if (params.category && params.category !== '전체') {
    searchParams.set('category', params.category);
  }

  if (params.query) {
    searchParams.set('q', params.query);
  }

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

export const dynamic = 'force-dynamic';

export default async function NoticesPage({ searchParams }: NoticesPageProps) {
  const params = (await searchParams) ?? {};
  const currentCategory = getSingleParam(params.category) ?? '전체';
  const query = getSingleParam(params.q)?.trim() ?? '';
  const rawPage = Number(getSingleParam(params.page) ?? '1');
  const currentPage = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;

  const [categories, initialResult] = await Promise.all([
    getNoticeCategories(),
    getPaginatedNotices({
      page: currentPage,
      pageSize: PAGE_SIZE,
      category: currentCategory,
      query,
    }).catch((error) => {
      console.error('Notices page query error:', error);
      return { notices: [], totalCount: 0 };
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(initialResult.totalCount / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const { notices, totalCount } =
    safeCurrentPage === currentPage
      ? initialResult
      : await getPaginatedNotices({
          page: safeCurrentPage,
          pageSize: PAGE_SIZE,
          category: currentCategory,
          query,
        }).catch((error) => {
          console.error('Notices page requery error:', error);
          return { notices: [], totalCount: initialResult.totalCount };
        });
  const pageStart = Math.max(1, safeCurrentPage - 2);
  const pageEnd = Math.min(totalPages, pageStart + 4);
  const pageNumbers = Array.from({ length: pageEnd - pageStart + 1 }, (_, index) => pageStart + index);

  return (
    <SiteChrome activePath="/notices">
      <main className="mx-auto max-w-7xl px-6 pb-20 pt-12 sm:pb-24 sm:pt-16 lg:px-8">
        <header className="pb-14 pt-6">
          <span className="mb-4 inline-block rounded-full bg-monolith-secondaryContainer px-3 py-1 font-display text-xs font-bold tracking-[0.18em] text-monolith-primaryContainer">
            RESOURCES
          </span>
          <h1 className="text-5xl font-bold tracking-[-0.06em] text-monolith-primary md:text-6xl">공지사항</h1>
          <p className="mt-4 max-w-xl break-keep text-lg text-monolith-onSurfaceMuted">
            {textContent.notices.description}
          </p>
        </header>

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
              placeholder="검색어를 입력하세요"
              className="w-full rounded-lg border border-monolith-outlineVariant/40 bg-monolith-surfaceLowest px-4 py-2.5 text-sm outline-none ring-0 transition placeholder:text-monolith-onSurfaceMuted focus:border-monolith-primaryContainer focus:shadow-[0_10px_30px_rgba(0,51,97,0.08)] md:w-80"
            />
          </form>
        </section>

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
                {notices.length > 0 ? (
                  notices.map((notice) => (
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
                      공지사항이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="mt-12 flex items-center justify-center gap-2">
          {[
            { icon: ChevronsLeft, page: 1, disabled: safeCurrentPage <= 1 },
            { icon: ChevronLeft, page: safeCurrentPage - 1, disabled: safeCurrentPage <= 1 },
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
                  page === safeCurrentPage ? 'bg-monolith-primary text-white' : 'text-monolith-onSurfaceMuted hover:bg-monolith-surfaceHigh',
                ].join(' ')}
              >
                {page}
              </Link>
            ))}
          </div>
          {[
            { icon: ChevronRight, page: safeCurrentPage + 1, disabled: safeCurrentPage >= totalPages },
            { icon: ChevronsRight, page: totalPages, disabled: safeCurrentPage >= totalPages },
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
    </SiteChrome>
  );
}
