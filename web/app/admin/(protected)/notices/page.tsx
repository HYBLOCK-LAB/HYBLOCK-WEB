import AdminSectionShell from '@/components/admin/AdminSectionShell';
import AdminNoticesManager from '@/components/admin/AdminNoticesManager';
import { getAllNotices } from '@/lib/supabase-notices';

export const dynamic = 'force-dynamic';

export default async function AdminNoticesPage() {
  const notices = await getAllNotices().catch(() => []);

  return (
    <AdminSectionShell currentPath="/admin/notices" title="공지 관리" description="공지사항을 등록하고 수정하거나 삭제하는 관리자 화면입니다.">
      <AdminNoticesManager initialNotices={notices} />
    </AdminSectionShell>
  );
}
