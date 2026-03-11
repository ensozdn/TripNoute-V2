'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Locate, MapPin, Search, X } from 'lucide-react';
import MapboxLocationPicker from '@/components/MapboxLocationPicker';

export interface SelectedLocation {
  lat: number;
  lng: number;
  address?: string;
}

interface MapboxFeature {
  id: string;
  place_name: string;
  center: [number, number];
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
  const [flyTarget, setFlyTarget]   = useState<{ lat: number; lng: number } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery]           = useState('');
  const [results, setResults]       = useState<MapboxFeature[]>([]);
  const [searching, setSearching]   = useState(false);

  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? '';

  const handleSearch = async (value: string) => {
    setQuery(value);
    if (value.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&limit=5&language=en`
      );
      const data = await res.json();
      setResults(data.features ?? []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleResultSelect = (feature: MapboxFeature) => {
    const [lng, lat] = feature.center;
    const loc: SelectedLocation = { lat, lng, address: feature.place_name };
    onLocationSelect(loc);
    setFlyTarget({ lat, lng });
    setSearchOpen(false);
    setQuery('');
    setResults([]);
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<string | undefined> => {
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&limit=1&language=en`
      );
      const data = await res.json();
      return data.features?.[0]?.place_name as string | undefined;
    } catch {
      return undefined;
    }
  };

  const handleLocateMe = async () => {
    if (!('geolocation' in navigator)) return;
    setIsLocating(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
      );
      const { latitude: lat, longitude: lng } = pos.coords;
      const address = await reverseGeocode(lat, lng);
      onLocationSelect({ lat, lng, address });
      setFlyTarget({ lat, lng });
    } catch {
      // silently fail
    } finally {
      setIsLocating(false);
    }
  };

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
      {/* Full-screen map */}
      <div className="absolute left-0 right-0 bottom-0" style={{ top: HEADER_H }}>
        <MapboxLocationPicker
          initialLocation={selectedLocation ?? undefined}
          onLocationSelect={onLocationSelect}
          flyToLocation={flyTarget}
          hideSearch
          hideLocate
          className="!rounded-none !border-0 !h-full !w-full"
        />
      </div>

      {/* Top-right FABs */}
      <div className="absolute right-4 z-50 flex flex-col gap-2" style={{ top: HEADER_H + 12 }}>
        <motion.button
          onClick={() => { setSearchOpen(v => !v); setQuery(''); setResults([]); }}
          whileTap={{ scale: 0.90 }}
          className="w-11 h-11 flex items-center justify-center rounded-2xl bg-black/50 backdrop-blur-xl border border-white/15 text-white shadow-xl"
        >
          {searchOpen ? <X className="w-[18px] h-[18px]" /> : <Search className="w-[18px] h-[18px]" />}
        </motion.button>

        <motion.button
          onClick={handleLocateMe}
          disabled={isLocating}
          whileTap={{ scale: 0.90 }}
          className="w-11 h-11 flex items-center justify-center rounded-2xl bg-black/50 backdrop-blur-xl border border-white/15 text-white shadow-xl disabled:opacity-40"
        >
          {isLocating
            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <Locate className="w-[18px] h-[18px]" />
          }
        </motion.button>
      </div>

      {/* Search panel */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute left-4 right-16 z-50 shadow-2xl shadow-black/40"
            style={{ top: HEADER_H + 12 }}
          >
            <div className="bg-black/75 backdrop-blur-2xl border border-white/15 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-3">
                <Search className="w-4 h-4 text-white/50 shrink-0" />
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={e => handleSearch(e.target.value)}
                  placeholder="Search for a place…"
                  className="flex-1 bg-transparent text-white placeholder:text-white/40 text-sm outline-none"
                />
                {searching && (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white/70 rounded-full animate-spin shrink-0" />
                )}
              </div>

              <AnimatePresence>
                {results.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/10 overflow-hidden"
                  >
                    {results.map(feature => (
                      <button
                        key={feature.id}
                        onClick={() => handleResultSelect(feature)}
                        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-white/10 transition-colors border-b border-white/5 last:border-0"
                      >
                        <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" strokeWidth={2} />
                        <span className="text-sm text-white/90 leading-tight">{feature.place_name}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom CTA */}
      <div className="absolute bottom-0 left-0 right-0 z-50 px-4 pb-8">
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
                <p className="text-[10px] text-blue-400/70 font-semibold uppercase tracking-widest mb-0.5">Selected Location</p>
                <p className="text-sm text-white/90 truncate font-medium">
                  {selectedLocation.address
                    ? selectedLocation.address.split(',').slice(0, 2).join(', ')
                    : `${selectedLocation.lat.toFixed(5)}, ${selectedLocation.lng.toFixed(5)}`}
                </p>
              </div>
              <div className="relative shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-60" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={onContinue}
          disabled={!selectedLocation}
          whileTap={{ scale: 0.97 }}
          animate={{ backgroundColor: selectedLocation ? '#3b82f6' : 'rgba(255,255,255,0.06)' }}
          transition={{ duration: 0.3 }}
          className="w-full py-4 rounded-2xl font-semibold text-base text-white shadow-2xl shadow-blue-500/30 disabled:text-white/25 disabled:cursor-not-allowed"
        >
          {selectedLocation ? 'Continue →' : 'Tap the map to pin a location'}
        </motion.button>
      </div>
    </motion.div>
  );
}
