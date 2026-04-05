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
              <div className="relative h-28 w-24 sm:h-36 sm:w-32 md:h-44 md:w-40">
                <Image src="/logo.png" alt="HYBLOCK logo" fill className="object-contain drop-shadow-[0_18px_40px_rgba(0,0,0,0.4)]" priority />
              </div>
              <div className="relative mt-5 h-12 w-[210px] sm:h-16 sm:w-[280px] md:h-20 md:w-[360px]">
                <Image src="/logo_name.png" alt="HYBLOCK" fill className="object-contain drop-shadow-[0_16px_34px_rgba(0,0,0,0.35)]" priority />
              </div>
              <p className="mt-6 font-display text-sm font-bold uppercase tracking-[0.28em] text-white/70">
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
