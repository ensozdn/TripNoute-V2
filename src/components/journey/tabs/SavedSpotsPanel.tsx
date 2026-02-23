'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Bookmark } from 'lucide-react';
import Image from 'next/image';
import { Place, PlaceCategory } from '@/types';

interface SavedSpotsPanelProps {
  onBack: () => void;
  places: Place[];
}

const categoryLabel: Record<PlaceCategory, string> = {
  restaurant: 'Restaurant',
  hotel: 'Hotel',
  attraction: 'Attraction',
  museum: 'Museum',
  park: 'Park',
  beach: 'Beach',
  mountain: 'Mountain',
  city: 'City',
  landmark: 'Landmark',
  other: 'Other',
};

export default function SavedSpotsPanel({ onBack, places }: SavedSpotsPanelProps) {
  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 280 }}
      className="flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-1 py-3 border-b border-white/10 mb-5">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-white" strokeWidth={2} />
        </button>
        <p className="text-white font-semibold text-sm flex-1">Saved Spots & Activities</p>
        {places.length > 0 && (
          <span className="text-xs text-white/30 font-medium">{places.length}</span>
        )}
      </div>

      {places.length === 0 ? (
        /* Empty state */
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex flex-col items-center gap-6 py-8 px-4"
        >
          <p className="text-white font-semibold text-lg tracking-tight">Nothing saved yet...</p>

          {/* Ghost placeholder card */}
          <div className="w-full rounded-2xl border border-dashed border-white/15 bg-white/3 p-3 flex items-center gap-3 opacity-50">
            <div className="w-14 h-14 rounded-xl bg-white/10 shrink-0 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-white/20" strokeWidth={1.5} />
            </div>
            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 bg-white/10 rounded-full" />
              <div className="h-2.5 w-20 bg-white/10 rounded-full" />
            </div>
            <div className="w-8 h-8 rounded-full border-2 border-dashed border-white/15 flex items-center justify-center">
              <Bookmark className="w-3.5 h-3.5 text-white/20" strokeWidth={1.8} />
            </div>
          </div>

          {/* Dashed connector line */}
          <div className="flex flex-col items-center gap-1 -mt-2">
            <div className="w-px h-4 border-l border-dashed border-white/15" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/15" />
          </div>

          <p className="text-center text-white/30 text-sm leading-relaxed -mt-2">
            When you come across an interesting spot or activity,{' '}
            <br />
            you can save it and find it here!
          </p>
        </motion.div>
      ) : (
        /* Spots list */
        <div className="space-y-2">
          {places.map((place, index) => (
            <motion.div
              key={place.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.04 }}
              className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/8 transition-colors"
            >
              {/* Thumbnail */}
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-white/10 shrink-0 flex items-center justify-center">
                {place.photos?.[0]?.url ? (
                  <Image
                    src={place.photos[0].url}
                    alt={place.title}
                    width={56}
                    height={56}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <MapPin className="w-5 h-5 text-white/30" strokeWidth={1.5} />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">{place.title}</p>
                <p className="text-xs text-white/40 mt-0.5 uppercase tracking-wider">
                  {place.category ? categoryLabel[place.category] : 'Spot'}
                </p>
                {place.address?.city && (
                  <p className="text-xs text-white/25 mt-0.5 truncate">{place.address.city}</p>
                )}
              </div>

              {/* Bookmark icon */}
              <div className="w-8 h-8 rounded-xl bg-white/8 flex items-center justify-center shrink-0">
                <Bookmark className="w-3.5 h-3.5 text-white/40" strokeWidth={1.8} />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
