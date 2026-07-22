'use client';

import { FormEvent, useMemo, useState } from 'react';
import { CheckCircle2, Send } from 'lucide-react';
import type { OpenRecruitment } from '@/lib/recruitment';

const inputClass = 'mt-2 min-h-12 w-full rounded-lg border border-monolith-outline-variant bg-monolith-surface-lowest px-4 py-3 text-sm outline-none transition focus:border-monolith-primary focus:ring-3 focus:ring-blue-100';

export default function ApplicationForm({ recruitment }: { recruitment: OpenRecruitment }) {
  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  function toggleOption(questionId: string, optionId: string) {
    const current = Array.isArray(answers[questionId]) ? answers[questionId] as string[] : [];
    setAnswers({ ...answers, [questionId]: current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId] });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!confirm('제출 후에는 수정하거나 다시 제출할 수 없습니다. 지원서를 제출할까요?')) return;
    setSubmitting(true);
    setError('');
    const form = new FormData(event.currentTarget);
    const payload = {
      campaignId: recruitment.id,
      name: form.get('name'), birthYear: Number(form.get('birthYear')),
      university: form.get('university'), major: form.get('major'),
      email: form.get('email'), phone: form.get('phone'), trackId: form.get('trackId'),
      website: form.get('website'), privacyConsent: form.get('privacyConsent') === 'on', idempotencyKey,
      answers: recruitment.questions.map((question) => ({
        questionId: question.id,
        ...(question.type === 'long_text' ? { text: answers[question.id] ?? '' } : { optionIds: Array.isArray(answers[question.id]) ? answers[question.id] : answers[question.id] ? [answers[question.id] as string] : [] }),
      })),
    };
    try {
      const response = await fetch('/api/recruitment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || '지원서 제출에 실패했습니다.');
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : '지원서 제출에 실패했습니다.');
    } finally { setSubmitting(false); }
  }

  if (submitted) return (
    <section className="mx-auto max-w-2xl px-6 py-24 text-center">
      <CheckCircle2 className="mx-auto h-14 w-14 text-monolith-primary" aria-hidden="true" />
      <h1 className="mt-6 text-4xl font-black">지원서가 제출되었습니다.</h1>
      <p className="mt-4 leading-7 text-monolith-on-surface-muted">제출한 지원서는 수정하거나 다시 제출할 수 없습니다. 결과는 기재한 이메일 또는 전화번호로 안내합니다.</p>
    </section>
  );

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <input className="hidden" tabIndex={-1} autoComplete="off" name="website" aria-hidden="true" />
      <section className="rounded-xl border border-monolith-outline-variant bg-monolith-surface-lowest p-6 sm:p-8">
        <h2 className="text-2xl font-black">기본 정보</h2>
        <p className="mt-2 text-sm text-monolith-on-surface-muted">모든 항목은 필수이며 연락 가능한 정보를 입력해 주세요.</p>
        <div className="mt-7 grid gap-6 sm:grid-cols-2">
          <label className="text-sm font-bold">이름<input className={inputClass} name="name" maxLength={100} required /></label>
          <label className="text-sm font-bold">출생연도<input className={inputClass} name="birthYear" type="number" min="1900" max={new Date().getFullYear()} placeholder="2002" required /></label>
          <label className="text-sm font-bold">대학교<input className={inputClass} name="university" maxLength={160} required /></label>
          <label className="text-sm font-bold">전공<input className={inputClass} name="major" maxLength={160} required /></label>
          <label className="text-sm font-bold">이메일<input className={inputClass} name="email" type="email" maxLength={320} required /></label>
          <label className="text-sm font-bold">전화번호<input className={inputClass} name="phone" type="tel" maxLength={40} placeholder="010-0000-0000" required /></label>
          <label className="text-sm font-bold sm:col-span-2">지원 분야
            <select className={inputClass} name="trackId" defaultValue="" required><option value="" disabled>분야를 선택해 주세요</option>{recruitment.tracks.map((track) => <option key={track.id} value={track.id}>{track.label}</option>)}</select>
          </label>
        </div>
      </section>

      {recruitment.questions.map((question, index) => (
        <section key={question.id} className="rounded-xl border border-monolith-outline-variant bg-monolith-surface-lowest p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-monolith-primary">Question {index + 1}</p>
          <h2 className="mt-3 text-xl font-black leading-7">{question.prompt} {question.required && <span className="text-monolith-error">*</span>}</h2>
          {question.description && <p className="mt-2 text-sm leading-6 text-monolith-on-surface-muted">{question.description}</p>}
          {question.type === 'long_text' ? (
            <div className="mt-5">
              <textarea className={`${inputClass} min-h-40 resize-y`} value={(answers[question.id] as string) ?? ''} onChange={(event) => setAnswers({ ...answers, [question.id]: event.target.value })} minLength={question.minLength ?? undefined} maxLength={question.maxLength ?? undefined} required={question.required} />
              <p className="mt-2 text-right text-xs text-monolith-on-surface-muted">{String(answers[question.id] ?? '').length}{question.maxLength ? ` / ${question.maxLength}자` : '자'}</p>
            </div>
          ) : (
            <div className="mt-5 grid gap-3">
              {question.options.map((option) => <label key={option.id} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-monolith-outline-variant px-4 py-3 text-sm hover:bg-monolith-surface-low">
                <input type={question.type === 'multiple_choice' ? 'checkbox' : 'radio'} name={`question-${question.id}`} checked={question.type === 'multiple_choice' ? (answers[question.id] as string[] ?? []).includes(option.id) : answers[question.id] === option.id} onChange={() => question.type === 'multiple_choice' ? toggleOption(question.id, option.id) : setAnswers({ ...answers, [question.id]: option.id })} required={question.required && question.type !== 'multiple_choice'} />
                <span>{option.label}</span>
              </label>)}
            </div>
          )}
        </section>
      ))}

      <section className="rounded-xl bg-monolith-surface-container p-6 sm:p-8">
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-6"><input className="mt-1" type="checkbox" name="privacyConsent" required /><span><strong>[필수] 개인정보 수집·이용에 동의합니다.</strong><br /><span className="text-monolith-on-surface-muted">{recruitment.privacyConsent.text}</span></span></label>
      </section>
      {error && <p role="alert" className="rounded-xl bg-monolith-error-container p-4 text-sm font-bold">{error}</p>}
      <button disabled={submitting} className="interactive-soft inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-monolith-primary px-7 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"><Send className="h-4 w-4" aria-hidden="true" />{submitting ? '제출 중...' : '지원서 제출'}</button>
      <p className="text-center text-sm text-monolith-on-surface-muted">제출 후 수정·취소·재제출은 불가능합니다.</p>
    </form>
  );
}
