import SiteChrome from '@/components/SiteChrome';
import PageUnderConstruction from '@/components/PageUnderConstruction';

export const metadata = {
  title: '페이지 작업중 | HYBLOCK',
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginPage() {
  return (
    <SiteChrome activePath="/login">
      <PageUnderConstruction
        eyebrow="Login · Temporarily Closed"
        description="로그인과 회원 연결 과정을 점검하고 있습니다. 작업이 끝날 때까지 로그인 기능과 관련 입력 화면은 임시로 사용할 수 없습니다."
      />
    </SiteChrome>
  );
}
