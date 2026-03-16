'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Plus, Trash2, GripVertical, Search, Plane, Car, Train, Bus, Ship, Bike, PersonStanding, X } from 'lucide-react';
import { Place } from '@/types';
import { TransportMode } from '@/types/trip';

/** ISO 3166-1 alpha-2 → Unicode flag emoji */
function countryFlag(code?: string): string {
  if (!code || code.length !== 2) return '';
  return code.toUpperCase().split('').map(
    c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)
  ).join('');
}

interface PhotonResult {
  id: string;
  name: string;
  label: string;
  coordinates: [number, number]; // [lng, lat]
  countryCode?: string;
  city?: string;
  country?: string;
}

export interface DraftStep {
  // Temporary id for UI keying only — replaced by DB on save
  _key: string;
  name: string;
  coordinates: [number, number];
  address?: { city?: string; country?: string; formatted?: string };
  transportToNext: TransportMode | null;
  // If sourced from an existing place
  placeId?: string;
}

const TRANSPORT_OPTIONS: { mode: TransportMode; icon: React.ReactNode; label: string; color: string }[] = [
  { mode: 'flight', icon: <Plane      className="w-3.5 h-3.5" strokeWidth={1.8} />, label: 'Flight', color: 'violet' },
  { mode: 'car',    icon: <Car        className="w-3.5 h-3.5" strokeWidth={1.8} />, label: 'Car',    color: 'emerald' },
  { mode: 'train',  icon: <Train      className="w-3.5 h-3.5" strokeWidth={1.8} />, label: 'Train',  color: 'amber' },
  { mode: 'bus',    icon: <Bus        className="w-3.5 h-3.5" strokeWidth={1.8} />, label: 'Bus',    color: 'orange' },
  { mode: 'ship',   icon: <Ship       className="w-3.5 h-3.5" strokeWidth={1.8} />, label: 'Ship',   color: 'cyan' },
  { mode: 'bike',   icon: <Bike       className="w-3.5 h-3.5" strokeWidth={1.8} />, label: 'Bike',   color: 'sky' },
  { mode: 'walk',   icon: <PersonStanding className="w-3.5 h-3.5" strokeWidth={1.8} />, label: 'Walk', color: 'sky' },
];

