'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Trip } from '@/types/trip';
import { Plus, TrendingUp, UserPlus, MapPin, MoreHorizontal } from 'lucide-react';

interface MeTabProps {
  userName?: string | null;
  userPhoto?: string | null;
  countriesCount: number;
  journeys: Trip[];
  onAddTrip: () => void;
  onAddPlace: () => void;
  onOpenJourneyMenu?: (journey: Trip) => void;
}

function JourneyCard({
  journey,
  index,
  onMenuOpen,
}: {
  journey: Trip;
  index: number;
  onMenuOpen: (j: Trip) => void;
}) {
  const firstStep = journey.steps?.[0];
  const startDate = firstStep?.timestamp ? new Date(firstStep.timestamp) : null;
  const month = startDate
    ? startDate.toLocaleDateString('en-US', { month: 'long' }).toUpperCase()
    : null;
  const year = startDate ? startDate.getFullYear() : null;

  const lastStep = journey.steps?.[journey.steps.length - 1];
  let days = 0;
  if (firstStep?.timestamp && lastStep?.timestamp) {
    days = Math.max(
      1,
      Math.round((lastStep.timestamp - firstStep.timestamp) / (1000 * 60 * 60 * 24))
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className="relative w-full rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
      style={{ minHeight: 180 }}
      onClick={() => onMenuOpen(journey)}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${journey.color ?? '#1e3a5f'}cc, ${journey.color ?? '#1e3a5f'}55)`,
          backgroundColor: '#1e3a5f',
        }}
      />
      <div className="absolute inset-0 bg-black/30" />

      <div className="absolute top-3 left-3">
        <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-white text-[10px] font-bold tracking-widest uppercase">
            Now Traveling
          </span>
        </div>
      </div>

      <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
        <MoreHorizontal className="w-4 h-4 text-white" />
      </div>

      <div className="relative z-10 p-4 pt-12 flex flex-col justify-end" style={{ minHeight: 180 }}>
        <h3 className="text-white text-2xl font-bold mb-3 leading-tight">
          {journey.name}
        </h3>
        <div className="flex items-end justify-between">
          <div className="flex items-center gap-6">
            {year && (
              <div>
                <p className="text-white text-lg font-bold leading-none">{year}</p>
                <p className="text-white/60 text-[10px] font-semibold tracking-wider uppercase mt-0.5">
                  {month}
                </p>
              </div>
            )}
            {days > 0 && (
              <div>
                <p className="text-white text-lg font-bold leading-none">{days}</p>
                <p className="text-white/60 text-[10px] font-semibold tracking-wider uppercase mt-0.5">
                  Days
                </p>
              </div>
            )}
            {journey.steps?.length > 0 && (
              <div>
                <p className="text-white text-lg font-bold leading-none">
                  {journey.steps.length}
                </p>
                <p className="text-white/60 text-[10px] font-semibold tracking-wider uppercase mt-0.5">
                  Stops
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function MeTab({
  userName,
  userPhoto,
  countriesCount,
  journeys,
  onAddTrip,
  onAddPlace,
  onOpenJourneyMenu,
}: MeTabProps) {
  const displayName = userName || 'Traveler';
  const firstName = displayName.split(' ')[0];
  const flagEmoji = '🇹🇷';

  return (
    <div className="pt-4 pb-8">
      <div className="flex items-center gap-4 mb-5">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-200 shrink-0 ring-2 ring-black/8">
          {userPhoto ? (
            <Image
              src={userPhoto}
              alt={displayName}
              width={80}
              height={80}
              className="w-full h-full object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-slate-900 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {firstName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-slate-900 text-xl font-bold leading-tight">{displayName}</h2>
            <span className="text-lg">{flagEmoji}</span>
          </div>
          <p className="text-slate-400 text-sm mt-0.5">Traveler</p>
        </div>
      </div>

      <div className="flex items-center mb-5">
        <div className="flex-1 flex flex-col items-start">
          <span className="text-slate-900 text-xl font-bold">{countriesCount}</span>
          <span className="text-slate-400 text-xs mt-0.5">Countries</span>
        </div>
        <div className="w-px h-8 bg-black/10" />
        <div className="flex-1 flex flex-col items-center">
          <span className="text-slate-900 text-xl font-bold">0</span>
          <span className="text-slate-400 text-xs mt-0.5">Followers</span>
        </div>
        <div className="w-px h-8 bg-black/10" />
        <div className="flex-1 flex flex-col items-end">
          <span className="text-slate-900 text-xl font-bold">0</span>
          <span className="text-slate-400 text-xs mt-0.5">Following</span>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={onAddTrip}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-blue-500 hover:bg-blue-600 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 text-white" strokeWidth={2.5} />
          <span className="text-white text-sm font-semibold">Add trip</span>
        </button>
        <button
          onClick={onAddPlace}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-black/15 hover:bg-black/5 active:scale-95 transition-all"
        >
          <TrendingUp className="w-4 h-4 text-slate-700" strokeWidth={2} />
          <span className="text-slate-700 text-sm font-semibold">Add place</span>
        </button>
        <button className="w-12 h-12 rounded-2xl border border-black/15 flex items-center justify-center hover:bg-black/5 active:scale-95 transition-all shrink-0">
          <UserPlus className="w-4 h-4 text-slate-700" strokeWidth={2} />
        </button>
      </div>

      {journeys.length > 0 ? (
        <div className="space-y-3 mb-4">
          {journeys.map((journey, index) => (
            <JourneyCard
              key={journey.id}
              journey={journey}
              index={index}
              onMenuOpen={(j) => onOpenJourneyMenu?.(j)}
            />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex flex-col items-center py-10 px-4 text-center mb-4"
        >
          <div className="w-20 h-20 rounded-3xl bg-blue-50 flex items-center justify-center mb-5">
            <MapPin className="w-9 h-9 text-blue-400" strokeWidth={1.5} />
          </div>
          <h3 className="text-slate-800 text-lg font-bold mb-2">Your journey starts here</h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-xs">
            Create your first trip and start tracking your adventures around the world.
          </p>
          <button
            onClick={onAddTrip}
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-blue-500 hover:bg-blue-600 active:scale-95 transition-all shadow-lg shadow-blue-500/25"
          >
            <Plus className="w-5 h-5 text-white" strokeWidth={2.5} />
            <span className="text-white text-base font-semibold">Add your first step</span>
          </button>
        </motion.div>
      )}

      <button
        onClick={onAddTrip}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-blue-500 hover:bg-blue-600 active:scale-95 transition-all shadow-lg shadow-blue-500/25"
      >
        <Plus className="w-5 h-5 text-white" strokeWidth={2.5} />
        <span className="text-white text-base font-semibold">
          Add a past, current or future trip
        </span>
      </button>
    </div>
  );
}
