import AdminMembersManager from '@/components/admin/AdminMembersManager';
import AdminSectionShell from '@/components/admin/AdminSectionShell';
import { getAdminMembers } from '@/lib/supabase-attendance';

export const dynamic = 'force-dynamic';

export default async function AdminMembersPage() {
  const members = await getAdminMembers().catch(() => []);

  return (
    <AdminSectionShell currentPath="/admin/members" title="멤버 관리" description="학회원 목록과 활성 상태를 확인하는 화면입니다.">
      <AdminMembersManager initialMembers={members} />
    </AdminSectionShell>
  );
}
