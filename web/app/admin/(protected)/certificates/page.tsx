import AdminSectionShell from '@/components/admin/AdminSectionShell';
import CertificateManager from '@/components/admin/CertificateManager';

export const dynamic = 'force-dynamic';

export default function AdminCertificatesPage() {
  return (
    <AdminSectionShell
      currentPath="/admin/certificates"
      title="증명 관리"
      description="수료 조건을 달성한 멤버에게 EAS(Ethereum Attestation Service)를 통해 유형별 증명서를 발급하는 화면입니다."
    >
      <CertificateManager />
    </AdminSectionShell>
  );
}
