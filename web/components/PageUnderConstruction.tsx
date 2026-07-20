import Link from 'next/link';
import { ArrowLeft, Construction } from 'lucide-react';

type PageUnderConstructionProps = {
  eyebrow: string;
  description: string;
};

export default function PageUnderConstruction({
  eyebrow,
  description,
}: PageUnderConstructionProps) {
  return (
    <main className="min-h-[calc(100vh-6rem)] bg-[radial-gradient(circle_at_top_right,rgba(14,74,132,0.13),transparent_32%),linear-gradient(180deg,#ffffff_0%,#f8f9fb_100%)] px-6 py-16 sm:py-24 lg:px-8">
      <section className="relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] border border-monolith-outline-variant/30 bg-monolith-surface-lowest px-7 py-14 shadow-[0_24px_80px_rgba(0,33,71,0.10)] sm:px-12 sm:py-20">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-monolith-primary-fixed/70 blur-3xl" />
        <div className="relative max-w-2xl">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-monolith-primary text-white shadow-[0_14px_28px_rgba(14,74,132,0.22)]">
            <Construction className="h-6 w-6" aria-hidden="true" />
          </div>

          <p className="mt-8 font-display text-xs font-bold uppercase tracking-[0.22em] text-monolith-primary-container">
            {eyebrow}
          </p>
          <h1 className="mt-4 break-keep text-4xl font-black tracking-[-0.06em] text-monolith-on-surface sm:text-5xl">
            페이지 작업중입니다.
          </h1>
          <p className="mt-5 max-w-xl break-keep text-base leading-8 text-monolith-on-surface-muted sm:text-lg">
            {description}
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-monolith-outline-variant/25 pt-8">
            <Link
              href="/"
              className="interactive-soft inline-flex items-center gap-2 rounded-xl bg-monolith-primary px-5 py-3 text-sm font-bold text-white shadow-[0_12px_28px_rgba(14,74,132,0.18)] transition hover:bg-monolith-primary-container"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              홈으로 돌아가기
            </Link>
            <span className="text-sm font-medium text-monolith-on-surface-muted">
              준비가 완료되면 다시 열릴 예정입니다.
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
