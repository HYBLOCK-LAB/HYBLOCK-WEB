'use client';

import { useMemo, useState } from 'react';
import { ACTIVITY_TYPE_OPTIONS, getActivityTypeLabel, type ActivityItem } from '@/lib/supabase-activities';

const FILTERS = ['전체', ...ACTIVITY_TYPE_OPTIONS.map((option) => option.label)] as const;

export default function ActivitiesGallery({ activities }: { activities: ActivityItem[] }) {
  const [selectedFilter, setSelectedFilter] = useState<(typeof FILTERS)[number]>('전체');

  const visibleActivities = useMemo(() => {
    if (selectedFilter === '전체') return activities;
    return activities.filter((activity) => getActivityTypeLabel(activity.sessionType) === selectedFilter);
  }, [activities, selectedFilter]);

  return (
    <>
      <div className="mb-12 flex flex-wrap gap-3">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setSelectedFilter(filter)}
            className={[
              'interactive-soft rounded-full px-6 py-2.5 text-sm font-medium transition',
              selectedFilter === filter
                ? 'bg-monolith-primaryContainer text-monolith-onPrimary'
                : 'bg-monolith-surfaceHigh text-monolith-onSurfaceMuted hover:bg-monolith-primaryFixed',
            ].join(' ')}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {visibleActivities.map((activity) => (
          <article
            key={activity.id}
            className="interactive-card group overflow-hidden rounded-xl border border-monolith-outlineVariant/20 bg-monolith-surfaceLowest shadow-ambient"
          >
            <div className="p-8">
              <div className="mb-4 flex items-center gap-2">
                <span className="rounded-full bg-monolith-secondaryContainer px-3 py-1 font-display text-[10px] font-bold uppercase tracking-[0.18em] text-monolith-onSecondaryContainer">
                  {getActivityTypeLabel(activity.sessionType)}
                </span>
                <span className="font-display text-xs text-monolith-onSurfaceMuted">
                  {new Date(activity.date).toLocaleDateString('ko-KR')}
                </span>
              </div>
              <h3 className="mb-3 text-xl font-bold leading-tight text-monolith-primaryContainer">{activity.name}</h3>
              <p className="mb-6 line-clamp-3 text-sm font-medium text-monolith-onSurfaceMuted">
                {activity.description?.trim() || '설명이 없습니다.'}
              </p>
            </div>
          </article>
        ))}
      </div>

      {visibleActivities.length === 0 ? (
        <div className="rounded-2xl border border-monolith-outlineVariant/20 bg-monolith-surfaceLowest px-6 py-10 text-center text-sm text-monolith-onSurfaceMuted">
          등록된 활동이 없습니다.
        </div>
      ) : null}
    </>
  );
}
