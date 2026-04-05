import SiteChrome from '@/components/SiteChrome';
import { activities, activityFilters } from '@/lib/site-content';

export default function ActivitiesPage() {
  return (
    <SiteChrome activePath="/activities">
      <main className="mx-auto max-w-7xl px-6 pb-20 pt-12 sm:pb-24 sm:pt-16 lg:px-8">
        <div className="mb-16 pt-6">
          <span className="mb-4 block font-display text-xs font-bold uppercase tracking-[0.22em] text-monolith-primaryContainer">
            Archive
          </span>
          <h1 className="text-5xl font-bold leading-none tracking-[-0.06em] text-monolith-primaryContainer md:text-7xl">
            Activity Gallery
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-monolith-onSurfaceMuted">
            블록체인 생태계의 혁신을 선도하는 HYBLOCK의 학술 세션, 프로젝트, 외부 활동 기록입니다.
          </p>
        </div>

        <div className="mb-12 flex flex-wrap gap-3">
          {activityFilters.map((filter, index) => (
            <button
              key={filter}
              className={[
                'interactive-soft rounded-full px-6 py-2.5 text-sm font-medium transition',
                index === 0
                  ? 'bg-monolith-primaryContainer text-monolith-onPrimary'
                  : 'bg-monolith-surfaceHigh text-monolith-onSurfaceMuted hover:bg-monolith-primaryFixed',
              ].join(' ')}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {activities.map((activity) => (
            <article
              key={activity.slug}
              className="interactive-card group overflow-hidden rounded-xl border border-monolith-outlineVariant/20 bg-monolith-surfaceLowest shadow-ambient"
            >
              <div className="aspect-[16/10] overflow-hidden">
                <img
                  src={activity.image}
                  alt={activity.title}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-8">
                <div className="mb-4 flex items-center gap-2">
                  <span className="rounded-full bg-monolith-secondaryContainer px-3 py-1 font-display text-[10px] font-bold uppercase tracking-[0.18em] text-monolith-onSecondaryContainer">
                    {activity.category}
                  </span>
                  <span className="font-display text-xs text-monolith-onSurfaceMuted">{activity.date}</span>
                </div>
                <h3 className="mb-3 text-xl font-bold leading-tight text-monolith-primaryContainer">{activity.title}</h3>
                <p className="mb-6 line-clamp-2 text-sm font-medium text-monolith-onSurfaceMuted">{activity.description}</p>
                <button className="interactive-soft rounded-full px-1 font-display text-sm font-bold text-monolith-primaryContainer">VIEW DETAILS</button>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-20 flex justify-center">
          <button className="interactive-soft rounded-lg border border-monolith-outlineVariant/30 px-8 py-3 font-display font-bold text-monolith-primary transition hover:bg-monolith-surfaceLow">
            LOAD MORE ACTIVITIES
          </button>
        </div>
      </main>
    </SiteChrome>
  );
}
