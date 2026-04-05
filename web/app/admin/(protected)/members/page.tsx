import AdminSectionShell from '@/components/admin/AdminSectionShell';
import { getAdminMembers } from '@/lib/supabase-attendance';

export const dynamic = 'force-dynamic';

export default async function AdminMembersPage() {
  const members = await getAdminMembers().catch(() => []);

  return (
    <AdminSectionShell currentPath="/admin/members" title="멤버 관리" description="학회원 목록과 활성 상태를 확인하는 화면입니다.">
      <div className="overflow-hidden rounded-2xl border border-monolith-outlineVariant/20">
        <table className="min-w-full divide-y divide-monolith-outlineVariant/20 bg-monolith-surfaceLowest text-sm">
          <thead className="bg-monolith-surfaceLow text-left text-monolith-onSurfaceMuted">
            <tr>
              <th className="px-5 py-4 font-semibold">이름</th>
              <th className="px-5 py-4 font-semibold">기수</th>
              <th className="px-5 py-4 font-semibold">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-monolith-outlineVariant/15">
            {members.map((member) => (
              <tr key={member.id}>
                <td className="px-5 py-4 font-semibold text-monolith-onSurface">{member.name}</td>
                <td className="px-5 py-4 text-monolith-onSurfaceMuted">{member.cohort}기</td>
                <td className="px-5 py-4">
                  <span
                    className={[
                      'rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em]',
                      member.isActive
                        ? 'bg-monolith-primaryFixed text-monolith-primary'
                        : 'bg-monolith-surfaceLow text-monolith-onSurfaceMuted',
                    ].join(' ')}
                  >
                    {member.isActive ? 'active' : 'inactive'}
                  </span>
                </td>
              </tr>
            ))}
            {members.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-5 py-8 text-center text-monolith-onSurfaceMuted">
                  불러온 멤버 데이터가 없습니다.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </AdminSectionShell>
  );
}
