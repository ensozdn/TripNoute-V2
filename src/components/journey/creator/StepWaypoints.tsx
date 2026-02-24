'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Plus, Trash2, GripVertical } from 'lucide-react';
import { Place } from '@/types';
import { TransportMode } from '@/types/trip';

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

const TRANSPORT_OPTIONS: { mode: TransportMode; emoji: string; label: string }[] = [
  { mode: 'flight', emoji: '✈️', label: 'Flight' },
  { mode: 'car',    emoji: '🚗', label: 'Car' },
  { mode: 'train',  emoji: '🚂', label: 'Train' },
  { mode: 'bus',    emoji: '🚌', label: 'Bus' },
  { mode: 'ship',   emoji: '🚢', label: 'Ship' },
  { mode: 'bike',   emoji: '🚲', label: 'Bike' },
  { mode: 'walk',   emoji: '🚶', label: 'Walk' },
];

interface StepWaypointsProps {
  steps: DraftStep[];
  places: Place[];
  onStepsChange: (steps: DraftStep[]) => void;
  onRequestMapPin: () => void;
  onBack: () => void;
  onSave: () => void;
  isSaving: boolean;
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
                {TRANSPORT_OPTIONS.map(({ mode, emoji, label }) => {
                  const isSelected = step.transportToNext === mode;
                  return (
                    <button
                      key={mode}
                      onClick={() => onTransportChange(mode)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                        isSelected
                          ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                          : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70 hover:bg-white/10'
                      }`}
                    >
                      <span>{emoji}</span>
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
}: StepWaypointsProps) {
  const [showPlacePicker, setShowPlacePicker] = useState(false);

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

      {/* Add buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowPlacePicker(!showPlacePicker)}
          disabled={availablePlaces.length === 0}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-sm text-white/70 transition-colors"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          From My Places
        </button>

        <button
          onClick={onRequestMapPin}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm text-white/70 transition-colors"
        >
          <MapPin className="w-4 h-4" strokeWidth={2} />
          Tap on Map
        </button>
      </div>

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
          {isSaving ? 'Saving...' : 'Save Journey'}
        </button>
      </div>
    </motion.div>
  );
}
