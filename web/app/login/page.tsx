import SiteChrome from '@/components/SiteChrome';
import PageUnderConstruction from '@/components/PageUnderConstruction';
import AuthShell from '@/components/auth/AuthShell';
import WalletLoginSection from '@/components/auth/WalletLoginSection';

export const metadata = {
  title: '페이지 작업중 | HYBLOCK',
  robots: {
    index: false,
    follow: false,
  },
};

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const rawRedirect = typeof params.redirect === 'string' ? params.redirect : '';
  const isAdminLogin = rawRedirect === '/admin' || rawRedirect.startsWith('/admin/');

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
            <WalletLoginSection redirectTo={rawRedirect} adminOnly />
          </AuthShell>
        </main>
      </SiteChrome>
    );
  }

  return (
    <SiteChrome activePath="/login">
      <PageUnderConstruction
        eyebrow="Login · Temporarily Closed"
        description="로그인과 회원 연결 과정을 점검하고 있습니다. 작업이 끝날 때까지 로그인 기능과 관련 입력 화면은 임시로 사용할 수 없습니다."
      />
    </SiteChrome>
  );
}
