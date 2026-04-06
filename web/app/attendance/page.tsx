import SiteChrome from '@/components/SiteChrome';
import AttendanceLanding from '@/components/AttendanceLanding';
import { getActiveEvents, getAdminMembers, getAttendanceSessions } from '@/lib/supabase-attendance';

export const dynamic = 'force-dynamic';

export default async function AttendancePage() {
  const [sessions, activeEvents, members] = await Promise.all([
    getAttendanceSessions(),
    getActiveEvents().catch(() => []),
    getAdminMembers().catch(() => []),
  ]);

  return (
    <SiteChrome activePath="/attendance">
      <AttendanceLanding
        sessions={sessions}
        activeEvents={activeEvents}
        members={members.filter((member) => member.isActive).map((member) => member.name)}
      />
    </SiteChrome>
  );
}
