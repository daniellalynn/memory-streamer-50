import { memo } from "react";

interface Photo {
  id: string;
  url: string;
  title: string;
  originalDate: string;
  modifiedDate?: string;
}

interface PhotoCardProps {
  photo: Photo;
}

export const PhotoCard = memo(({ photo }: PhotoCardProps) => {
  return (
    <figure className="photo-card photo-shadow group">
      <img
        src={photo.url}
        alt={photo.title}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      <figcaption className="absolute inset-x-0 bottom-0 p-3 flex items-center justify-between text-sm">
        <span className="px-2 py-1 rounded-md bg-background/60 backdrop-blur-sm">
          {photo.title}
        </span>
        <span className="px-2 py-1 rounded-md bg-background/60 backdrop-blur-sm">
          {(photo.modifiedDate || photo.originalDate) && new Date(photo.modifiedDate || photo.originalDate).toLocaleDateString()}
        </span>
      </figcaption>
    </figure>
  );
});
