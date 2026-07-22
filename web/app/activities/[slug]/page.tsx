import { notFound } from 'next/navigation';
import ActivityAlbumDetail from '@/components/activities/ActivityAlbumDetail';
import { activityAlbums, getActivityAlbumBySlug } from '@/lib/site-content';

type ActivityAlbumPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return activityAlbums.map((album) => ({ slug: album.slug }));
}

export default async function ActivityAlbumPage({ params }: ActivityAlbumPageProps) {
  const { slug } = await params;
  const album = getActivityAlbumBySlug(slug);

  if (!album) {
    notFound();
  }

  return <ActivityAlbumDetail album={album} />;
}
