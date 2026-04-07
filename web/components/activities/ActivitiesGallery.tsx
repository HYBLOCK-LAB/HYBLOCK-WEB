'use client';

import { useEffect, useState } from 'react';
import type { ActivityGalleryPhoto } from '@/lib/site-content';

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export default function ActivitiesGallery({ photos }: { photos: ActivityGalleryPhoto[] }) {
  const [displayPhotos, setDisplayPhotos] = useState<ActivityGalleryPhoto[]>([]);

  useEffect(() => {
    // Shuffle photos only on mount to avoid hydration mismatch
    setDisplayPhotos(shuffleArray(photos));
  }, [photos]);

  if (photos.length === 0) {
    return (
      <div className="rounded-[28px] border border-monolith-outlineVariant/20 bg-monolith-surfaceLowest px-6 py-12 text-center text-sm text-monolith-onSurfaceMuted">
        표시할 사진이 없습니다.
      </div>
    );
  }

  // Fallback to original order before mount/shuffle
  const currentPhotos = displayPhotos.length > 0 ? displayPhotos : photos;

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {currentPhotos.map((photo) => (
        <figure
          key={photo.id}
          className="interactive-card group overflow-hidden rounded-[24px] bg-monolith-surfaceLowest shadow-ambient"
        >
          <div className="aspect-[4/3] w-full overflow-hidden">
            <img
              src={photo.src}
              alt={photo.alt}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.05]"
            />
          </div>
        </figure>
      ))}
    </div>
  );
}
