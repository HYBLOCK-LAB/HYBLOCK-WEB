import SiteChrome from '@/components/SiteChrome';
import AttendanceLanding from '@/components/AttendanceLanding';
import { getActiveEvent, getAdminMembers, getAttendanceSessions } from '@/lib/supabase-attendance';

export const dynamic = 'force-dynamic';

export default async function AttendancePage() {
  const [sessions, activeEvent, members] = await Promise.all([
    getAttendanceSessions(),
    getActiveEvent().catch(() => null),
    getAdminMembers().catch(() => []),
  ]);

  return (
    <SiteChrome activePath="/attendance">
      <AttendanceLanding
        sessions={sessions}
        activeEvent={activeEvent}
        members={members.filter((member) => member.isActive).map((member) => member.name)}
      />
    </SiteChrome>
  );
}
