import SiteChrome from '@/components/SiteChrome';
import AttendanceLanding from '@/components/AttendanceLanding';
import { getActiveEvent, getEventCategories, getEvents } from '@/lib/supabase-attendance';

export const dynamic = 'force-dynamic';

export default async function AttendancePage() {
  const [events, activeEvent, categories] = await Promise.all([
    getEvents().catch(() => []),
    getActiveEvent().catch(() => null),
    getEventCategories().catch(() => ({})),
  ]);

  return (
    <SiteChrome activePath="/attendance">
      <AttendanceLanding events={events} activeEvent={activeEvent} categories={categories} />
    </SiteChrome>
  );
}
