import AdminSectionShell from '@/components/admin/AdminSectionShell';
import AdminAttendanceManager from '@/components/admin/AdminAttendanceManager';

export const dynamic = 'force-dynamic';

export default function AdminAttendancePage() {
  return (
    <AdminSectionShell currentPath="/admin/attendance" title="출석 관리" description="세션 관리, 활성화, 마감, QR 생성하는 화면입니다.">
      <AdminAttendanceManager />
    </AdminSectionShell>
  );
}
