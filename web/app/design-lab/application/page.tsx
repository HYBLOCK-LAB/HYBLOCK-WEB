import { Check, FileText, UploadCloud } from 'lucide-react';
import DesignLabShell from '@/components/design-lab/DesignLabShell';

const steps = ['기본 정보', '관심 분야', '지원 동기'];

const inputClassName = 'mt-2 w-full rounded-lg border border-monolith-outline-variant/50 bg-monolith-surface-lowest px-4 py-3 text-sm text-monolith-on-surface outline-none transition placeholder:text-monolith-on-surface-muted/70 focus:border-monolith-primary focus:shadow-[0_0_0_3px_rgba(14,74,132,0.10)]';

export default function DesignLabApplicationPage() {
  return (
    <DesignLabShell
      activePath="/design-lab/application"
      eyebrow="Design Lab · Form"
      title="입력 과정은 차분하고 명확하게."
      description="지원서, 회원 정보, 설정처럼 입력이 많은 페이지에서 상태·레이블·행동 버튼의 일관성을 검증하는 샘플입니다."
    >
      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-16 lg:grid-cols-12 lg:px-8 lg:py-24">
        <aside className="rounded-2xl bg-monolith-primary p-8 text-white lg:col-span-4 lg:p-10">
          <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-blue-100/70">Application flow</p>
          <h2 className="mt-5 text-3xl font-black tracking-[-0.05em]">지원서 작성</h2>
          <ol className="mt-10 space-y-3">
            {steps.map((step, index) => (
              <li key={step} className={['flex items-center gap-4 rounded-xl px-4 py-4', index === 0 ? 'bg-white text-monolith-primary' : 'text-blue-100/70'].join(' ')}>
                <span className={['flex h-8 w-8 items-center justify-center rounded-full text-xs font-black', index === 0 ? 'bg-monolith-primary text-white' : 'border border-white/20'].join(' ')}>
                  {index === 0 ? <Check className="h-4 w-4" aria-hidden="true" /> : index + 1}
                </span>
                <span className="text-sm font-bold">{step}</span>
              </li>
            ))}
          </ol>
          <p className="mt-10 border-t border-white/15 pt-7 text-sm leading-7 text-blue-100/70">
            작성 내용은 샘플이며 저장되지 않습니다. 실제 폼에서는 오류 메시지를 입력 항목 바로 아래에 표시합니다.
          </p>
        </aside>

        <div className="rounded-2xl border border-monolith-outline-variant/30 bg-monolith-surface-lowest p-7 shadow-sm sm:p-10 lg:col-span-8">
          <div className="flex items-start gap-4 border-b border-monolith-outline-variant/30 pb-7">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-monolith-primary-fixed text-monolith-primary">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-monolith-on-surface">기본 정보</h2>
              <p className="mt-2 text-sm leading-6 text-monolith-on-surface-muted">연락 가능한 정보와 현재 소속을 입력해 주세요.</p>
            </div>
          </div>

          <form className="mt-8 space-y-7">
            <div className="grid gap-6 sm:grid-cols-2">
              <label className="text-sm font-bold text-monolith-on-surface">
                이름 <span className="text-monolith-error">*</span>
                <input className={inputClassName} type="text" placeholder="홍길동" />
              </label>
              <label className="text-sm font-bold text-monolith-on-surface">
                학번 <span className="text-monolith-error">*</span>
                <input className={inputClassName} type="text" inputMode="numeric" placeholder="2026000000" />
              </label>
            </div>

            <label className="block text-sm font-bold text-monolith-on-surface">
              이메일 <span className="text-monolith-error">*</span>
              <input className={inputClassName} type="email" placeholder="name@example.com" />
            </label>

            <label className="block text-sm font-bold text-monolith-on-surface">
              간단한 자기소개
              <textarea className={`${inputClassName} min-h-32 resize-y`} placeholder="관심 분야와 함께 소개해 주세요." />
            </label>

            <button type="button" className="interactive-soft flex w-full items-center justify-center gap-3 rounded-xl border border-dashed border-monolith-outline-variant bg-monolith-surface-low px-5 py-7 text-sm font-bold text-monolith-on-surface-muted hover:border-monolith-primary hover:text-monolith-primary">
              <UploadCloud className="h-5 w-5" aria-hidden="true" /> 포트폴리오 첨부
            </button>

            <div className="flex flex-col-reverse gap-3 border-t border-monolith-outline-variant/30 pt-7 sm:flex-row sm:justify-end">
              <button type="button" className="interactive-soft min-h-12 rounded-lg border border-monolith-outline-variant/50 px-6 text-sm font-bold text-monolith-on-surface-muted hover:bg-monolith-surface-high">임시 저장</button>
              <button type="button" className="interactive-soft min-h-12 rounded-lg bg-monolith-primary px-7 text-sm font-bold text-white shadow-[0_10px_24px_rgba(14,74,132,0.18)]">다음 단계</button>
            </div>
          </form>
        </div>
      </section>
    </DesignLabShell>
  );
}
