'use client';

import SiteChrome from '@/components/SiteChrome';
import { bylawsChapters } from '@/lib/bylaws-content';
import { textContent } from '@/lib/text-content';
import { useLanguageStore } from '@/lib/auth/language-store';

export default function BylawsPage() {
  const { language } = useLanguageStore();
  const d = textContent[language].bylaws;

  return (
    <SiteChrome activePath="/bylaws">
      <main className="min-h-screen">
        <section className="relative overflow-hidden bg-monolith-primary">
          <div className="absolute inset-0 bg-gradient-to-t from-monolith-primary via-monolith-primary/70 to-transparent" />
          <div className="relative mx-auto flex min-h-[420px] max-w-7xl items-end px-6 py-16 sm:min-h-[480px] lg:min-h-[520px] lg:px-8 lg:py-20">
            <div>
              <span className="mb-4 block font-display text-sm font-bold uppercase tracking-[0.18em] text-monolith-primaryFixed">
                Academic Club
              </span>
              <h1 className="text-5xl font-black leading-none tracking-[-0.08em] text-white sm:text-6xl md:text-8xl">
                {d.title.toUpperCase()}
              </h1>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 sm:py-20 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-3xl">
            <p className="text-lg leading-8 text-monolith-onSurfaceMuted sm:text-xl">
              {d.intro}
            </p>
          </div>
        </section>

        <section className="bg-monolith-surfaceLowest px-6 py-16 sm:py-20 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-4xl">
            <div className="mb-20 text-center">
              <h2 className="text-5xl font-black uppercase tracking-[-0.08em] text-monolith-primary">Club Bylaws</h2>
            </div>
            <div className="space-y-12 text-monolith-onSurfaceMuted">
              {bylawsChapters.map((chapter) => (
                <section key={chapter.title} className="interactive-card rounded-xl border border-transparent px-4 py-4">
                  <h3 className="mb-6 border-l-4 border-monolith-primaryContainer pl-4 text-2xl font-bold text-monolith-primary">
                    {chapter.title}
                  </h3>
                  <div className="space-y-8 pl-5 leading-8">
                    {chapter.articles.map((article) => (
                      <article key={article.title} className="space-y-3">
                        <h4 className="text-xl font-bold text-monolith-onSurface">
                          {article.title}
                        </h4>
                        <div className="space-y-3">
                          {article.content.map((block, index) => (
                            Array.isArray(block) ? (
                              <div key={`${article.title}-${index}`} className="space-y-2 pl-4">
                                {block.map((item) => (
                                  <p key={item}>{item}</p>
                                ))}
                              </div>
                            ) : (
                              <p key={`${article.title}-${index}`}>{block}</p>
                            )
                          ))}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
            <div className="mt-20 rounded-lg border-t-2 border-monolith-primaryContainer bg-monolith-surfaceLow p-12">
              <p className="text-center text-sm text-monolith-onSurfaceMuted">
                {d.closingNote}
              </p>
              <p className="mt-4 text-center font-display text-sm uppercase tracking-[0.18em] text-monolith-onSurfaceMuted">
                {d.updatedAt}
              </p>
            </div>
          </div>
        </section>
      </main>
    </SiteChrome>
  );
}
