import SiteChrome from '@/components/SiteChrome';
import ActivitiesGallery from '@/components/activities/ActivitiesGallery';
import { getActivities } from '@/lib/supabase-activities';
import { textContent } from '@/lib/text-content';

export const dynamic = 'force-dynamic';

export default async function ActivitiesPage() {
  const activities = await getActivities().catch(() => []);

  return (
    <SiteChrome activePath="/activities">
      <main className="mx-auto max-w-7xl px-6 pb-20 pt-12 sm:pb-24 sm:pt-16 lg:px-8">
        <div className="mb-16 pt-6">
          <span className="mb-4 block font-display text-xs font-bold uppercase tracking-[0.22em] text-monolith-primaryContainer">
            Archive
          </span>
          <h1 className="text-5xl font-bold leading-none tracking-[-0.06em] text-monolith-primaryContainer md:text-7xl">
            Activity Gallery
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-monolith-onSurfaceMuted">
            {textContent.activities.intro}
          </p>
        </div>

        <ActivitiesGallery activities={activities} />
      </main>
    </SiteChrome>
  );
}
