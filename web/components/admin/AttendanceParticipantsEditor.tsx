'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';

export type ParticipantStatus = 'present' | 'late' | 'absent' | 'nonParticipation';
type Participant = {
  memberId: number;
  name: string;
  cohort: number | null;
  affiliation: 'development' | 'business' | null;
  status: ParticipantStatus;
};
const statuses: Array<{ value: ParticipantStatus; label: string; color: string }> = [
  { value: 'present', label: '출석', color: 'bg-blue-100 text-blue-900 border-blue-500' },
  { value: 'late', label: '지각', color: 'bg-amber-100 text-amber-900 border-amber-500' },
  { value: 'absent', label: '결석', color: 'bg-red-100 text-red-900 border-red-500' },
  { value: 'nonParticipation', label: '미참여', color: 'bg-slate-200 text-slate-800 border-slate-500' },
];

export default function AttendanceParticipantsEditor({ eventName, initialStatus = 'all', onClose, onChanged }: {
  eventName: string;
  initialStatus?: ParticipantStatus | 'all';
  onClose: () => void;
  onChanged: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ParticipantStatus | 'all'>(initialStatus);
  const [affiliation, setAffiliation] = useState('all');
  const [cohort, setCohort] = useState('all');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<ParticipantStatus>('present');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const response = await fetch(`/api/events?includeParticipants=true&eventName=${encodeURIComponent(eventName)}`, {
          cache: 'no-store', signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? '회원 목록을 불러오지 못했습니다.');
        if (!controller.signal.aborted) setParticipants(payload.participants ?? []);
      } catch (error) {
        if (!controller.signal.aborted) setError(error instanceof Error ? error.message : '회원 목록을 불러오지 못했습니다.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [eventName, reload]);

  const counts = useMemo(() => Object.fromEntries(statuses.map(({ value }) => [
    value, participants.filter((participant) => participant.status === value).length,
  ])), [participants]);
  const cohorts = useMemo(() => [...new Set(participants.map((p) => p.cohort).filter((v) => v !== null))].sort((a, b) => a - b), [participants]);
  const filtered = useMemo(() => participants.filter((participant) =>
    participant.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()) &&
    (statusFilter === 'all' || participant.status === statusFilter) &&
    (affiliation === 'all' || participant.affiliation === affiliation) &&
    (cohort === 'all' || String(participant.cohort) === cohort)
  ), [participants, search, statusFilter, affiliation, cohort]);
  const allVisibleSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.memberId));

  const save = async (memberIds: number[], status: ParticipantStatus) => {
    if (savingRef.current || memberIds.length === 0) return;
    savingRef.current = true;
    setSaving(true);
    setError(null);
    setMessage('');
    try {
      const response = await fetch('/api/events', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventName, memberIds, attendanceStatus: status }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? '출석 상태를 저장하지 못했습니다.');
      const changed = new Set(memberIds);
      setParticipants((current) => current.map((p) => changed.has(p.memberId) ? { ...p, status } : p));
      setSelected((current) => new Set([...current].filter((id) => !changed.has(id))));
      setMessage(`${memberIds.length}명의 상태를 ${statuses.find((s) => s.value === status)?.label}(으)로 저장했습니다.`);
      onChanged();
    } catch (error) {
      setError(error instanceof Error ? error.message : '출석 상태를 저장하지 못했습니다.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <dialog ref={dialog} onCancel={onClose} onClose={onClose} aria-labelledby="attendance-editor-title"
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-5xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-4 text-slate-900 shadow-2xl backdrop:bg-slate-950/40 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="attendance-editor-title" className="text-2xl font-black">{eventName} 출석 수정</h2>
          <p className="mt-2 text-sm text-slate-500">회원의 상태 버튼을 누르면 즉시 저장됩니다. 여러 회원은 선택 후 한 번에 변경할 수 있습니다.</p>
        </div>
        <button type="button" onClick={onClose} aria-label="출석 수정 닫기" className="rounded-xl p-2 hover:bg-slate-100"><X /></button>
      </div>
      <div className="mt-5 flex flex-wrap gap-2" aria-label="출석 상태 필터">
        <button type="button" aria-pressed={statusFilter === 'all'} onClick={() => setStatusFilter('all')}
          className={`rounded-full border px-3 py-2 text-sm ${statusFilter === 'all' ? 'border-blue-600 bg-blue-50 text-blue-900' : 'border-slate-200'}`}>전체 {participants.length}</button>
        {statuses.map(({ value, label, color }) => <button key={value} type="button" aria-pressed={statusFilter === value}
          onClick={() => setStatusFilter(value)} className={`rounded-full border px-3 py-2 text-sm ${statusFilter === value ? color : 'border-slate-200'}`}>{label} {counts[value]}</button>)}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3"><Search className="h-4 w-4 text-slate-400" />
          <input aria-label="회원 이름 검색" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="회원 이름 검색" className="min-w-0 flex-1 bg-transparent py-3 outline-none" />
        </label>
        <select aria-label="기수 필터" value={cohort} onChange={(event) => setCohort(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2">
          <option value="all">전체 기수</option>{cohorts.map((value) => <option key={value} value={value}>{value}기</option>)}
        </select>
        <select aria-label="파트 필터" value={affiliation} onChange={(event) => setAffiliation(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2">
          <option value="all">전체 파트</option><option value="development">개발</option><option value="business">비즈니스</option>
        </select>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 p-3">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={allVisibleSelected} disabled={loading || saving || !filtered.length}
          onChange={() => setSelected((current) => {
            const next = new Set(current);
            filtered.forEach((p) => allVisibleSelected ? next.delete(p.memberId) : next.add(p.memberId));
            return next;
          })} />검색 결과 전체 선택</label>
        <span className="text-sm font-semibold">{selected.size}명 선택</span>
        {selected.size > 0 ? <button type="button" disabled={saving} onClick={() => setSelected(new Set())} className="text-sm underline">선택 해제</button> : null}
        <select aria-label="일괄 변경 상태" value={bulkStatus} onChange={(event) => setBulkStatus(event.target.value as ParticipantStatus)} disabled={saving} className="rounded-lg border border-slate-200 px-2 py-2 text-sm">
          {statuses.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
        </select>
        <button type="button" disabled={saving || !selected.size || selected.size > 500} onClick={() => void save([...selected], bulkStatus)}
          className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">{saving ? '저장 중…' : `선택 ${selected.size}명 적용`}</button>
        <p className="w-full text-xs text-slate-500">필터를 바꿔도 선택은 유지됩니다. 일괄 변경은 선택한 모든 회원에 적용됩니다. (최대 500명)</p>
      </div>
      {error ? <div role="alert" className="mt-3 flex flex-wrap items-center gap-3 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}
        {!participants.length ? <button type="button" onClick={() => setReload((n) => n + 1)} className="underline">다시 불러오기</button> : null}
      </div> : null}
      <p role="status" className="mt-3 min-h-5 text-sm text-blue-900">{message}</p>
      <div className="mt-2 max-h-[45dvh] overflow-y-auto rounded-xl border border-slate-200">
        {loading ? <p className="p-5 text-sm text-slate-500">회원 목록을 불러오는 중입니다.</p> : filtered.length === 0 ? <p className="p-5 text-sm text-slate-500">조건에 맞는 회원이 없습니다.</p> : filtered.map((participant) => (
          <div key={participant.memberId} role="group" aria-label={`${participant.name} 출석 상태`} className="flex flex-col gap-3 border-b border-slate-100 p-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-3"><input type="checkbox" aria-label={`${participant.name} 선택`} checked={selected.has(participant.memberId)} disabled={saving}
              onChange={() => setSelected((current) => {
                const next = new Set(current);
                if (next.has(participant.memberId)) next.delete(participant.memberId); else next.add(participant.memberId);
                return next;
              })} />
              <span><span className="font-semibold">{participant.name}</span><span className="ml-2 text-xs text-slate-500">{participant.cohort ? `${participant.cohort}기 · ` : ''}{participant.affiliation === 'development' ? '개발' : participant.affiliation === 'business' ? '비즈니스' : '파트 미지정'}</span></span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {statuses.map(({ value, label, color }) => <button key={value} type="button" aria-pressed={participant.status === value} disabled={saving || participant.status === value}
                onClick={() => void save([participant.memberId], value)} className={`rounded-lg border px-3 py-2 text-sm font-semibold disabled:cursor-default ${participant.status === value ? color : 'border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40'}`}>{label}</button>)}
            </div>
          </div>
        ))}
      </div>
    </dialog>
  );
}
