import SiteChrome from '@/components/SiteChrome';
import MyPageOverview from '@/components/MyPageOverview';

export default function MyPage() {
  return (
    <SiteChrome activePath="/mypage">
      <MyPageOverview />
    </SiteChrome>
  );
}
