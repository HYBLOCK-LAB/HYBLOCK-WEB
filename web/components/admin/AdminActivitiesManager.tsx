'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CalendarDays, LoaderCircle, X } from 'lucide-react';
import {
  ACTIVITY_TYPE_OPTIONS,
  getActivityTypeLabel,
  type ActivityItem,
  type ActivitySessionType,
} from '@/lib/supabase-activities';

type ActivitiesResponse = {
  activities: ActivityItem[];
};

export default function AdminActivitiesManager({ initialActivities }: { initialActivities: ActivityItem[] }) {
  const [activities, setActivities] = useState(initialActivities);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sessionType, setSessionType] = useState<ActivitySessionType>('basic');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setActivities(initialActivities);
  }, [initialActivities]);

  const resetForm = () => {
    setEditingActivityId(null);
    setName('');
    setDescription('');
    setSessionType('basic');
    setDate(new Date().toISOString().slice(0, 16));
  };

  const openCreateModal = () => {
    setError(null);
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (activity: ActivityItem) => {
    setError(null);
    setEditingActivityId(activity.id);
    setName(activity.name);
    setDescription(activity.description ?? '');
    setSessionType(activity.sessionType);
    setDate(activity.date.slice(0, 16));
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/activities', {
        method: editingActivityId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingActivityId,
          name,
          description,
          sessionType,
          date: new Date(date).toISOString(),
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        activity?: ActivityItem;
      };

      if (!response.ok || !payload.activity) {
        throw new Error(payload.error ?? (editingActivityId ? '활동 수정에 실패했습니다.' : '활동 추가에 실패했습니다.'));
      }

      setActivities((current) =>
        editingActivityId
          ? current.map((activity) => (activity.id === payload.activity!.id ? payload.activity! : activity))
          : [payload.activity!, ...current],
      );
      setError(null);
      setIsModalOpen(false);
      resetForm();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : editingActivityId ? '활동 수정 중 오류가 발생했습니다.' : '활동 추가 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (activityId: string) => {
    if (!window.confirm('이 활동을 삭제하시겠습니까?')) {
      return;
    }

    setDeletingId(activityId);
    setError(null);

    try {
      const response = await fetch(`/api/activities?id=${encodeURIComponent(activityId)}`, {
        method: 'DELETE',
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? '활동 삭제에 실패했습니다.');
      }

      setActivities((current) => current.filter((activity) => activity.id !== activityId));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : '활동 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <section>
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-monolith-primaryContainer">등록된 활동</p>
          <button
            type="button"
            onClick={openCreateModal}
            className="interactive-soft inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-monolith-outlineVariant/25 bg-monolith-surfaceLow text-monolith-primaryContainer shadow-[0_14px_34px_rgba(0,51,97,0.08)] transition hover:border-monolith-primaryContainer/40 hover:text-monolith-primary"
            aria-label="새 활동 추가"
            title="새 활동 추가"
          >
            <i className="fa-solid fa-plus text-[16px]" aria-hidden="true" />
          </button>
        </div>
        <div className="mt-4 space-y-4">
          {activities.map((activity) => (
            <article key={activity.id} className="rounded-2xl border border-monolith-outlineVariant/20 bg-monolith-surfaceLow p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-monolith-primaryContainer">
                    {getActivityTypeLabel(activity.sessionType)}
                  </p>
                  <h3 className="mt-2 text-lg font-black tracking-tight text-monolith-onSurface">{activity.name}</h3>
                  <p className="mt-2 text-sm leading-7 text-monolith-onSurfaceMuted">
                    {activity.description?.trim() || '설명이 없습니다.'}
                  </p>
                </div>
                <div className="shrink-0 rounded-xl bg-monolith-surfaceLowest px-3 py-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(activity)}
                      className="interactive-soft inline-flex h-9 w-9 items-center justify-center rounded-xl border border-monolith-outlineVariant/25 bg-monolith-surface text-monolith-onSurfaceMuted transition hover:border-monolith-primaryContainer/30 hover:bg-monolith-surfaceLow hover:text-monolith-primary"
                      aria-label={`${activity.name} 수정`}
                      title="수정"
                    >
                      <i className="fa-regular fa-pen-to-square text-[13px]" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(activity.id)}
                      disabled={deletingId === activity.id}
                      className="interactive-soft inline-flex h-9 w-9 items-center justify-center rounded-xl border border-monolith-outlineVariant/25 bg-monolith-surface text-monolith-onSurfaceMuted transition hover:border-monolith-error/30 hover:bg-monolith-errorContainer hover:text-monolith-error disabled:opacity-60"
                      aria-label={`${activity.name} 삭제`}
                      title="삭제"
                    >
                      {deletingId === activity.id ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <i className="fa-solid fa-trash text-[12px]" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-monolith-onSurfaceMuted">
                    <CalendarDays className="h-3.5 w-3.5" />
                    <span>{new Date(activity.date).toLocaleString('ko-KR')}</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
          {activities.length === 0 ? (
            <div className="rounded-2xl border border-monolith-outlineVariant/20 bg-monolith-surfaceLow p-5 text-sm text-monolith-onSurfaceMuted">
              등록된 활동이 없습니다.
            </div>
          ) : null}
        </div>
      </section>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(73,139,196,0.22),transparent_42%),linear-gradient(180deg,rgba(0,23,45,0.68),rgba(0,23,45,0.5))] px-4 py-8 backdrop-blur-[6px]">
          <div className="absolute inset-0 bg-monolith-grid opacity-[0.08]" aria-hidden="true" />
          <div className="flex min-h-full items-center justify-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-activity-modal-title"
            className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/45 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(242,247,252,0.94))] p-6 shadow-[0_28px_90px_rgba(0,24,46,0.28)]"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(120,180,227,0.28),transparent_70%)]" aria-hidden="true" />
            <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-white/80" aria-hidden="true" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-monolith-primaryContainer">
                  {editingActivityId ? '활동 수정' : '새 활동 추가'}
                </p>
                <h2 id="create-activity-modal-title" className="mt-2 text-2xl font-black tracking-tight text-monolith-onSurface">
                  {editingActivityId ? '활동 정보를 수정하세요' : '활동 정보를 입력하세요'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="interactive-soft inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-monolith-outlineVariant/25 bg-monolith-surfaceLowest text-monolith-onSurfaceMuted transition hover:border-monolith-outlineVariant/40 hover:text-monolith-onSurface"
                aria-label="닫기"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-monolith-onSurface">세션 타입</span>
                <select
                  value={sessionType}
                  onChange={(event) => setSessionType(event.target.value as ActivitySessionType)}
                  className="w-full rounded-xl border border-monolith-outlineVariant/30 bg-monolith-surfaceLow px-4 py-3 text-sm outline-none transition focus:border-monolith-primaryContainer"
                >
                  {ACTIVITY_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-monolith-onSurface">이름</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-xl border border-monolith-outlineVariant/30 bg-monolith-surfaceLow px-4 py-3 text-sm outline-none transition focus:border-monolith-primaryContainer"
                  placeholder="활동 이름"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-monolith-onSurface">설명</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="min-h-28 w-full rounded-xl border border-monolith-outlineVariant/30 bg-monolith-surfaceLow px-4 py-3 text-sm outline-none transition focus:border-monolith-primaryContainer"
                  placeholder="활동 설명"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-monolith-onSurface">날짜</span>
                <input
                  type="datetime-local"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="w-full rounded-xl border border-monolith-outlineVariant/30 bg-monolith-surfaceLow px-4 py-3 text-sm outline-none transition focus:border-monolith-primaryContainer"
                  required
                />
              </label>

              {error ? (
                <div className="flex items-start gap-2 rounded-2xl bg-monolith-errorContainer px-4 py-4 text-sm text-monolith-error">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="interactive-soft rounded-xl border border-monolith-outlineVariant/30 bg-monolith-surfaceLow px-5 py-3 text-sm font-semibold text-monolith-onSurface transition hover:border-monolith-outlineVariant/50"
                >
                  닫기
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="interactive-soft flex items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#0e4a84,#003361)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(0,51,97,0.18)] transition-all hover:brightness-105 disabled:opacity-60"
                >
                  {loading ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : editingActivityId ? (
                    <i className="fa-regular fa-pen-to-square text-[14px]" aria-hidden="true" />
                  ) : (
                    <i className="fa-solid fa-plus text-[14px]" aria-hidden="true" />
                  )}
                  {editingActivityId ? '활동 수정' : '활동 추가'}
                </button>
              </div>
            </form>
          </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
