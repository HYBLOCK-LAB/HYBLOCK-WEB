import Image from 'next/image';
import SiteChrome from '@/components/SiteChrome';
import { aboutHistory, aboutValues, bylaws } from '@/lib/site-content';

export default function BylawsPage() {
  return (
    <SiteChrome activePath="/bylaws">
      <main className="min-h-screen">
        <section className="relative overflow-hidden bg-monolith-primary">
          <div className="absolute inset-0 bg-gradient-to-t from-monolith-primary via-monolith-primary/70 to-transparent" />
          <div className="relative mx-auto flex min-h-[420px] max-w-7xl items-end px-6 py-16 sm:min-h-[480px] lg:min-h-[520px] lg:px-8 lg:py-20">
            <div>
              <span className="mb-4 block font-display text-sm font-bold uppercase tracking-[0.18em] text-monolith-primaryFixed">
                Academic Society
              </span>
              <h1 className="text-5xl font-black leading-none tracking-[-0.08em] text-white sm:text-6xl md:text-8xl">
                BYLAWS
              </h1>
            </div>
          </div>
        </section>

        <section className="border-b border-monolith-outlineVariant/30 bg-monolith-surfaceLow">
          <div className="mx-auto flex max-w-7xl px-6 lg:px-8">
            <div className="border-r border-monolith-outlineVariant/20 bg-monolith-surface px-12 py-6 font-display text-lg font-bold text-monolith-primary">
              회칙
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 sm:py-20 lg:px-8 lg:py-24">
          <div className="grid gap-16 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <div className="top-32 lg:sticky">
                <div className="mb-8 rounded-xl bg-monolith-surfaceLowest p-6 shadow-monolith">
                  <Image
                    src="/logo_name.png"
                    alt="HYBLOCK"
                    width={1975}
                    height={780}
                    className="h-auto w-full object-contain"
                  />
                </div>
                <p className="mt-6 text-lg leading-8 text-monolith-onSurfaceMuted">
                  HYBLOCK은 학술적 탐구와 실천적 개발을 통해 블록체인 생태계의 미래를 선도하는 공동체입니다.
                </p>
              </div>
            </div>

            <div className="space-y-24 lg:col-span-8">
              <section>
                <h3 className="text-3xl font-bold uppercase tracking-tight text-monolith-primary">Mission</h3>
                <div className="mt-8 rounded-r-xl border-l-8 border-monolith-primaryContainer bg-monolith-surfaceLow p-12">
                  <p className="text-xl font-light italic leading-snug text-monolith-primary sm:text-2xl">
                    "블록체인 기술의 대중화와 학술적 깊이를 더하여, 투명하고 공정한 디지털 사회의 초석을 다진다."
                  </p>
                </div>
              </section>

              <section>
                <h3 className="text-3xl font-bold uppercase tracking-tight text-monolith-primary">Core Values</h3>
                <div className="mt-12 grid gap-4 md:grid-cols-2">
                  {aboutValues.map((value) => (
                    <div key={value.number} className="interactive-card rounded-lg border border-monolith-outlineVariant/30 bg-monolith-surfaceLowest p-8 md:p-10 hover:bg-monolith-primary/5">
                      <span className="mb-4 block text-sm font-bold text-monolith-primary">{value.number}</span>
                      <h4 className="mb-4 text-xl font-bold text-monolith-onSurface">{value.title}</h4>
                      <p className="text-sm leading-7 text-monolith-onSurfaceMuted">{value.description}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-3xl font-bold uppercase tracking-tight text-monolith-primary">History</h3>
              <div className="relative ml-3 mt-12 space-y-12 border-l-2 border-monolith-primary/20 pl-10 sm:space-y-16 sm:pl-12">
                  {aboutHistory.map((item, index) => (
                    <div key={item.year} className="relative">
                      <div
                        className={[
                          'absolute -left-[54px] top-1 h-6 w-6 rounded-sm',
                          index === 0 ? 'bg-monolith-primary' : index === 1 ? 'bg-monolith-primary/60' : 'bg-monolith-primary/30',
                        ].join(' ')}
                      />
                      <span className="block text-2xl font-black text-monolith-primary">{item.year}</span>
                      <p className="mt-2 text-monolith-onSurfaceMuted">{item.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </section>

        <section className="bg-monolith-surfaceLowest px-6 py-16 sm:py-20 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-4xl">
            <div className="mb-20 text-center">
              <h2 className="text-5xl font-black uppercase tracking-[-0.08em] text-monolith-primary">Society Bylaws</h2>
              <p className="mt-4 font-display text-sm uppercase tracking-[0.18em] text-monolith-onSurfaceMuted">Last Updated: January 2024</p>
            </div>
            <div className="space-y-12 text-monolith-onSurfaceMuted">
              {bylaws.map((chapter) => (
                <section key={chapter.title} className="interactive-card rounded-xl border border-transparent px-4 py-4">
                  <h3 className="mb-6 border-l-4 border-monolith-primaryContainer pl-4 text-2xl font-bold text-monolith-primary">
                    {chapter.title}
                  </h3>
                  <div className="space-y-5 pl-5 leading-8">
                    {chapter.items.map((item) => (
                      <p key={item}>{item}</p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
            <div className="mt-20 rounded-lg border-t-2 border-monolith-primaryContainer bg-monolith-surfaceLow p-12">
              <p className="text-center text-sm text-monolith-onSurfaceMuted">
                이상의 회칙은 공포한 날로부터 즉시 시행하며, 개정 시 전체 회원의 2/3 이상의 출석과 과반수 찬성을 필요로 합니다.
              </p>
            </div>
          </div>
        </section>
      </main>
    </SiteChrome>
  );
}
