import SiteChrome from '@/components/SiteChrome';
import AuthShell from '@/components/auth/AuthShell';
import SocialAuthSection from '@/components/auth/SocialAuthSection';
import EmailAuthForm from '@/components/auth/EmailAuthForm';
import AuthDivider from '@/components/auth/AuthDivider';

export default function SignupPage() {
  return (
    <SiteChrome activePath="/signup">
      <main className="min-h-screen">
        <AuthShell
          mode="signup"
          eyebrow="Signup"
          title="회원가입"
        >
          <SocialAuthSection mode="signup" />
          <AuthDivider />
          <EmailAuthForm />
        </AuthShell>
      </main>
    </SiteChrome>
  );
}
