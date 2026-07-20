import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Design Lab | HYBLOCK',
  description: 'HYBLOCK 디자인 시스템 검증용 내부 페이지',
  robots: {
    index: false,
    follow: false,
  },
};

export default function DesignLabLayout({ children }: { children: React.ReactNode }) {
  return children;
}
