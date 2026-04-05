'use client';

import SiteChrome from '@/components/SiteChrome';
import AdminAuthGuard from '@/components/admin/AdminAuthGuard';

type ProtectedAdminLayoutProps = {
  children: React.ReactNode;
};

export default function ProtectedAdminLayout({ children }: ProtectedAdminLayoutProps) {
  return (
    <SiteChrome activePath="/admin">
      <main>
        <AdminAuthGuard>{children}</AdminAuthGuard>
      </main>
    </SiteChrome>
  );
}
