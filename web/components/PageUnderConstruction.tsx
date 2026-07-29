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
    <main className="min-h-[calc(100vh-6rem)] bg-monolith-surface px-6 py-16 sm:py-24 lg:px-8">
      <section className="mx-auto max-w-4xl border-y border-monolith-outline-variant py-14 sm:py-20">
        <div className="max-w-2xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-monolith-outline-variant bg-monolith-surface-low text-monolith-primary">
            <Construction className="h-5 w-5" aria-hidden="true" />
          </div>

          <p className="mt-8 font-display text-xs font-bold uppercase tracking-[0.22em] text-monolith-primary-container">
            {eyebrow}
          </p>
          <h1 className="mt-4 break-keep text-4xl font-black tracking-[-0.04em] text-monolith-on-surface sm:text-5xl">
            페이지 작업중입니다.
          </h1>
          <p className="mt-5 max-w-xl break-keep text-base leading-8 text-monolith-on-surface-muted sm:text-lg">
            {description}
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-monolith-outline-variant/25 pt-8">
            <Link
              href="/"
              className="interactive-soft inline-flex min-h-11 items-center gap-2 rounded-lg bg-monolith-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-monolith-primary-container"
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
