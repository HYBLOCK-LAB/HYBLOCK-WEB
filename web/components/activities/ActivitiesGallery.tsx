import type { ActivityGalleryPhoto } from '@/lib/site-content';

export default function ActivitiesGallery({ photos }: { photos: ActivityGalleryPhoto[] }) {
  if (photos.length === 0) {
    return (
      <div className="rounded-[28px] border border-monolith-outlineVariant/20 bg-monolith-surfaceLowest px-6 py-12 text-center text-sm text-monolith-onSurfaceMuted">
        표시할 사진이 없습니다.
      </div>
    );
  }

  return (
    <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4">
      {photos.map((photo) => (
        <figure
          key={photo.id}
          className="interactive-card group mb-5 break-inside-avoid overflow-hidden rounded-[24px] bg-monolith-surfaceLowest shadow-ambient"
        >
          <img
            src={photo.src}
            alt={photo.alt}
            width={1200}
            height={photo.height}
            loading="lazy"
            className="block w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        </figure>
      ))}
    </div>
  );
}
