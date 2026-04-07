import SiteChrome from '@/components/SiteChrome';
import AttendanceLanding from '@/components/AttendanceLanding';
import AttendanceAccessGate from '@/components/AttendanceAccessGate';
import { getActiveEvents, getAdminMembers, getAttendanceSessions } from '@/lib/supabase-attendance';
import { getWalletSessionMember } from '@/lib/wallet-session';

export const dynamic = 'force-dynamic';

export default async function AttendancePage() {
  const [sessions, activeEvents, members, walletMember] = await Promise.all([
    getAttendanceSessions(),
    getActiveEvents().catch(() => []),
    getAdminMembers().catch(() => []),
    getWalletSessionMember().catch(() => null),
  ]);

  return (
    <SiteChrome activePath="/attendance">
      <AttendanceAccessGate hasWalletSession={Boolean(walletMember)}>
        <AttendanceLanding
          sessions={sessions}
          activeEvents={activeEvents}
          members={members.filter((member) => member.isActive).map((member) => member.name)}
        />
      </AttendanceAccessGate>
    </SiteChrome>
  );
}
