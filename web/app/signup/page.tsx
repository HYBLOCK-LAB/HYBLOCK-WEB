import SiteChrome from '@/components/SiteChrome';
import AuthShell from '@/components/auth/AuthShell';
import WalletMemberSignupForm from '@/components/auth/WalletMemberSignupForm';

type SignupPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = (await searchParams) ?? {};
  const rawRedirect = typeof params.redirect === 'string' ? params.redirect : '/';
  const redirectTo = rawRedirect.startsWith('/') ? rawRedirect : '/';

  return (
    <SiteChrome activePath="/signup">
      <main className="min-h-screen">
        <AuthShell
          mode="signup"
          eyebrow="Member Signup"
          title="회원가입"
          description="지갑 주소에 연결된 HYBLOCK 회원 정보를 생성합니다. 기수는 기본적으로 9기(2026학년도 1학기)를 기준으로 안내합니다."
        >
          <WalletMemberSignupForm redirectTo={redirectTo} />
        </AuthShell>
      </main>
    </SiteChrome>
  );
}
