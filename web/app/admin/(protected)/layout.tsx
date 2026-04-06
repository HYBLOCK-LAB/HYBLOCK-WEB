import SiteChrome from '@/components/SiteChrome';
import { requireAdminPageAccess } from '@/lib/admin-auth';

type ProtectedAdminLayoutProps = {
  children: React.ReactNode;
};

export default async function ProtectedAdminLayout({ children }: ProtectedAdminLayoutProps) {
  await requireAdminPageAccess('/admin');

  return (
    <SiteChrome activePath="/admin">
      <main>{children}</main>
    </SiteChrome>
  );
}
