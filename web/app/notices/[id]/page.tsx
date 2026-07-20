import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import MarkdownContent from '@/components/MarkdownContent';
import SiteChrome from '@/components/SiteChrome';
import { getNoticeById } from '@/lib/supabase-notices';

type NoticeDetailPageProps = {
  params: Promise<{ id: string }>;
};

function formatNoticeDate(date: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

export const dynamic = 'force-dynamic';

export default async function NoticeDetailPage({ params }: NoticeDetailPageProps) {
  const { id } = await params;
  const noticeId = Number(id);

  if (!Number.isInteger(noticeId) || noticeId <= 0) {
    notFound();
  }

  const notice = await getNoticeById(noticeId).catch(() => null);

  if (!notice) {
    notFound();
  }

  return (
    <SiteChrome activePath="/notices">
      <main className="mx-auto max-w-5xl px-6 pb-20 pt-12 sm:pb-24 sm:pt-16 lg:px-8">
        <Link
          href="/notices"
          className="interactive-soft inline-flex items-center gap-2 rounded-full border border-monolith-outline-variant/30 bg-monolith-surface-low px-4 py-2 text-sm font-semibold text-monolith-on-surface-muted transition hover:bg-monolith-surface"
        >
          <ChevronLeft className="h-4 w-4" />
          공지 목록
        </Link>

        <article className="mt-8 overflow-hidden rounded-[2rem] border border-monolith-outline-variant/20 bg-monolith-surface-lowest shadow-[0_20px_50px_rgba(0,51,97,0.08)]">
          <header className="border-b border-monolith-outline-variant/15 bg-monolith-surface-low px-6 py-8 sm:px-8">
            <span className="inline-flex rounded-full bg-monolith-primary-fixed px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-monolith-primary">
              {notice.category}
            </span>
            <h1 className="mt-4 text-3xl font-black tracking-[-0.05em] text-monolith-on-surface sm:text-4xl">{notice.title}</h1>
            <div className="mt-4 flex flex-wrap gap-3 text-sm font-medium text-monolith-on-surface-muted">
              <span>{notice.author}</span>
              <span>•</span>
              <span>{formatNoticeDate(notice.date)}</span>
            </div>
          </header>

          <div className="px-6 py-8 sm:px-8">
            <MarkdownContent content={notice.content} />

            {notice.images.length > 0 ? (
              <section className="mt-10">
                <h2 className="text-lg font-black tracking-tight text-monolith-on-surface">첨부 이미지</h2>
                <div className="mt-4 grid gap-4">
                  {notice.images.map((image, index) => (
                    <div key={`${image}-${index}`} className="overflow-hidden rounded-2xl border border-monolith-outline-variant/20 bg-monolith-surface-low">
                      <img src={image} alt={`${notice.title} 이미지 ${index + 1}`} className="h-auto w-full object-cover" />
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </article>
      </main>
    </SiteChrome>
  );
}
