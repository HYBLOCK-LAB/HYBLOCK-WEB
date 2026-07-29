import SiteChrome from '@/components/SiteChrome';
import PageUnderConstruction from '@/components/PageUnderConstruction';

export const metadata = {
  title: '지원 준비 중 | HYBLOCK',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ApplyPage() {
  return (
    <SiteChrome activePath="/apply">
      <PageUnderConstruction
        eyebrow="Application · Preparing"
        description="신입 회원 지원 일정과 접수 절차를 정리하고 있습니다. 모집 일정이 확정되면 이 페이지에서 안내하겠습니다."
      />
    </SiteChrome>
  );
}
