'use client';

import { FormEvent, ReactNode, useState } from 'react';

export default function DocumentEvaluationControls({ applicationId, items, locked, children }: {
  applicationId: string;
  items: Array<{ id: string; maxScore: number }>;
  locked: boolean;
  children: ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(locked);
  const [message, setMessage] = useState('');

  async function save(form: HTMLFormElement, finalize: boolean) {
    if (finalize && !confirm('평가를 확정하면 점수와 코멘트를 수정할 수 없습니다. 확정할까요?')) return;
    const formData = new FormData(form);
    const payload = items.map((item) => ({ itemId: item.id, score: Number(formData.get(`score-${item.id}`)), comment: String(formData.get(`comment-${item.id}`) ?? '') }));
    if (payload.some((item, index) => !Number.isFinite(item.score) || item.score < 0 || item.score > items[index].maxScore)) {
      setMessage('모든 수동 채점 문항의 점수를 배점 범위 안에서 입력해 주세요.');
      return;
    }
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/admin/recruitment/evaluations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ applicationId, kind: 'document', items: payload, finalize }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setMessage(finalize ? '지원서 평가를 확정했습니다.' : '지원서 평가를 임시 저장했습니다.');
      if (finalize) setDone(true);
    } catch (error) { setMessage(error instanceof Error ? error.message : '평가 저장에 실패했습니다.'); }
    finally { setBusy(false); }
  }

  return <form onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); void save(event.currentTarget, false); }}>
    {children}
    {message && <p className="mt-4 rounded-lg bg-monolith-surface-container p-4 text-sm font-bold">{message}</p>}
    {!done && <div className="mt-5 flex justify-end gap-2">{items.length > 0 && <button type="submit" disabled={busy} className="min-h-11 rounded-lg bg-monolith-surface-container px-4 text-sm font-bold disabled:opacity-60">임시 저장</button>}<button type="button" disabled={busy} onClick={(event) => { if (event.currentTarget.form) void save(event.currentTarget.form, true); }} className="min-h-11 rounded-lg bg-monolith-primary px-4 text-sm font-bold text-white disabled:opacity-60">지원서 평가 확정</button></div>}
  </form>;
}
