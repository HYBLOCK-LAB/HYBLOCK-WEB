import AdminSectionShell from '@/components/admin/AdminSectionShell';
import AdminActivitiesManager from '@/components/admin/AdminActivitiesManager';
import { getActivities } from '@/lib/supabase-activities';

export const dynamic = 'force-dynamic';

export default async function AdminActivitiesPage() {
  const activities = await getActivities().catch(() => []);

  return (
    <AdminSectionShell currentPath="/admin/activities" title="활동 관리" description="관리자 페이지에서 활동을 직접 등록하고, 공개 활동 페이지에 노출되는 목록을 관리합니다.">
      <AdminActivitiesManager initialActivities={activities} />
    </AdminSectionShell>
  );
}
