'use client';

import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Locate, MapPin, Search } from 'lucide-react';
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
  const [searchOpen, setSearchOpen] = useState(false);
  const googlePlaces = useRef(getGooglePlacesService());

  const handlePlaceSelect = (place: GooglePlaceResult) => {
    const loc = {
      lat: place.location.lat,
      lng: place.location.lng,
      address: place.formattedAddress,
    };
    onLocationSelect(loc);
    setFlyTarget({ lat: loc.lat, lng: loc.lng });
    setSearchOpen(false);
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

  // Header height is ~88px (new premium header)
  const HEADER_H = 88;

  return (
    <motion.div
      key="step-location"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="absolute inset-0 flex flex-col"
    >
      {/* ── Full-screen map ── */}
      <div
        className="absolute left-0 right-0 bottom-0"
        style={{ top: HEADER_H }}
      >
        <MapboxLocationPicker
          initialLocation={selectedLocation ?? undefined}
          onLocationSelect={onLocationSelect}
          flyToLocation={flyTarget}
          hideSearch
          hideLocate
          className="!rounded-none !border-0 !h-full !w-full"
        />
      </div>

      {/* ── Top-right floating action buttons ── */}
      <div
        className="absolute right-4 z-50 flex flex-col gap-2"
        style={{ top: HEADER_H + 12 }}
      >
        {/* Search toggle */}
        <motion.button
          onClick={() => setSearchOpen(v => !v)}
          whileTap={{ scale: 0.90 }}
          className="w-11 h-11 flex items-center justify-center rounded-2xl bg-black/50 backdrop-blur-xl border border-white/15 text-white shadow-xl hover:bg-black/70 transition-all"
        >
          <Search className="w-4.5 h-4.5 w-[18px] h-[18px]" />
        </motion.button>

        {/* Locate me */}
        <motion.button
          onClick={handleLocateMe}
          disabled={isLocating}
          whileTap={{ scale: 0.90 }}
          className="w-11 h-11 flex items-center justify-center rounded-2xl bg-black/50 backdrop-blur-xl border border-white/15 text-white shadow-xl hover:bg-black/70 transition-all disabled:opacity-40"
        >
          {isLocating ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Locate className="w-[18px] h-[18px]" />
          )}
        </motion.button>
      </div>

      {/* ── Search dropdown (slides down from top-right) ── */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute right-4 left-4 z-50 shadow-2xl shadow-black/40"
            style={{ top: HEADER_H + 12 }}
          >
            <div className="bg-black/70 backdrop-blur-2xl border border-white/15 rounded-2xl">
              <PlaceSearchBar
                onPlaceSelect={handlePlaceSelect}
                placeholder="Search for a place..."
                className="w-full"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bottom floating sheet ── */}
      <div className="absolute bottom-0 left-0 right-0 z-50 px-4 pb-8">
        {/* Selected location pill — appears when location chosen */}
        <AnimatePresence>
          {selectedLocation && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="mb-3 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/12"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-blue-400" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-blue-400/70 font-semibold uppercase tracking-widest mb-0.5">
                  Selected Location
                </p>
                <p className="text-sm text-white/90 truncate font-medium">
                  {selectedLocation.address
                    ? selectedLocation.address.split(',').slice(0, 2).join(', ')
                    : `${selectedLocation.lat.toFixed(5)}, ${selectedLocation.lng.toFixed(5)}`}
                </p>
              </div>
              {/* Live pulse dot */}
              <div className="relative shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-60" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA Button */}
        <motion.button
          onClick={onContinue}
          disabled={!selectedLocation}
          whileTap={{ scale: 0.97 }}
          animate={{
            backgroundColor: selectedLocation ? '#3b82f6' : 'rgba(255,255,255,0.06)',
          }}
          transition={{ duration: 0.3 }}
          className="w-full py-4 rounded-2xl font-semibold text-base transition-colors
            disabled:text-white/25 disabled:cursor-not-allowed
            text-white shadow-2xl shadow-blue-500/30"
        >
          {selectedLocation ? 'Continue →' : 'Tap the map to pin a location'}
        </motion.button>
      </div>
    </motion.div>
  );
}

