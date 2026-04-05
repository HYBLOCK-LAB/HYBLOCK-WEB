import Image from 'next/image';
import SiteChrome from '@/components/SiteChrome';
import { aboutHeroImage, aboutHistory, aboutValues, aboutVision } from '@/lib/site-content';

export default function AboutPage() {
  return (
    <SiteChrome activePath="/about">
      <main className="min-h-screen">
        <section className="relative overflow-hidden bg-monolith-primary">
          {aboutHeroImage.src ? (
            <div className="absolute inset-0">
              <Image
                src={aboutHeroImage.src}
                alt={aboutHeroImage.alt}
                fill
                className="object-cover"
                priority
              />
            </div>
          ) : (
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(7,34,78,0.18),rgba(7,34,78,0.04))]">
              <div className="mx-auto flex h-full max-w-7xl items-center justify-end px-6 lg:px-8">
                <div className="rounded-[2rem] border border-white/20 bg-white/10 px-8 py-10 text-right backdrop-blur-sm">
                  <p className="font-display text-xs font-bold uppercase tracking-[0.22em] text-white/70">
                    Photo Slot
                  </p>
                  <p className="mt-4 max-w-sm text-lg font-semibold text-white">
                    `site-content.ts`의 `aboutHeroImage.src`에 사진 경로를 넣으면 이 배경에 표시됩니다.
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-monolith-primary via-monolith-primary/78 to-monolith-primary/20" />
          <div className="relative mx-auto flex min-h-[420px] max-w-7xl items-end px-6 py-16 sm:min-h-[480px] lg:min-h-[520px] lg:px-8 lg:py-20">
            <div>
              <span className="mb-4 block font-display text-sm font-bold uppercase tracking-[0.18em] text-monolith-primaryFixed">
                Academic Society
              </span>
              <h1 className="text-5xl font-black leading-none tracking-[-0.08em] text-white sm:text-6xl md:text-8xl">
                ABOUT
              </h1>
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
        </section>
      </main>
    </SiteChrome>
  );
}
