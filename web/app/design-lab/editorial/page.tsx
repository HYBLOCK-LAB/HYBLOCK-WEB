import { CalendarDays, Clock3, Quote } from 'lucide-react';
import DesignLabShell from '@/components/design-lab/DesignLabShell';

const chapters = [
  ['01', '문제에서 시작하기', '기술 이름보다 해결하려는 문제를 먼저 정의합니다. 문제의 경계가 분명할수록 구현과 회고도 구체적이 됩니다.'],
  ['02', '작게 연결하기', '화면, API, 데이터베이스를 한 번에 크게 만들기보다 가장 짧은 사용자 흐름부터 끝까지 연결합니다.'],
  ['03', '기록으로 남기기', '성공한 코드뿐 아니라 선택의 근거와 실패한 접근도 다음 팀이 이해할 수 있도록 남깁니다.'],
];

export default function DesignLabEditorialPage() {
  return (
    <DesignLabShell
      activePath="/design-lab/editorial"
      eyebrow="Design Lab · Editorial"
      title="긴 글에서도 브랜드의 리듬을 유지합니다."
      description="아티클, 회칙, 공지 상세처럼 읽기가 중심인 화면에서 제목·본문·인용·목차의 위계가 유지되는지 확인하는 샘플입니다."
    >
      <article className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-12 lg:px-8 lg:py-24">
        <aside className="lg:col-span-3">
          <div className="sticky top-32 rounded-xl border border-monolith-outline-variant/30 bg-monolith-surface-lowest p-6">
            <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-monolith-primary">Article info</p>
            <dl className="mt-6 space-y-5 text-sm">
              <div className="flex items-center gap-3 text-monolith-on-surface-muted">
                <CalendarDays className="h-4 w-4 text-monolith-primary" aria-hidden="true" />
                <div><dt className="sr-only">발행일</dt><dd>2026. 07. 20.</dd></div>
              </div>
              <div className="flex items-center gap-3 text-monolith-on-surface-muted">
                <Clock3 className="h-4 w-4 text-monolith-primary" aria-hidden="true" />
                <div><dt className="sr-only">읽는 시간</dt><dd>6 min read</dd></div>
              </div>
            </dl>
            <div className="mt-7 border-t border-monolith-outline-variant/30 pt-6">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-monolith-on-surface-muted">Contents</p>
              <ol className="mt-4 space-y-3 text-sm font-semibold text-monolith-on-surface">
                {chapters.map(([number, title]) => <li key={number}>{number}. {title}</li>)}
              </ol>
            </div>
          </div>
        </aside>

        <div className="lg:col-span-8 lg:col-start-5">
          <p className="text-xl font-medium leading-9 text-monolith-on-surface sm:text-2xl sm:leading-10">
            좋은 프로젝트는 많은 기능이 아니라, 한 사람이 처음부터 끝까지 이해할 수 있는 연결에서 시작합니다.
          </p>

          <blockquote className="my-12 rounded-r-xl border-l-8 border-monolith-primary bg-monolith-primary-fixed/55 px-7 py-8 sm:px-10">
            <Quote className="h-7 w-7 text-monolith-primary" aria-hidden="true" />
            <p className="mt-5 text-2xl font-black leading-tight tracking-[-0.04em] text-monolith-primary sm:text-3xl">
              화면은 데이터와 사람 사이의 마지막 인터페이스다.
            </p>
          </blockquote>

          <div className="space-y-14">
            {chapters.map(([number, title, body]) => (
              <section key={number} className="border-t border-monolith-outline-variant/30 pt-8">
                <div className="flex items-baseline gap-4">
                  <span className="font-display text-sm font-black text-monolith-primary">{number}</span>
                  <h2 className="text-3xl font-black tracking-[-0.05em] text-monolith-on-surface">{title}</h2>
                </div>
                <p className="mt-6 break-keep text-base leading-8 text-monolith-on-surface-muted sm:text-lg sm:leading-9">{body}</p>
              </section>
            ))}
          </div>
        </div>
      </article>
    </DesignLabShell>
  );
}
