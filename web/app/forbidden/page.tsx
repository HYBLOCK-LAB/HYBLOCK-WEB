import Link from 'next/link';
import SiteChrome from '@/components/SiteChrome';

export default function ForbiddenPage() {
  return (
    <SiteChrome activePath="">
      <main className="min-h-screen">
        <section className="mx-auto max-w-3xl px-6 py-20 text-center lg:px-8">
          <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-monolith-primaryContainer">403 Forbidden</p>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.05em] text-monolith-primary md:text-5xl">
            관리자 권한이 필요합니다.
          </h1>
          <p className="mt-4 text-sm leading-7 text-monolith-onSurfaceMuted">
            현재 로그인한 세션으로는 관리자 페이지에 접근할 수 없습니다.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login?redirect=%2Fadmin"
              className="interactive-soft rounded-2xl border border-monolith-primaryContainer/30 bg-monolith-primary px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(0,51,97,0.2)] transition hover:brightness-105"
            >
              로그인 페이지로 이동
            </Link>
            <Link
              href="/"
              className="interactive-soft rounded-2xl border border-monolith-outlineVariant/25 bg-monolith-surfaceLow px-5 py-3 text-sm font-semibold text-monolith-onSurface transition hover:border-monolith-primaryContainer/30 hover:text-monolith-primary"
            >
              홈으로 돌아가기
            </Link>
          </div>
        </section>
      </main>
    </SiteChrome>
  );
}
