'use client';

import { useState } from 'react';
import { applicationStatusLabels } from '@/lib/recruitment-admin';

export default function ApplicantStatusControl({ applicationId, initialStatus }: { applicationId: string; initialStatus: string }) {
  const [status, setStatus] = useState(initialStatus); const [saving, setSaving] = useState(false); const [message, setMessage] = useState('');
  async function save() { setSaving(true); setMessage(''); try { const response = await fetch('/api/admin/recruitment/status', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ applicationIds: [applicationId], status }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error); setMessage('저장됨'); } catch (error) { setMessage(error instanceof Error ? error.message : '저장 실패'); } finally { setSaving(false); } }
  return <div className="flex flex-wrap items-center gap-2"><select value={status} onChange={(e) => setStatus(e.target.value)} className="min-h-11 rounded-lg border border-monolith-outline-variant bg-white px-3 text-sm">{Object.entries(applicationStatusLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select><button onClick={save} disabled={saving} className="min-h-11 rounded-lg bg-monolith-primary px-4 text-sm font-bold text-white disabled:opacity-60">{saving ? '저장 중' : '상태 저장'}</button>{message && <span className="text-xs text-monolith-on-surface-muted">{message}</span>}</div>;
}
