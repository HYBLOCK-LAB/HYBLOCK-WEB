import SiteChrome from '@/components/SiteChrome';
import AuthShell from '@/components/auth/AuthShell';
import SocialAuthSection from '@/components/auth/SocialAuthSection';
import WalletLoginSection from '@/components/auth/WalletLoginSection';
import AuthDivider from '@/components/auth/AuthDivider';

export default function LoginPage() {
  return (
    <SiteChrome activePath="/login">
      <main className="min-h-screen">
        <AuthShell
          mode="login"
          eyebrow="Continue with Your wallet or Google"
          title="Login"
        >
          <SocialAuthSection mode="login" />
          <AuthDivider />
          <WalletLoginSection />
        </AuthShell>
      </main>
    </SiteChrome>
  );
}
