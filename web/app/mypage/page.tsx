import SiteChrome from '@/components/SiteChrome';
import MyPageOverview from '@/components/MyPageOverview';
import { getActiveEvents } from '@/lib/supabase-attendance';

export const dynamic = 'force-dynamic';

export default async function MyPage() {
  const activeEvents = await getActiveEvents().catch(() => []);

  return (
    <SiteChrome activePath="/mypage">
      <MyPageOverview initialActiveEvents={activeEvents} />
    </SiteChrome>
  );
}
