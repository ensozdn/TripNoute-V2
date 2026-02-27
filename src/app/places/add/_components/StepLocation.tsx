'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Locate } from 'lucide-react';
import MapboxLocationPicker from '@/components/MapboxLocationPicker';
import PlaceSearchBar from '@/components/PlaceSearchBar';
import { getGooglePlacesService } from '@/services/maps';
import type { GooglePlaceResult } from '@/types/maps';

export interface SelectedLocation {
  lat: number;
  lng: number;
  address?: string;
}

interface StepLocationProps {
  selectedLocation: SelectedLocation | null;
  onLocationSelect: (loc: SelectedLocation) => void;
  onContinue: () => void;
}

export default function StepLocation({
  selectedLocation,
  onLocationSelect,
  onContinue,
}: StepLocationProps) {
  const [isLocating, setIsLocating] = useState(false);
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number } | null>(null);
  const googlePlaces = useRef(getGooglePlacesService());

  const handlePlaceSelect = (place: GooglePlaceResult) => {
    const loc = {
      lat: place.location.lat,
      lng: place.location.lng,
      address: place.formattedAddress,
    };
    onLocationSelect(loc);
    setFlyTarget({ lat: loc.lat, lng: loc.lng });
  };

  const handleLocateMe = async () => {
    if (!('geolocation' in navigator)) return;
    setIsLocating(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
      );
      const { latitude: lat, longitude: lng } = position.coords;
      try {
        const address = await googlePlaces.current.reverseGeocode(lat, lng);
        onLocationSelect({ lat, lng, address });
      } catch {
        onLocationSelect({ lat, lng });
      }
      setFlyTarget({ lat, lng });
    } catch {
      // silently fail
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <motion.div
      key="step-location"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      className="absolute inset-0 flex flex-col"
    >
      {/* Search bar row — sits directly below WizardProgress (~57px) */}
      <div className="absolute top-[57px] left-0 right-0 z-40 flex items-center gap-2 px-3 py-2 bg-slate-900/95 backdrop-blur-xl border-b border-white/8">
        <div className="flex-1">
          <PlaceSearchBar
            onPlaceSelect={handlePlaceSelect}
            placeholder="Search location..."
            className="w-full"
          />
        </div>
        <button
          onClick={handleLocateMe}
          disabled={isLocating}
          className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl bg-white/8 border border-white/12 text-white hover:bg-white/15 active:scale-95 transition-all disabled:opacity-40"
        >
          {isLocating ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Locate className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Map — starts below header + search bar (~57+50 = 107px) */}
      <div className="absolute top-[107px] left-0 right-0 bottom-0">
        <MapboxLocationPicker
          initialLocation={selectedLocation ?? undefined}
          onLocationSelect={onLocationSelect}
          flyToLocation={flyTarget}
          hideSearch
          hideLocate
          className="!rounded-none !border-0 !h-full !w-full"
        />
      </div>

      {/* Bottom CTA */}
      <div className="absolute bottom-0 left-0 right-0 z-40 px-4 pb-8 pt-16 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none">
        {selectedLocation && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-2.5 mx-auto max-w-xs flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
            <span className="text-xs text-white/65 truncate">
              {selectedLocation.address
                ? selectedLocation.address.split(',').slice(0, 2).join(', ')
                : `${selectedLocation.lat.toFixed(5)}, ${selectedLocation.lng.toFixed(5)}`}
            </span>
          </motion.div>
        )}

        <motion.button
          onClick={onContinue}
          disabled={!selectedLocation}
          whileTap={{ scale: 0.97 }}
          className="pointer-events-auto w-full py-3.5 rounded-2xl font-semibold text-base transition-all
            disabled:bg-white/10 disabled:text-white/30 disabled:cursor-not-allowed
            bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white shadow-2xl shadow-blue-500/40"
        >
          {selectedLocation ? 'Continue →' : 'Tap the map to select a location'}
        </motion.button>
      </div>
    </motion.div>
  );
}
