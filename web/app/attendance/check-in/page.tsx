import SiteChrome from '@/components/SiteChrome';
import AttendanceAccessGate from '@/components/AttendanceAccessGate';
import AttendanceSelfCheckIn from '@/components/attendance/AttendanceSelfCheckIn';
import { getWalletSessionMember } from '@/lib/wallet-session';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: '세션 출석 체크인 | HYBLOCK',
  robots: {
    index: false,
    follow: false,
  },
};

type CheckInPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AttendanceCheckInPage({ searchParams }: CheckInPageProps) {
  const params = (await searchParams) ?? {};
  const encodedEvent = typeof params.e === 'string' ? params.e : '';
  const walletMember = await getWalletSessionMember().catch(() => null);
  const returnPath = `/attendance/check-in?e=${encodeURIComponent(encodedEvent)}`;

  return (
    <SiteChrome activePath="/attendance">
      <AttendanceAccessGate hasWalletSession={Boolean(walletMember)} returnPath={returnPath}>
        <AttendanceSelfCheckIn encodedEvent={encodedEvent} />
      </AttendanceAccessGate>
    </SiteChrome>
  );
}
