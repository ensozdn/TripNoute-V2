'use client';

import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Image as ImageIcon } from 'lucide-react';
import { Photo } from '@/types/models/Photo';
import { PhotoCard } from './PhotoCard';
import { cn } from '@/lib/utils';

interface PhotoGalleryProps {
  photos: Photo[];
  onDelete?: (photo: Photo) => void;
  onUpdateDescription?: (photoId: string, description: string) => void;
  disabled?: boolean;
  columns?: 2 | 3 | 4;
  className?: string;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  photos,
  onDelete,
  onUpdateDescription,
  disabled = false,
  columns = 3,
  className,
}) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const handlePrevious = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => (prev! > 0 ? prev! - 1 : photos.length - 1));
  };

  const handleNext = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => (prev! < photos.length - 1 ? prev! + 1 : 0));
  };

  const handleDownload = async () => {
    if (lightboxIndex === null) return;

    const photo = photos[lightboxIndex];
    try {
      const response = await fetch(photo.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = photo.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download photo:', error);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (lightboxIndex === null) return;

    if (e.key === 'Escape') {
      setLightboxIndex(null);
    } else if (e.key === 'ArrowLeft') {
      handlePrevious();
    } else if (e.key === 'ArrowRight') {
      handleNext();
    }
  };

  React.useEffect(() => {
    if (lightboxIndex !== null) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [lightboxIndex]);

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-slate-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No photos yet</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Upload photos to get started
          </p>
        </div>
      </div>
    );
  }

  // Defensive: filter out photos without valid URL or ID/storagePath
  const validPhotos = photos.filter(
    (photo) => (photo.url || photo.storagePath) && (photo.id || photo.storagePath)
  );

  return (
    <>
      {/* Gallery Grid */}
      <div
        className={cn(
          'grid gap-4',
          columns === 2 && 'grid-cols-1 sm:grid-cols-2',
          columns === 3 && 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
          columns === 4 && 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
          className
        )}
      >
        {validPhotos.map((photo, index) => (
          <PhotoCard
            key={photo.id || photo.storagePath || `photo-${index}`}
            photo={photo}
            onDelete={onDelete}
            onUpdateDescription={onUpdateDescription}
            onClick={() => {
              const foundIndex = validPhotos.findIndex(
                (p) => p.id === photo.id || p.storagePath === photo.storagePath
              );
              setLightboxIndex(foundIndex);
            }}
            disabled={disabled}
          />
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          {/* Close Button */}
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-lg transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="absolute top-4 right-16 p-2 text-white hover:bg-white/10 rounded-lg transition-colors z-10"
          >
            <Download className="w-6 h-6" />
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-4 px-4 py-2 bg-white/10 rounded-lg text-white text-sm z-10">
            {lightboxIndex + 1} / {photos.length}
          </div>

          {/* Previous Button */}
          {photos.length > 1 && (
            <button
              onClick={handlePrevious}
              className="absolute left-4 p-3 text-white hover:bg-white/10 rounded-lg transition-colors z-10"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

          {/* Next Button */}
          {photos.length > 1 && (
            <button
              onClick={handleNext}
              className="absolute right-4 p-3 text-white hover:bg-white/10 rounded-lg transition-colors z-10"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}

          {/* Image */}
          <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center">
            <img
              src={photos[lightboxIndex].url}
              alt={photos[lightboxIndex].description || 'Photo'}
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Description */}
            {photos[lightboxIndex].description && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white text-center">{photos[lightboxIndex].description}</p>
              </div>
            )}
          </div>

          {/* Background Close */}
          <div
            className="absolute inset-0 -z-10"
            onClick={() => setLightboxIndex(null)}
          />
        </div>
      )}
    </>
  );
};
