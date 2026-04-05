import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Pin } from 'lucide-react';
import SiteChrome from '@/components/SiteChrome';
import { noticeCategories, notices } from '@/lib/site-content';
import { textContent } from '@/lib/text-content';

export default function NoticesPage() {
  return (
    <SiteChrome activePath="/notices">
      <main className="mx-auto max-w-7xl px-6 pb-20 pt-12 sm:pb-24 sm:pt-16 lg:px-8">
        <header className="pb-14 pt-6">
          <span className="mb-4 inline-block rounded-full bg-monolith-secondaryContainer px-3 py-1 font-display text-xs font-bold tracking-[0.18em] text-monolith-primaryContainer">
            RESOURCES
          </span>
          <h1 className="text-5xl font-bold tracking-[-0.06em] text-monolith-primary md:text-6xl">공지사항</h1>
          <p className="mt-4 max-w-xl text-lg text-monolith-onSurfaceMuted">
            {textContent.notices.description}
          </p>
        </header>

        <section className="mb-8 flex flex-col gap-4 rounded-xl bg-monolith-surfaceLow p-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {noticeCategories.map((category, index) => (
              <button
                key={category}
                className={[
                  'interactive-soft rounded-lg px-4 py-2 text-sm transition',
                  index === 0
                    ? 'bg-monolith-surfaceLowest font-bold text-monolith-primary shadow-sm'
                    : 'text-monolith-onSurfaceMuted hover:bg-monolith-surfaceHigh',
                ].join(' ')}
              >
                {category}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="검색어를 입력하세요"
            className="w-full rounded-lg border border-monolith-outlineVariant/40 bg-monolith-surfaceLowest px-4 py-2.5 text-sm outline-none ring-0 transition placeholder:text-monolith-onSurfaceMuted focus:border-monolith-primaryContainer focus:shadow-[0_10px_30px_rgba(0,51,97,0.08)] md:w-80"
          />
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
                {notices.map((notice) => (
                  <tr key={notice.id} className={notice.pinned ? 'bg-monolith-primaryFixed/30' : 'cursor-pointer transition hover:bg-monolith-surfaceLow'}>
                    <td className="px-6 py-5 text-sm font-bold text-monolith-primary">
                      {notice.pinned ? <Pin className="h-4 w-4 fill-current" /> : notice.id}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={['rounded-md px-2 py-1 text-[10px] font-bold', notice.pinned ? 'bg-monolith-primary text-white' : 'bg-monolith-surfaceHigh text-monolith-onSurfaceMuted'].join(' ')}>
                        {notice.category}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-base font-semibold text-monolith-onSurface">{notice.title}</td>
                    <td className="px-6 py-5 text-sm font-medium text-monolith-onSurfaceMuted">{notice.author}</td>
                    <td className="px-6 py-5 text-right font-display text-sm text-monolith-onSurfaceMuted">{notice.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="mt-12 flex items-center justify-center gap-2">
          {[ChevronsLeft, ChevronLeft].map((Icon, index) => (
            <button key={index} className="interactive-soft rounded-lg border border-monolith-outlineVariant/30 p-2 text-monolith-onSurfaceMuted transition hover:bg-monolith-surfaceHigh">
              <Icon className="h-4 w-4" />
            </button>
          ))}
          <div className="mx-4 flex gap-1">
            {[1, 2, 3, 4, 5].map((page) => (
              <button
                key={page}
                className={[
                  'interactive-soft h-10 w-10 rounded-lg font-display',
                  page === 1 ? 'bg-monolith-primary text-white' : 'text-monolith-onSurfaceMuted hover:bg-monolith-surfaceHigh',
                ].join(' ')}
              >
                {page}
              </button>
            ))}
          </div>
          {[ChevronRight, ChevronsRight].map((Icon, index) => (
            <button key={index} className="interactive-soft rounded-lg border border-monolith-outlineVariant/30 p-2 text-monolith-onSurfaceMuted transition hover:bg-monolith-surfaceHigh">
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </main>
    </SiteChrome>
  );
}
