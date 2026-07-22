import AdminSectionShell from '@/components/admin/AdminSectionShell';
import RecruitmentSettings from '@/components/recruitment/RecruitmentSettings';
import { getActiveAdminMembers, getCampaigns } from '@/lib/recruitment-admin';

export const dynamic = 'force-dynamic';
export default async function RecruitmentSettingsPage() {
  const [campaigns, admins] = await Promise.all([getCampaigns(), getActiveAdminMembers()]);
  return <AdminSectionShell currentPath="/admin/recruitment/settings" title="모집 설정" description="모집 기수와 접수 기간, 지원서 및 면접 평가 문항을 설정합니다. 모집 시작 후 문항은 잠깁니다."><RecruitmentSettings initialCampaigns={campaigns} admins={admins}/></AdminSectionShell>;
}
