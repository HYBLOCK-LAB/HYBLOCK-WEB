import DocumentEvaluationControls from '@/components/recruitment/DocumentEvaluationControls';

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
  const locked = completed || globallyFinalized || !isEvaluator;

  return <section className="mt-8">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-2xl font-black">지원서 답변 및 평가</h2><p className="mt-2 text-sm text-monolith-on-surface-muted">수동 채점 문항은 지원자 답변 바로 아래에서 평가합니다.</p></div>
      <span className="rounded-full bg-monolith-secondary-container px-3 py-1 text-xs font-bold text-monolith-primary">{completed || globallyFinalized ? '내 평가 확정' : isEvaluator ? '내 평가 진행 중' : '평가자 아님'}</span>
    </div>
    <DocumentEvaluationControls applicationId={applicationId} items={manualItems.map(({ id, maxScore }) => ({ id, maxScore }))} locked={locked}>
      <div className="mt-5 space-y-5">{items.map((item, index) => <article key={item.id} className="min-w-0 rounded-xl border border-monolith-outline-variant bg-white p-6">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.16em] text-monolith-primary">Question {index + 1} · 최대 {item.maxScore}점</p><h3 className="mt-3 break-words text-lg font-black leading-7 [overflow-wrap:anywhere]">{item.prompt}</h3></div><span className="shrink-0 rounded-full bg-monolith-surface-container px-3 py-1 text-xs font-bold">{item.scoringMode === 'auto' ? '자동 채점' : '관리자 수동 채점'}</span></div>
        <div className="mt-4 min-w-0 whitespace-pre-wrap break-words rounded-lg bg-monolith-surface-low p-4 text-sm leading-7 [overflow-wrap:anywhere]">{item.answer || '응답 없음'}</div>
        {item.scoringMode === 'auto' ? <div className="mt-4 rounded-lg bg-monolith-primary-fixed p-4"><p className="text-sm font-bold text-monolith-primary">자동 채점 결과: {item.autoScore ?? 0}점</p><p className="mt-1 text-xs text-monolith-on-surface-muted">자동 채점 문항은 관리자가 별도 점수를 입력하지 않습니다.</p></div> : <div className="mt-4 grid gap-3 sm:grid-cols-[160px_minmax(0,1fr)]">
          <label className="text-sm font-bold">내 점수<input name={`score-${item.id}`} disabled={locked} defaultValue={item.score == null ? '' : String(item.score)} className="mt-2 min-h-11 w-full rounded-lg border border-monolith-outline-variant px-3 disabled:bg-monolith-surface-container" type="number" min="0" max={item.maxScore} step="0.01" placeholder={`0–${item.maxScore}`} /></label>
          <label className="min-w-0 text-sm font-bold">내 코멘트 <span className="font-normal text-monolith-on-surface-muted">(선택)</span><textarea name={`comment-${item.id}`} disabled={locked} defaultValue={item.comment ?? ''} maxLength={4000} className="mt-2 min-h-20 w-full resize-y rounded-lg border border-monolith-outline-variant p-3 text-sm disabled:bg-monolith-surface-container" placeholder="평가 근거 또는 참고사항" /></label>
        </div>}
        {item.scoringMode === 'manual' && <div className="mt-5 min-w-0 border-t border-monolith-outline-variant pt-4"><p className="text-sm font-bold">전체 관리자 평가</p>{item.evaluations.length ? item.evaluations.map((evaluation) => <p key={evaluation.id} className="mt-2 break-words text-sm [overflow-wrap:anywhere]"><strong>{evaluation.evaluatorName} · {evaluation.score}점</strong>{evaluation.comment && <span className="ml-2 text-monolith-on-surface-muted">{evaluation.comment}</span>}</p>) : <p className="mt-2 text-sm text-monolith-on-surface-muted">아직 저장된 평가가 없습니다.</p>}</div>}
      </article>)}</div>
    </DocumentEvaluationControls>
  </section>;
}
