'use client';

import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Locate, MapPin, Search, X } from 'lucide-react';
import { useMapbox } from '@/hooks/useMapbox';

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
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLocating, setIsLocating]   = useState(false);
  const [searchOpen, setSearchOpen]   = useState(false);
  const [query, setQuery]             = useState('');
  const [results, setResults]         = useState<MapboxFeature[]>([]);
  const [searching, setSearching]     = useState(false);

  const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? '';

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${TOKEN}&limit=1&language=en`
      );
      const data = await res.json();
      return data.features?.[0]?.place_name as string | undefined;
    } catch {
      return undefined;
    }
  };

  const { isLoaded, flyTo } = useMapbox(mapRef, {
    accessToken: TOKEN,
    style: 'mapbox://styles/mapbox/satellite-streets-v12',
    center: selectedLocation
      ? [selectedLocation.lng, selectedLocation.lat]
      : [28.9784, 41.0082],
    zoom: selectedLocation ? 13 : 4,
    onMapClick: async (lat, lng) => {
      const address = await reverseGeocode(lat, lng);
      onLocationSelect({ lat, lng, address });
    },
  });

  const handleSearch = async (value: string) => {
    setQuery(value);
    if (value.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json?access_token=${TOKEN}&autocomplete=true&limit=5&language=en`
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
    onLocationSelect({ lat, lng, address: feature.place_name });
    flyTo(lat, lng, 14);
    setSearchOpen(false);
    setQuery('');
    setResults([]);
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
      flyTo(lat, lng, 14);
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
      transition={{ duration: 0.2 }}
      className="absolute inset-0"
    >
      {/* Full-bleed map canvas */}
      <div
        ref={mapRef}
        className="absolute left-0 right-0 bottom-0"
        style={{ top: HEADER_H }}
      />

      {/* Loading overlay */}
      {!isLoaded && (
        <div
          className="absolute left-0 right-0 bottom-0 bg-slate-900 flex items-center justify-center z-10"
          style={{ top: HEADER_H }}
        >
          <div className="w-10 h-10 border-4 border-white/20 border-t-white/70 rounded-full animate-spin" />
        </div>
      )}

      {/* Center crosshair pin */}
      <div
        className="absolute inset-x-0 pointer-events-none z-20 flex flex-col items-center justify-center"
        style={{ top: HEADER_H, bottom: 0 }}
      >
        <div className="flex flex-col items-center" style={{ marginBottom: 28 }}>
          {!selectedLocation && (
            <>
              <div className="absolute w-14 h-14 rounded-full border-2 border-blue-400/30 animate-ping" />
              <div className="absolute w-9 h-9 rounded-full border border-blue-400/20 animate-pulse" />
            </>
          )}
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
              selectedLocation
                ? 'bg-blue-500 scale-110 shadow-blue-500/60'
                : 'bg-white/15 backdrop-blur-sm'
            }`}
            style={{ border: selectedLocation ? '3px solid white' : '2px solid rgba(255,255,255,0.4)' }}
          >
            <MapPin
              className={`w-5 h-5 transition-colors duration-300 ${selectedLocation ? 'text-white' : 'text-white/70'}`}
              strokeWidth={2.5}
            />
          </div>
          <div className={`w-1 h-4 rounded-full mt-0.5 transition-colors duration-300 ${selectedLocation ? 'bg-blue-400/80' : 'bg-white/30'}`} />
          <div className={`w-3 h-1 rounded-full blur-[1px] transition-colors duration-300 ${selectedLocation ? 'bg-blue-400/50' : 'bg-white/15'}`} />
        </div>
      </div>

      {/* Top-right FABs */}
      <div
        className="absolute right-4 z-30 flex flex-col gap-2.5"
        style={{ top: HEADER_H + 16 }}
      >
        <motion.button
          onClick={() => { setSearchOpen(v => !v); setQuery(''); setResults([]); }}
          whileTap={{ scale: 0.88 }}
          className="w-11 h-11 flex items-center justify-center rounded-2xl bg-black/55 backdrop-blur-xl border border-white/15 text-white shadow-xl shadow-black/30"
        >
          {searchOpen ? <X className="w-[18px] h-[18px]" /> : <Search className="w-[18px] h-[18px]" />}
        </motion.button>

        <motion.button
          onClick={handleLocateMe}
          disabled={isLocating}
          whileTap={{ scale: 0.88 }}
          className="w-11 h-11 flex items-center justify-center rounded-2xl bg-black/55 backdrop-blur-xl border border-white/15 text-white shadow-xl shadow-black/30 disabled:opacity-40"
        >
          {isLocating
            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <Locate className="w-[18px] h-[18px]" />
          }
        </motion.button>
      </div>

      {/* Search dropdown */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="absolute left-4 right-16 z-30 shadow-2xl shadow-black/50"
            style={{ top: HEADER_H + 16 }}
          >
            <div className="bg-black/80 backdrop-blur-2xl border border-white/15 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2.5 px-3.5 py-3">
                <Search className="w-4 h-4 text-white/40 shrink-0" />
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={e => handleSearch(e.target.value)}
                  placeholder="Search for a place…"
                  className="flex-1 bg-transparent text-white placeholder:text-white/35 text-sm outline-none"
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
                        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-white/8 active:bg-white/12 transition-colors border-b border-white/5 last:border-0"
                      >
                        <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" strokeWidth={2} />
                        <span className="text-sm text-white/90 leading-snug">{feature.place_name}</span>
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
      <div className="absolute bottom-0 left-0 right-0 z-30 px-4 pb-10">
        <AnimatePresence>
          {selectedLocation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="mb-3 flex items-center gap-3 px-4 py-3 rounded-2xl bg-black/65 backdrop-blur-2xl border border-white/12"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-500/25 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-blue-400" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-blue-300/70 font-bold uppercase tracking-widest mb-0.5">Selected Location</p>
                <p className="text-sm text-white/90 truncate font-medium">
                  {selectedLocation.address
                    ? selectedLocation.address.split(',').slice(0, 2).join(', ')
                    : `${selectedLocation.lat.toFixed(5)}, ${selectedLocation.lng.toFixed(5)}`}
                </p>
              </div>
              <div className="relative shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-50" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={onContinue}
          disabled={!selectedLocation}
          whileTap={{ scale: 0.97 }}
          className={`w-full py-4 rounded-2xl font-semibold text-base shadow-2xl transition-all duration-300 ${
            selectedLocation
              ? 'bg-blue-500 text-white shadow-blue-500/35 active:bg-blue-600'
              : 'bg-black/40 backdrop-blur-xl text-white/30 border border-white/10 cursor-not-allowed'
          }`}
        >
          {selectedLocation ? 'Continue →' : 'Tap the map to pin a location'}
        </motion.button>
      </div>
    </motion.div>
  );
}
