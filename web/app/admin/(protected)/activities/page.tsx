import AdminSectionShell from '@/components/admin/AdminSectionShell';
import { activities } from '@/lib/site-content';
import { getAdminExternalActivities } from '@/lib/supabase-attendance';

export const dynamic = 'force-dynamic';

export default async function AdminActivitiesPage() {
  const externalActivities = await getAdminExternalActivities().catch(() => []);

  return (
    <AdminSectionShell currentPath="/admin/activities" title="활동 관리" description="웹사이트 활동 콘텐츠와 외부 활동 증빙 기록을 검토하는 화면입니다.">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <section>
          <h2 className="text-xl font-black tracking-tight text-monolith-primary">사이트 활동 콘텐츠</h2>
          <div className="mt-4 space-y-4">
            {activities.map((activity) => (
              <div key={activity.slug} className="rounded-2xl border border-monolith-outlineVariant/20 bg-monolith-surfaceLow p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-monolith-primaryContainer">{activity.category}</p>
                    <h3 className="mt-2 text-lg font-black tracking-tight text-monolith-onSurface">{activity.title}</h3>
                    <p className="mt-2 text-sm text-monolith-onSurfaceMuted">{activity.description}</p>
                  </div>
                  <span className="text-xs font-semibold text-monolith-onSurfaceMuted">{activity.date}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-black tracking-tight text-monolith-primary">외부 활동 기록</h2>
          <div className="mt-4 space-y-4">
            {externalActivities.map((activity) => (
              <div key={activity.activityId} className="rounded-2xl border border-monolith-outlineVariant/20 bg-monolith-surfaceLow p-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-monolith-primaryContainer">{activity.sessionName ?? '세션 미지정'}</p>
                <p className="mt-2 break-all text-sm font-semibold text-monolith-onSurface">{activity.walletAddress}</p>
                <a
                  href={activity.evidenceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex text-sm font-semibold text-monolith-primaryContainer"
                >
                  증빙 링크 열기
                </a>
              </div>
            ))}
            {externalActivities.length === 0 ? (
              <div className="rounded-2xl border border-monolith-outlineVariant/20 bg-monolith-surfaceLow p-5 text-sm text-monolith-onSurfaceMuted">
                외부 활동 기록이 없습니다.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </AdminSectionShell>
  );
}
