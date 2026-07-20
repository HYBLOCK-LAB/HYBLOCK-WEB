import Link from 'next/link';
import { ArrowUpRight, Blocks, Orbit, ShieldCheck } from 'lucide-react';
import DesignLabShell from '@/components/design-lab/DesignLabShell';

const principles = [
  {
    icon: Blocks,
    number: '01',
    title: 'Structured',
    description: '명확한 그리드와 큰 여백으로 정보의 우선순위를 먼저 보여줍니다.',
  },
  {
    icon: Orbit,
    number: '02',
    title: 'Progressive',
    description: '블록체인의 확장성과 학회의 성장성을 선명한 대비로 표현합니다.',
  },
  {
    icon: ShieldCheck,
    number: '03',
    title: 'Credible',
    description: '과도한 장식보다 읽기 쉬운 타이포그래피와 일관된 상태 표현을 우선합니다.',
  },
];

export default function DesignLabLandingPage() {
  return (
    <DesignLabShell
      activePath="/design-lab"
      eyebrow="Design Lab · Marketing"
      title="하나의 인상, 다양한 페이지."
      description="HYBLOCK의 굵은 타이포그래피, 모놀리스 블루, 넓은 여백이 소개형 랜딩에서도 같은 인상을 만드는지 확인하는 샘플입니다."
    >
      <section className="bg-monolith-primary text-white">
        <div className="bg-monolith-grid">
          <div className="mx-auto grid max-w-7xl gap-14 px-6 py-20 lg:grid-cols-12 lg:px-8 lg:py-28">
            <div className="lg:col-span-8">
              <span className="inline-flex rounded-full bg-white/10 px-4 py-2 font-display text-xs font-bold uppercase tracking-[0.2em] text-blue-100">
                Beyond the Chain
              </span>
              <h2 className="mt-8 max-w-4xl text-5xl font-black uppercase leading-[0.92] tracking-[-0.07em] sm:text-6xl lg:text-8xl">
                Build higher.<br />Learn together.
              </h2>
              <p className="mt-8 max-w-2xl break-keep text-lg leading-8 text-blue-100/80">
                기술을 공부하는 데서 멈추지 않고, 함께 구현하고 기록하며 다음 블록을 쌓습니다.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link href="/about" className="interactive-soft inline-flex min-h-12 items-center justify-center rounded-full bg-white px-7 text-sm font-bold text-monolith-primary">
                  HYBLOCK 소개
                </Link>
                <Link href="/activities" className="interactive-soft inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/25 px-7 text-sm font-bold text-white hover:bg-white/10">
                  활동 둘러보기 <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>

            <aside className="flex items-end lg:col-span-4">
              <div className="w-full rounded-2xl border border-white/15 bg-white/10 p-7 backdrop-blur-sm">
                <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-blue-100/70">Current block</p>
                <p className="mt-5 text-6xl font-black tracking-[-0.08em]">2026</p>
                <div className="mt-8 h-px bg-white/15" />
                <p className="mt-6 text-sm leading-7 text-blue-100/75">Academic research, product experiments, and an open technical community.</p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
        <div className="grid gap-4 md:grid-cols-3">
          {principles.map(({ icon: Icon, number, title, description }) => (
            <article key={number} className="rounded-xl border border-monolith-outline-variant/30 bg-monolith-surface-lowest p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-monolith">
              <div className="flex items-center justify-between">
                <Icon className="h-6 w-6 text-monolith-primary" aria-hidden="true" />
                <span className="font-display text-xs font-bold tracking-[0.18em] text-monolith-on-surface-muted">{number}</span>
              </div>
              <h3 className="mt-10 text-2xl font-black uppercase text-monolith-on-surface">{title}</h3>
              <p className="mt-4 break-keep text-sm leading-7 text-monolith-on-surface-muted">{description}</p>
            </article>
          ))}
        </div>
      </section>
    </DesignLabShell>
  );
}
