import Link from 'next/link';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import SiteChrome from '@/components/SiteChrome';
import NoticesContent from '@/components/NoticesContent';
import { getNoticeCategories, getPaginatedNotices } from '@/lib/supabase-notices';

type NoticesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const PAGE_SIZE = 10;

function getSingleParam(value: string | string[] | undefined) {
  return typeof value === 'string' ? value : undefined;
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

  return (
    <SiteChrome activePath="/notices">
      <NoticesContent 
        initialNotices={notices}
        totalCount={totalCount}
        categories={categories}
        currentCategory={currentCategory}
        query={query}
        currentPage={safeCurrentPage}
        totalPages={totalPages}
      />
    </SiteChrome>
  );
}
