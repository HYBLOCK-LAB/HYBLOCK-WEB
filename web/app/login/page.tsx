import SiteChrome from '@/components/SiteChrome';
import AuthShell from '@/components/auth/AuthShell';
import SocialAuthSection from '@/components/auth/SocialAuthSection';
import WalletLoginSection from '@/components/auth/WalletLoginSection';
import AuthDivider from '@/components/auth/AuthDivider';

export const metadata = {
  title: '로그인 | HYBLOCK',
};

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const rawRedirect = typeof params.redirect === 'string' ? params.redirect : '/';
  const redirectTo = rawRedirect.startsWith('/') ? rawRedirect : '/';
  const isAdminLogin = redirectTo === '/admin' || redirectTo.startsWith('/admin/');

  if (isAdminLogin) {
    return (
      <SiteChrome activePath="/login">
        <main className="min-h-screen">
          <AuthShell
            mode="login"
            eyebrow="HYBLOCK · Admin"
            title="관리자 로그인"
            description="관리자 권한이 등록된 지갑으로 서명해 주세요."
          >
            <WalletLoginSection redirectTo={redirectTo} adminOnly />
          </AuthShell>
        </main>
      </SiteChrome>
    );
  }

  return (
    <SiteChrome activePath="/login">
      <main className="min-h-screen">
        <AuthShell
          mode="login"
          eyebrow="Continue with Your wallet or Google"
          title="Login"
        >
          <SocialAuthSection mode="login" redirectPath={redirectTo} />
          <AuthDivider />
          <WalletLoginSection redirectTo={redirectTo} />
        </AuthShell>
      </main>
    </SiteChrome>
  );
}
