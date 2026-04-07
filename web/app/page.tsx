import SiteChrome from '@/components/SiteChrome';
import AttendanceLanding from '@/components/AttendanceLanding';
import HomeContent from '@/components/HomeContent';
import { getActiveEvents, getAdminMembers, getAttendanceSessions } from '@/lib/supabase-attendance';

export const dynamic = 'force-dynamic';

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = (await searchParams) ?? {};
  const hasEventParam = typeof params.event === 'string' && params.event.length > 0;

  // Fetch data on the server
  const [sessions, activeEvents, members] = await Promise.all([
    getAttendanceSessions(),
    getActiveEvents().catch(() => []),
    getAdminMembers().catch(() => []),
  ]);

  if (hasEventParam) {
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

  return (
    <SiteChrome activePath="/">
      <HomeContent />
    </SiteChrome>
  );
}
