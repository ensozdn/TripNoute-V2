/**
 * GalleryTab Component
 * 
 * Photo gallery grid with hover effects.
 * Single Responsibility: Only renders photo gallery view.
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { GalleryPhoto } from '@/types/journey';

interface GalleryTabProps {
  photos: GalleryPhoto[];
}

export default function GalleryTab({ photos }: GalleryTabProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const handlePrevious = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => (prev! > 0 ? prev! - 1 : photos.length - 1));
  };

  const handleNext = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => (prev! < photos.length - 1 ? prev! + 1 : 0));
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent) => {
    if (lightboxIndex === null) return;
    if (e.key === 'Escape') setLightboxIndex(null);
    if (e.key === 'ArrowLeft') handlePrevious();
    if (e.key === 'ArrowRight') handleNext();
  };

  // Add keyboard listener when lightbox is open
  useEffect(() => {
    if (lightboxIndex === null) return;
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex]);

  if (photos.length === 0) {
    return (
      <motion.div
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -20, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col items-center justify-center py-12 px-4"
      >
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
          <span className="text-3xl">🖼️</span>
        </div>
        <p className="text-slate-400 text-center">
          No photos yet. Add photos to your places!
        </p>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -20, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="px-4 pb-4 overflow-y-auto"
      >
        {/* Square Grid */}
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo, index) => (
            <motion.button
              key={photo.id || `gallery-photo-${index}`}
              onClick={() => setLightboxIndex(index)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="relative aspect-square rounded-xl overflow-hidden bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Image
                src={photo.thumbnailUrl || photo.url}
                alt={photo.placeTitle || 'Travel photo'}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 33vw, 20vw"
              />
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors" />
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={() => setLightboxIndex(null)}
          >
            {/* Close Button */}
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-lg transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Counter */}
            <div className="absolute top-4 left-4 px-4 py-2 bg-white/10 rounded-lg text-white text-sm z-10">
              {lightboxIndex + 1} / {photos.length}
            </div>

            {/* Navigation Buttons */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); handlePrevious(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white hover:bg-white/10 rounded-full transition-colors z-10"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleNext(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white hover:bg-white/10 rounded-full transition-colors z-10"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}

            {/* Image */}
            <motion.div
              key={lightboxIndex}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative w-full h-full max-w-4xl max-h-[80vh] m-8"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={photos[lightboxIndex].url}
                alt={photos[lightboxIndex].placeTitle || 'Travel photo'}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </motion.div>

            {/* Place Title */}
            {photos[lightboxIndex].placeTitle && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 rounded-lg text-white text-sm z-10">
                📍 {photos[lightboxIndex].placeTitle}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
