'use client';

import { useState } from 'react';

type Evaluation = { id: string; evaluatorName: string; score: number; comment: string | null };
type DocumentItem = {
  id: string;
  prompt: string;
  maxScore: number;
  scoringMode: 'auto' | 'manual';
  answer: string;
  autoScore: number | null;
  score?: number;
  comment?: string;
  evaluations: Evaluation[];
};

export default function DocumentEvaluationForm({ applicationId, items, completed, globallyFinalized, isEvaluator }: {
  applicationId: string;
  items: DocumentItem[];
  completed: boolean;
  globallyFinalized: boolean;
  isEvaluator: boolean;
}) {
  const manualItems = items.filter((item) => item.scoringMode === 'manual');
  const [values, setValues] = useState<Record<string, { score: string; comment: string }>>(() => Object.fromEntries(
    manualItems.map((item) => [item.id, { score: item.score == null ? '' : String(item.score), comment: item.comment ?? '' }]),
  ));
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(completed);
  const [message, setMessage] = useState('');
  const locked = done || globallyFinalized || !isEvaluator;

  async function save(finalize: boolean) {
    if (finalize && !confirm('평가를 확정하면 점수와 코멘트를 수정할 수 없습니다. 확정할까요?')) return;
    const payload = manualItems.map((item) => ({ itemId: item.id, score: Number(values[item.id]?.score), comment: values[item.id]?.comment }));
    if (payload.some((item, index) => !Number.isFinite(item.score) || item.score < 0 || item.score > manualItems[index].maxScore)) {
      setMessage('모든 수동 채점 문항의 점수를 배점 범위 안에서 입력해 주세요.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/recruitment/evaluations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, kind: 'document', items: payload, finalize }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setMessage(finalize ? '지원서 평가를 확정했습니다.' : '지원서 평가를 임시 저장했습니다.');
      if (finalize) setDone(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '평가 저장에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  return <section className="mt-8">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-2xl font-black">지원서 답변 및 평가</h2><p className="mt-2 text-sm text-monolith-on-surface-muted">수동 채점 문항은 지원자 답변 바로 아래에서 평가합니다.</p></div>
      <span className="rounded-full bg-monolith-secondary-container px-3 py-1 text-xs font-bold text-monolith-primary">{done || globallyFinalized ? '내 평가 확정' : isEvaluator ? '내 평가 진행 중' : '평가자 아님'}</span>
    </div>
    <div className="mt-5 space-y-5">{items.map((item, index) => <article key={item.id} className="rounded-xl border border-monolith-outline-variant bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-monolith-primary">Question {index + 1} · 최대 {item.maxScore}점</p><h3 className="mt-3 text-lg font-black leading-7">{item.prompt}</h3></div><span className="rounded-full bg-monolith-surface-container px-3 py-1 text-xs font-bold">{item.scoringMode === 'auto' ? '자동 채점' : '관리자 수동 채점'}</span></div>
      <div className="mt-4 whitespace-pre-wrap rounded-lg bg-monolith-surface-low p-4 text-sm leading-7">{item.answer || '응답 없음'}</div>
      {item.scoringMode === 'auto' ? <div className="mt-4 rounded-lg bg-monolith-primary-fixed p-4"><p className="text-sm font-bold text-monolith-primary">자동 채점 결과: {item.autoScore ?? 0}점</p><p className="mt-1 text-xs text-monolith-on-surface-muted">자동 채점 문항은 관리자가 별도 점수를 입력하지 않습니다.</p></div> : <div className="mt-4 grid gap-3 sm:grid-cols-[160px_minmax(0,1fr)]">
        <label className="text-sm font-bold">내 점수<input disabled={locked} value={values[item.id]?.score ?? ''} onChange={(event) => setValues({ ...values, [item.id]: { ...values[item.id], score: event.target.value } })} className="mt-2 min-h-11 w-full rounded-lg border border-monolith-outline-variant px-3 disabled:bg-monolith-surface-container" type="number" min="0" max={item.maxScore} step="0.01" placeholder={`0–${item.maxScore}`} /></label>
        <label className="text-sm font-bold">내 코멘트 <span className="font-normal text-monolith-on-surface-muted">(선택)</span><textarea disabled={locked} value={values[item.id]?.comment ?? ''} onChange={(event) => setValues({ ...values, [item.id]: { ...values[item.id], comment: event.target.value } })} maxLength={4000} className="mt-2 min-h-20 w-full resize-y rounded-lg border border-monolith-outline-variant p-3 text-sm disabled:bg-monolith-surface-container" placeholder="평가 근거 또는 참고사항" /></label>
      </div>}
      {item.scoringMode === 'manual' && <div className="mt-5 border-t border-monolith-outline-variant pt-4"><p className="text-sm font-bold">전체 관리자 평가</p>{item.evaluations.length ? item.evaluations.map((evaluation) => <p key={evaluation.id} className="mt-2 text-sm"><strong>{evaluation.evaluatorName} · {evaluation.score}점</strong>{evaluation.comment && <span className="ml-2 text-monolith-on-surface-muted">{evaluation.comment}</span>}</p>) : <p className="mt-2 text-sm text-monolith-on-surface-muted">아직 저장된 평가가 없습니다.</p>}</div>}
    </article>)}</div>
    {message && <p className="mt-4 rounded-lg bg-monolith-surface-container p-4 text-sm font-bold">{message}</p>}
    {!locked && <div className="mt-5 flex justify-end gap-2">{manualItems.length > 0 && <button disabled={busy} onClick={() => save(false)} className="min-h-11 rounded-lg bg-monolith-surface-container px-4 text-sm font-bold">임시 저장</button>}<button disabled={busy} onClick={() => save(true)} className="min-h-11 rounded-lg bg-monolith-primary px-4 text-sm font-bold text-white">지원서 평가 확정</button></div>}
  </section>;
}
