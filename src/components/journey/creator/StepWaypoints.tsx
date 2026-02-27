'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Plus, Trash2, GripVertical, Search, Plane, Car, Train, Bus, Ship, Bike, PersonStanding } from 'lucide-react';
import { Place } from '@/types';
import { TransportMode } from '@/types/trip';
import PlaceSearchBar from '@/components/PlaceSearchBar';
import type { GooglePlaceResult } from '@/types/maps';

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
  violet:  { active: 'bg-violet-500/20 border-violet-500/50 text-violet-300',  dot: 'bg-violet-400' },
  emerald: { active: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300', dot: 'bg-emerald-400' },
  amber:   { active: 'bg-amber-500/20 border-amber-500/50 text-amber-300',    dot: 'bg-amber-400' },
  orange:  { active: 'bg-orange-500/20 border-orange-500/50 text-orange-300',  dot: 'bg-orange-400' },
  cyan:    { active: 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300',       dot: 'bg-cyan-400' },
  sky:     { active: 'bg-sky-500/20 border-sky-500/50 text-sky-300',          dot: 'bg-sky-400' },
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
        <div className="absolute left-[27px] top-[52px] w-px bg-white/10" style={{ height: 'calc(100% - 28px)' }} />
      )}

      <div className="flex items-start gap-3 py-2">
        <div className="flex flex-col items-center gap-1 shrink-0 pt-2">
          <GripVertical className="w-3.5 h-3.5 text-white/15" strokeWidth={1.8} />
          <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 bg-black/40 shrink-0" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">{step.name}</p>
              {step.address?.city && (
                <p className="text-xs text-white/35 truncate">{step.address.city}</p>
              )}
            </div>
            <button
              onClick={onRemove}
              className="p-1.5 rounded-lg hover:bg-red-500/15 transition-colors shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5 text-white/20 hover:text-red-400 transition-colors" strokeWidth={1.8} />
            </button>
          </div>

          {/* Transport to next — always visible chip row */}
          {!isLast && (
            <div className="mt-2.5 mb-1">
              <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1.5 ml-0.5">How to get there</p>
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
                          : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70 hover:bg-white/10'
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

  const addFromSearch = (result: GooglePlaceResult) => {
    const newStep: DraftStep = {
      _key: `search-${Date.now()}`,
      name: result.name || result.formattedAddress,
      coordinates: [result.location.lng, result.location.lat],
      address: {
        formatted: result.formattedAddress,
      },
      transportToNext: null,
    };
    onStepsChange([...steps, newStep]);
    setShowSearch(false);
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
          <MapPin className="w-8 h-8 text-white/15 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-sm text-white/35">Add at least 2 waypoints to create a route</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/3 px-4 py-2 divide-y divide-white/5">
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
          className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-xs text-white/70 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2} />
          My Places
        </button>

        <button
          onClick={() => { setShowSearch(!showSearch); setShowPlacePicker(false); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border text-xs transition-colors ${
            showSearch
              ? 'border-blue-500/40 bg-blue-500/15 text-blue-300'
              : 'border-white/10 bg-white/5 hover:bg-white/10 text-white/70'
          }`}
        >
          <Search className="w-3.5 h-3.5" strokeWidth={2} />
          Search
        </button>

        <button
          onClick={() => { setShowSearch(false); setShowPlacePicker(false); onRequestMapPin(); }}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-white/70 transition-colors"
        >
          <MapPin className="w-3.5 h-3.5" strokeWidth={2} />
          Tap Map
        </button>
      </div>

      {/* Search bar — inline dropdown */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-visible"
          >
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 overflow-visible">
              <PlaceSearchBar
                onPlaceSelect={addFromSearch}
                placeholder="Search any place..."
                className="w-full"
                dropdownDirection="up"
              />
              <p className="text-[11px] text-white/25 mt-2 text-center">
                Select a result to add as waypoint
              </p>
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
            <div className="rounded-2xl border border-white/10 divide-y divide-white/5 max-h-48 overflow-y-auto">
              {availablePlaces.map((place) => (
                <button
                  key={place.id}
                  onClick={() => addFromPlace(place)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 transition-colors text-left"
                >
                  <MapPin className="w-4 h-4 text-white/30 shrink-0" strokeWidth={1.8} />
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{place.title}</p>
                    {place.address?.city && (
                      <p className="text-xs text-white/35 truncate">{place.address.city}</p>
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
          className="flex-1 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm text-white/60 transition-colors"
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
