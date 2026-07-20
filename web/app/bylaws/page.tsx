import SiteChrome from '@/components/SiteChrome';
import PageUnderConstruction from '@/components/PageUnderConstruction';

export const metadata = {
  title: '페이지 작업중 | HYBLOCK',
  robots: {
    index: false,
    follow: false,
  },
};

export default function BylawsPage() {
  return (
    <SiteChrome activePath="/bylaws">
      <PageUnderConstruction
        eyebrow="Bylaws · Temporarily Closed"
        description="회칙 내용을 더 정확하고 읽기 편하게 정리하고 있습니다. 작업이 끝날 때까지 이 페이지의 기존 내용은 임시로 공개하지 않습니다."
      />
    </SiteChrome>
  );
}
