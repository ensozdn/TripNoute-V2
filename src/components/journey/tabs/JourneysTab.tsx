'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Route, Plus, Trash2, ChevronRight, MapPin } from 'lucide-react';
import { Trip } from '@/types/trip';

interface JourneysTabProps {
  journeys: Trip[];
  onCreateJourney: () => void;
  onSelectJourney: (journey: Trip) => void;
  onDeleteJourney: (journeyId: string) => Promise<void>;
}

function EmptyState({ onCreateJourney }: { onCreateJourney: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
        <Route className="w-8 h-8 text-white/20" strokeWidth={1.5} />
      </div>
      <p className="text-white/60 text-base font-medium mb-1">No journeys yet</p>
      <p className="text-white/25 text-sm mb-6 leading-relaxed max-w-[220px]">
        Create your first journey to connect your places into a route
      </p>
      <button
        onClick={onCreateJourney}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 text-sm font-medium hover:bg-blue-500/30 transition-colors"
      >
        <Plus className="w-4 h-4" strokeWidth={2} />
        Create Journey
      </button>
    </motion.div>
  );
}

function JourneyCard({
  journey,
  index,
  onSelect,
  onDelete,
}: {
  journey: Trip;
  index: number;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const stepCount = journey.steps.length;
  const firstCity = journey.steps[0]?.address?.city ?? journey.steps[0]?.name;
  const lastCity =
    journey.steps[stepCount - 1]?.address?.city ?? journey.steps[stepCount - 1]?.name;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className="flex items-center gap-3 px-4 py-3.5 bg-white/5 hover:bg-white/8 transition-colors"
    >
      {/* Color dot */}
      <div
        className="w-3 h-3 rounded-full shrink-0"
        style={{ backgroundColor: journey.color }}
      />

      {/* Main info — clickable */}
      <button
        onClick={onSelect}
        className="flex-1 min-w-0 text-left"
      >
        <p className="text-sm text-white font-medium truncate">{journey.name}</p>
        {firstCity && lastCity && firstCity !== lastCity ? (
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-white/30 shrink-0" strokeWidth={1.8} />
            <p className="text-xs text-white/40 truncate">
              {firstCity} → {lastCity}
            </p>
          </div>
        ) : (
          <p className="text-xs text-white/40 mt-0.5">
            {stepCount} {stepCount === 1 ? 'stop' : 'stops'}
          </p>
        )}
      </button>

      {/* Stops count badge */}
      <span className="text-xs text-white/30 shrink-0 tabular-nums">
        {stepCount}
      </span>

      {/* Open detail */}
      <button
        onClick={onSelect}
        className="p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
      >
        <ChevronRight className="w-4 h-4 text-white/30" strokeWidth={1.8} />
      </button>

      {/* Delete */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="p-1 rounded-lg hover:bg-red-500/15 transition-colors shrink-0"
      >
        <Trash2 className="w-4 h-4 text-white/20 hover:text-red-400 transition-colors" strokeWidth={1.8} />
      </button>
    </motion.div>
  );
}

export default function JourneysTab({
  journeys,
  onCreateJourney,
  onSelectJourney,
  onDeleteJourney,
}: JourneysTabProps) {
  return (
    <div className="py-4">
      <AnimatePresence mode="wait">
        {journeys.length === 0 ? (
          <EmptyState key="empty" onCreateJourney={onCreateJourney} />
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-0"
          >
            {/* Header row */}
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-xs text-white/30 uppercase tracking-widest font-medium">
                {journeys.length} {journeys.length === 1 ? 'Journey' : 'Journeys'}
              </p>
              <button
                onClick={onCreateJourney}
                className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                New
              </button>
            </div>

            {/* List */}
            <div className="rounded-2xl overflow-hidden border border-white/10 divide-y divide-white/5">
              {journeys.map((journey, index) => (
                <JourneyCard
                  key={journey.id}
                  journey={journey}
                  index={index}
                  onSelect={() => onSelectJourney(journey)}
                  onDelete={() => onDeleteJourney(journey.id)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