const COLOR_MAP: Record<string, { active: string; dot: string }> = {
  violet:  { active: 'bg-violet-500/15 border-violet-500/40 text-violet-600',  dot: 'bg-violet-500' },
  emerald: { active: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600', dot: 'bg-emerald-500' },
  amber:   { active: 'bg-amber-500/15 border-amber-500/40 text-amber-600',    dot: 'bg-amber-500' },
  orange:  { active: 'bg-orange-500/15 border-orange-500/40 text-orange-600',  dot: 'bg-orange-500' },
  cyan:    { active: 'bg-cyan-500/15 border-cyan-500/40 text-cyan-600',       dot: 'bg-cyan-500' },
  sky:     { active: 'bg-sky-500/15 border-sky-500/40 text-sky-600',          dot: 'bg-sky-500' },
};

interface StepWaypointsProps {
  steps: DraftStep[];
  places: Place[];
  onStepsChange: (steps: DraftStep[]) => void;
  onRequestMapPin: () => void;
  onBack: () => void;
  onSave: () => void;
  isSaving: boolean;
  saveLabel?: string;
}

function WaypointRow({
  step,
  isLast,
  onRemove,
  onTransportChange,
}: {
  step: DraftStep;
  isLast: boolean;
  onRemove: () => void;
  onTransportChange: (mode: TransportMode) => void;
}) {

  return (
    <div className="relative">
      {/* Connector line between waypoints */}
      {!isLast && (
        <div className="absolute left-[27px] top-[52px] w-px bg-black/10" style={{ height: 'calc(100% - 28px)' }} />
      )}

      <div className="flex items-start gap-3 py-2">
        <div className="flex flex-col items-center gap-1 shrink-0 pt-2">
          <GripVertical className="w-3.5 h-3.5 text-slate-300" strokeWidth={1.8} />
          <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 bg-white shrink-0" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-800 font-medium truncate">{step.name}</p>
              {step.address?.city && (
                <p className="text-xs text-slate-400 truncate">{step.address.city}</p>
              )}
            </div>
            <button
              onClick={onRemove}
              className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-300 hover:text-red-400 transition-colors" strokeWidth={1.8} />
            </button>
          </div>

          {/* Transport to next — always visible chip row */}
          {!isLast && (
            <div className="mt-2.5 mb-1">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1.5 ml-0.5">How to get there</p>
              <div className="flex flex-wrap gap-1.5">
                {TRANSPORT_OPTIONS.map(({ mode, icon, label, color }) => {
                  const isSelected = step.transportToNext === mode;
                  const colors = COLOR_MAP[color];
                  return (
                    <button
                      key={mode}
                      onClick={() => onTransportChange(mode)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                        isSelected
                          ? colors.active
                          : 'bg-black/4 border-black/8 text-slate-500 hover:text-slate-700 hover:bg-black/8'
                      }`}
                    >
                      {isSelected && (
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${colors.dot}`} />
                      )}
                      {icon}
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StepWaypoints({
  steps,
  places,
  onStepsChange,
  onRequestMapPin,
  onBack,
  onSave,
  isSaving,
  saveLabel = 'Save Journey',
}: StepWaypointsProps) {
  const [showPlacePicker, setShowPlacePicker] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PhotonResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? '';

  const addFromPlace = (place: Place) => {
    const newStep: DraftStep = {
      _key: `place-${place.id}-${Date.now()}`,
      name: place.title,
      coordinates: [place.location.lng, place.location.lat],
      address: {
        city: place.address?.city,
        country: place.address?.country,
        formatted: place.address?.formatted,
      },
      transportToNext: null,
      placeId: place.id,
    };
    onStepsChange([...steps, newStep]);
    setShowPlacePicker(false);
  };

  const addFromSearch = (result: PhotonResult) => {
    const newStep: DraftStep = {
      _key: `search-${Date.now()}`,
      name: result.name,
      coordinates: result.coordinates,
      address: {
        city: result.city,
        country: result.country,
        formatted: result.label,
      },
      transportToNext: null,
    };
    onStepsChange([...steps, newStep]);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeStep = (key: string) => {
    onStepsChange(steps.filter((s) => s._key !== key));
  };

  const setTransport = (key: string, mode: TransportMode) => {
    onStepsChange(
      steps.map((s) => (s._key === key ? { ...s, transportToNext: mode } : s)),
    );
  };

  // Places not already added
  const availablePlaces = places.filter(
    (p) => !steps.some((s) => s.placeId === p.id),
  );

  const canSave = steps.length >= 2;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ type: 'spring', damping: 28, stiffness: 280 }}
      className="flex flex-col gap-4"
    >
      {/* Waypoint list */}
      {steps.length === 0 ? (
        <div className="py-8 text-center">
          <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-sm text-slate-400">Add at least 2 waypoints to create a route</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-black/8 bg-black/2 px-4 py-2 divide-y divide-black/5">
          {steps.map((step, index) => (
            <WaypointRow
              key={step._key}
              step={step}
              isLast={index === steps.length - 1}
              onRemove={() => removeStep(step._key)}
              onTransportChange={(mode) => setTransport(step._key, mode)}
            />
          ))}
        </div>
      )}

      {/* Add buttons — 3 options */}
      <div className="flex gap-2">
        <button
          onClick={() => { setShowPlacePicker(!showPlacePicker); setShowSearch(false); }}
          disabled={availablePlaces.length === 0}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border border-black/8 bg-black/4 hover:bg-black/8 disabled:opacity-30 disabled:cursor-not-allowed text-xs text-slate-600 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2} />
          My Places
        </button>

        <button
          onClick={() => { setShowSearch(!showSearch); setShowPlacePicker(false); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border text-xs transition-colors ${
            showSearch
              ? 'border-blue-500/40 bg-blue-500/10 text-blue-600'
              : 'border-black/8 bg-black/4 hover:bg-black/8 text-slate-600'
          }`}
        >
          <Search className="w-3.5 h-3.5" strokeWidth={2} />
          Search
        </button>

        <button
          onClick={() => { setShowSearch(false); setShowPlacePicker(false); onRequestMapPin(); }}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border border-black/8 bg-black/4 hover:bg-black/8 text-xs text-slate-600 transition-colors"
        >
          <MapPin className="w-3.5 h-3.5" strokeWidth={2} />
          Tap Map
        </button>
      </div>

      {/* Search bar — inline Photon search with flag emojis */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-visible"
          >
            <div className="rounded-2xl border border-black/8 bg-black/3 p-3 overflow-visible">
              {/* Input */}
              <div className="flex items-center gap-2 bg-white rounded-xl border border-black/10 px-3 py-2.5">
                <Search className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={2} />
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={e => {
                    const val = e.target.value;
                    setSearchQuery(val);
                    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
                    if (val.trim().length < 2) { setSearchResults([]); return; }
                    searchTimerRef.current = setTimeout(async () => {
                      setSearching(true);
                      try {
                        const params = new URLSearchParams({
                          access_token: TOKEN,
                          autocomplete: 'true',
                          limit: '7',
                          language: 'en',
                          types: 'country,region,place,locality,neighborhood,address',
                        });
                        const res = await fetch(
                          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(val)}.json?${params}`
                        );
                        const data = await res.json();
                        const features: PhotonResult[] = (data.features ?? []).map((f: any) => {
                          const countryCtx = (f.context ?? []).find((c: any) => c.id?.startsWith('country.'));
                          const rawCode = countryCtx?.short_code || f.properties?.short_code || '';
                          const countryCode = rawCode.split('-')[0].toLowerCase() || undefined;
                          // Extract city from context (place or locality entry)
                          const placeCtx = (f.context ?? []).find((c: any) =>
                            c.id?.startsWith('place.') || c.id?.startsWith('locality.')
                          );
                          const countryName = countryCtx?.text || '';
                          const cityName = placeCtx?.text || '';
                          return {
                            id: f.id,
                            name: f.text,
                            label: f.place_name,
                            coordinates: f.center as [number, number],
                            countryCode,
                            city: cityName,
                            country: countryName,
                          };
                        });
                        setSearchResults(features);
                      } catch { setSearchResults([]); }
                      finally { setSearching(false); }
                    }, 250);
                  }}
                  placeholder="Search any place..."
                  className="flex-1 bg-transparent text-slate-900 placeholder:text-slate-400 text-sm outline-none"
                />
                {searching && (
                  <div className="w-4 h-4 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin shrink-0" />
                )}
                {searchQuery && !searching && (
                  <button onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                    className="w-4 h-4 text-slate-400 shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Results */}
              <AnimatePresence>
                {searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="mt-2 rounded-xl border border-black/8 overflow-hidden"
                  >
                    {searchResults.map(result => {
                      const flag = countryFlag(result.countryCode);
                      return (
                        <button
                          key={result.id}
                          onClick={() => addFromSearch(result)}
                          className="w-full flex items-start gap-3 px-3 py-2.5 text-left bg-white hover:bg-slate-50 active:bg-slate-100 transition-colors border-b border-black/5 last:border-0"
                        >
                          {flag ? (
                            <span className="text-base leading-none shrink-0 mt-0.5">{flag}</span>
                          ) : (
                            <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" strokeWidth={2} />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{result.name}</p>
                            <p className="text-xs text-slate-400 truncate">{result.label}</p>
                          </div>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Place picker inline list */}
      <AnimatePresence>
        {showPlacePicker && availablePlaces.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-black/8 divide-y divide-black/5 max-h-48 overflow-y-auto">
              {availablePlaces.map((place) => (
                <button
                  key={place.id}
                  onClick={() => addFromPlace(place)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-black/2 hover:bg-black/6 transition-colors text-left"
                >
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={1.8} />
                  <div className="min-w-0">
                    <p className="text-sm text-slate-800 truncate">{place.title}</p>
                    {place.address?.city && (
                      <p className="text-xs text-slate-400 truncate">{place.address.city}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-xl border border-black/8 bg-black/4 hover:bg-black/8 text-sm text-slate-600 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onSave}
          disabled={!canSave || isSaving}
          className="flex-1 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
        >
          {isSaving ? 'Saving...' : saveLabel}
        </button>
      </div>
    </motion.div>
  );
}
