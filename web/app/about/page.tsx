import Image from 'next/image';
import SiteChrome from '@/components/SiteChrome';
import { aboutHistory, aboutValues, aboutVision } from '@/lib/site-content';

export default function AboutPage() {
  return (
    <SiteChrome activePath="/about">
      <main className="min-h-screen">
        <section className="relative overflow-hidden bg-monolith-primary">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#0b3276_0%,#08275f_38%,#061d49_68%,#051638_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.03)_28%,rgba(255,255,255,0)_60%)]" />
          <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:120px_120px]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(0,0,0,0.12)_55%,rgba(0,0,0,0.28)_100%)]" />
          <div className="relative mx-auto flex min-h-[420px] max-w-7xl items-center justify-center px-6 py-20 text-center sm:min-h-[500px] lg:min-h-[580px] lg:px-8">
            <div className="flex max-w-3xl flex-col items-center">
              <div className="relative h-40 w-40 sm:h-52 sm:w-52 md:h-64 md:w-64">
                <Image src="/logo_original.png" alt="HYBLOCK logo" fill className="object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.4)]" priority />
              </div>
              <p className="mt-8 font-display text-sm font-bold uppercase tracking-[0.28em] text-white/70">
                Academic Club
              </p>
              <p className="mt-4 text-lg font-light italic tracking-[0.01em] text-white/72 sm:text-2xl">
                "Beyond the Chain, Higher Block"
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 sm:py-20 lg:px-8 lg:py-24">
          <div className="space-y-24">
            <section>
              <h3 className="text-3xl font-bold uppercase tracking-tight text-monolith-primary">Mission</h3>
              <div className="mt-8 rounded-r-xl border-l-8 border-monolith-primaryContainer bg-monolith-surfaceLow p-12">
                <p className="max-w-4xl text-xl font-light leading-snug text-monolith-primary sm:text-2xl">
                  {aboutVision}
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-3xl font-bold uppercase tracking-tight text-monolith-primary">Core Values</h3>
              <div className="mt-12 grid gap-4 md:grid-cols-3">
                {aboutValues.map((value) => (
                  <div
                    key={value.number}
                    className="interactive-card rounded-lg border border-monolith-outlineVariant/30 bg-monolith-surfaceLowest p-8 md:p-10 hover:bg-monolith-primary/5"
                  >
                    <span className="mb-4 block text-sm font-bold text-monolith-primary">{value.number}</span>
                    <h4 className="mb-4 text-xl font-bold uppercase tracking-tight text-monolith-onSurface">{value.title}</h4>
                    <p className="text-sm leading-7 text-monolith-onSurfaceMuted">{value.description}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <div className="mb-10">
                <span className="block h-3 w-12 bg-monolith-primary" />
                <h3 className="mt-3 text-4xl font-black tracking-[-0.06em] text-black">연혁</h3>
              </div>

              <div className="relative overflow-hidden bg-[#f8f8f6] px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
                <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-[36px] -translate-x-1/2 bg-[linear-gradient(180deg,#08163a_0%,#0b2a6d_28%,#123c96_56%,#0b2a6d_78%,#08163a_100%)] shadow-[0_0_32px_rgba(12,53,133,0.35)] lg:block" />

                <div className="relative space-y-10 lg:space-y-0">
                  {aboutHistory.map((item, index) => (
                    <div
                      key={item.year}
                      className={[
                        'relative lg:grid lg:grid-cols-[minmax(0,1fr)_72px_minmax(0,1fr)]',
                        index > 0 ? 'lg:-mt-6' : '',
                      ].join(' ')}
                    >
                      <div
                        className={[
                          'lg:px-10',
                          item.side === 'left'
                            ? 'lg:col-start-1 lg:text-right'
                            : 'lg:col-start-3 lg:text-left',
                        ].join(' ')}
                      >
                        <div
                          className={[
                            'mx-auto max-w-[280px] border-t border-black/70 pt-5 lg:mx-0',
                            item.side === 'left' ? 'lg:ml-auto' : '',
                          ].join(' ')}
                        >
                          <div className="flex items-baseline gap-3 lg:gap-4">
                            <span className="text-5xl font-black tracking-[-0.08em] text-[#33479b] sm:text-6xl">{item.year}</span>
                            <h4 className="text-2xl font-black tracking-[-0.05em] text-black sm:text-4xl">{item.title}</h4>
                          </div>
                          <p className="mt-4 whitespace-pre-line text-lg leading-8 text-black/55">{item.description}</p>
                        </div>
                      </div>

                      <div className="hidden lg:block" />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </section>
      </main>
    </SiteChrome>
  );
}
