import AdminSectionShell from '@/components/admin/AdminSectionShell';
import AdminAttendanceManager from '@/components/admin/AdminAttendanceManager';

export const dynamic = 'force-dynamic';

export default function AdminAttendancePage() {
  return (
    <AdminSectionShell currentPath="/admin/attendance" title="출석 관리" description="회원 출석을 개별·일괄 수정하고, 지각 기준 설정과 세션 활성화·마감·QR 표시를 관리합니다.">
      <AdminAttendanceManager />
    </AdminSectionShell>
  );
}
