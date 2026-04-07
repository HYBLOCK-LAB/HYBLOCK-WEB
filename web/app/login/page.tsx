import SiteChrome from '@/components/SiteChrome';
import AuthShell from '@/components/auth/AuthShell';
import SocialAuthSection from '@/components/auth/SocialAuthSection';
import WalletLoginSection from '@/components/auth/WalletLoginSection';
import AuthDivider from '@/components/auth/AuthDivider';

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const rawRedirect = typeof params.redirect === 'string' ? params.redirect : '/';
  const redirectTo = rawRedirect.startsWith('/') ? rawRedirect : '/';

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
