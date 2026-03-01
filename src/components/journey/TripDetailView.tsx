'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trip, JourneyStep } from '@/types/trip';
import {
  ChevronLeft,
  MoreHorizontal,
  Calendar,
  Share2,
  Plus,
  MapPin,
  Bed,
  Crosshair,
  Navigation,
  Sparkles,
  Trash2,
  Pencil,
  X,
} from 'lucide-react';

type ActiveMode = 'plan' | 'track';
type SheetState = 'peek' | 'mid' | 'full';

const SHEET_SNAPS: Record<SheetState, string> = {
  peek: '38%',
  mid: '55%',
  full: '92%',
};

interface TripDetailViewProps {
  trip: Trip;
  userName?: string | null;
  userPhoto?: string | null;
  onBack: () => void;
  onEdit: (trip: Trip) => void;
  onDelete: (tripId: string) => void;
}

// ─── Step Row ────────────────────────────────────────────────────────────────
function StepRow({ step, index }: { step: JourneyStep; index: number }) {
  const date = step.timestamp ? new Date(step.timestamp) : null;
  const dateStr = date
    ? date
        .toLocaleDateString('en-US', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
        .toUpperCase()
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      className="flex gap-3 items-start"
    >
      {/* Timeline spine */}
      <div className="flex flex-col items-center shrink-0 pt-1">
        <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center shadow-md">
          <MapPin className="w-4 h-4 text-white" strokeWidth={2} />
        </div>
        <div className="w-0.5 flex-1 min-h-[28px] bg-black/10 mt-1" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-5">
        {dateStr && (
          <p className="text-slate-400 text-[10px] font-bold tracking-wider mb-1">{dateStr}</p>
        )}
        <div className="bg-white rounded-2xl border border-black/6 p-3 shadow-sm">
          <p className="text-slate-900 font-semibold text-sm">{step.name}</p>
          {step.address?.formatted && (
            <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">
              {step.address.formatted}
            </p>
          )}
          {step.notes && (
            <p className="text-slate-600 text-xs mt-2 leading-relaxed">{step.notes}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Plan Mode FAB Menu ───────────────────────────────────────────────────────
function PlanFAB({ onAction }: { onAction: (type: string) => void }) {
  const [open, setOpen] = useState(false);

  const items = [
    {
      id: 'itinerary',
      label: 'Create itinerary',
      icon: <Sparkles className="w-4 h-4" />,
      color: 'text-orange-500',
    },
    {
      id: 'stay',
      label: 'Add a stay',
      icon: <Bed className="w-4 h-4" />,
      color: 'text-slate-700',
    },
    {
      id: 'spot',
      label: 'Add a spot',
      icon: <Crosshair className="w-4 h-4" />,
      color: 'text-slate-700',
    },
    {
      id: 'dest',
      label: 'Add a destination',
      icon: <Plus className="w-4 h-4" />,
      color: 'text-slate-700',
    },
  ];

  return (
    <div className="relative">
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1]"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 8 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="absolute bottom-14 right-0 z-[2] bg-white rounded-2xl shadow-2xl shadow-black/15 border border-black/6 py-2 min-w-[200px]"
            >
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onAction(item.id);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 active:bg-slate-100 transition-colors"
                >
                  <span className={item.color}>{item.icon}</span>
                  <span
                    className={`text-sm font-semibold ${item.id === 'itinerary' ? 'text-orange-500' : 'text-slate-800'}`}
                  >
                    {item.label}
                  </span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen((o) => !o)}
        animate={{ rotate: open ? 45 : 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center shadow-lg shadow-black/25 active:scale-90 transition-transform"
      >
        <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
      </motion.button>
    </div>
  );
}

// ─── Track Mode Empty State ───────────────────────────────────────────────────
function TrackEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-8 px-6 text-center"
    >
      {/* Illustration */}
      <div className="relative w-28 h-24 mb-5">
        <div className="absolute left-2 top-0 w-16 h-20 bg-slate-700 rounded-xl rotate-[-6deg] flex flex-col gap-1.5 px-3 py-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-1 rounded-full bg-white/20"
              style={{ width: `${60 + i * 8}%` }}
            />
          ))}
        </div>
        <div className="absolute right-0 top-1 w-16 h-20 bg-slate-500 rounded-xl rotate-[8deg] overflow-hidden">
          <div className="w-full h-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-end justify-center pb-2">
            <Navigation className="w-6 h-6 text-white/60" />
          </div>
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-red-500 flex items-center justify-center shadow-lg z-10">
          <Plus className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
      </div>

      <h3 className="text-white text-lg font-bold mb-2">Add your first step</h3>
      <p className="text-white/50 text-sm leading-relaxed mb-6 max-w-xs">
        Mark a location on your map and bring it to life with text, photos, and videos.
      </p>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-white text-slate-900 font-bold text-sm shadow-lg active:scale-95 transition-transform"
      >
        <Plus className="w-4 h-4" strokeWidth={2.5} />
        Add
      </button>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TripDetailView({
  trip,
  userName,
  userPhoto,
  onBack,
  onEdit,
  onDelete,
}: TripDetailViewProps) {
  const [activeMode, setActiveMode] = useState<ActiveMode>('plan');
  const [sheetState, setSheetState] = useState<SheetState>('mid');
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const startDate = trip.startDate
    ? (() => {
        const ts = trip.startDate as { seconds?: number; toDate?: () => Date } | undefined;
        if (!ts) return null;
        if (typeof ts.toDate === 'function') return ts.toDate();
        if (typeof ts.seconds === 'number') return new Date(ts.seconds * 1000);
        return null;
      })()
    : null;

  const startDateStr = startDate
    ? startDate
        .toLocaleDateString('en-US', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
        .toUpperCase()
    : null;

  const handleDrag = (
    _e: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { y: number }; velocity: { y: number } }
  ) => {
    if (info.velocity.y < -300) {
      setSheetState((s) => (s === 'peek' ? 'mid' : s === 'mid' ? 'full' : 'full'));
    } else if (info.velocity.y > 300) {
      setSheetState((s) => (s === 'full' ? 'mid' : s === 'mid' ? 'peek' : 'peek'));
    } else {
      const dy = info.offset.y;
      if (dy < -60) setSheetState((s) => (s === 'peek' ? 'mid' : 'full'));
      else if (dy > 60) setSheetState((s) => (s === 'full' ? 'mid' : 'peek'));
    }
  };

  const isTrackEmpty = activeMode === 'track' && trip.steps.length === 0;

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      className="fixed inset-0 z-[60] flex flex-col"
    >
      {/* ── Map background ── */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(160deg, #1a2744 0%, #0f1e3a 40%, #162035 70%, #1e3a2f 100%)`,
        }}
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(ellipse at 30% 40%, rgba(34,85,60,0.6) 0%, transparent 50%),
                              radial-gradient(ellipse at 70% 60%, rgba(20,50,80,0.5) 0%, transparent 50%),
                              radial-gradient(ellipse at 50% 20%, rgba(10,30,60,0.8) 0%, transparent 60%)`,
          }}
        />
        <svg
          className="absolute inset-0 w-full h-full opacity-20"
          viewBox="0 0 375 500"
          preserveAspectRatio="xMidYMid slice"
        >
          <path
            d="M 60 280 Q 120 260 160 240 Q 200 220 230 210 Q 260 200 290 215 Q 320 230 340 220"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeDasharray="6 4"
          />
          <circle cx="60" cy="280" r="5" fill="white" opacity="0.6" />
          <circle cx="340" cy="220" r="5" fill="white" opacity="0.4" />
        </svg>
      </div>

      {/* ── Top bar ── */}
      <div className="relative z-10 flex items-center gap-3 px-4 pt-12 pb-3">
        {/* Back */}
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center active:scale-90 transition-transform"
        >
          <ChevronLeft className="w-5 h-5 text-white" strokeWidth={2.5} />
        </button>

        {/* Center: user + trip name */}
        <div className="flex-1 flex flex-col items-center">
          <div className="flex items-center gap-1.5 mb-0.5">
            {userPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={userPhoto} alt="" className="w-4 h-4 rounded-full object-cover" />
            ) : (
              <div className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center">
                <span className="text-white text-[8px] font-bold">
                  {(userName ?? 'T').charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span className="text-white/60 text-xs font-medium">{userName ?? 'Traveler'}</span>
          </div>
          <h1 className="text-white text-lg font-bold leading-tight text-center">{trip.name}</h1>
        </div>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center active:scale-90 transition-transform"
          >
            <MoreHorizontal className="w-5 h-5 text-white" strokeWidth={2} />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[1]"
                  onClick={() => setMenuOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -4 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  className="absolute top-12 right-0 z-[2] bg-white rounded-2xl shadow-2xl shadow-black/20 border border-black/6 py-2 min-w-[160px]"
                >
                  <button
                    onClick={() => {
                      onEdit(trip);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-amber-500" strokeWidth={2} />
                    <span className="text-slate-800 text-sm font-semibold">Edit trip</span>
                  </button>
                  <div className="h-px bg-black/6 mx-3" />
                  <button
                    onClick={() => {
                      setConfirmDelete(true);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" strokeWidth={2} />
                    <span className="text-red-500 text-sm font-semibold">Delete trip</span>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Bottom sheet ── */}
      <motion.div
        drag="y"
        dragElastic={0.08}
        dragConstraints={{ top: 0, bottom: 0 }}
        onDrag={handleDrag}
        animate={{ height: SHEET_SNAPS[sheetState] }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        className={`absolute bottom-0 left-0 right-0 z-10 flex flex-col rounded-t-3xl shadow-2xl overflow-hidden ${
          isTrackEmpty ? 'bg-slate-900' : 'bg-white'
        }`}
        style={{ touchAction: 'none' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div
            className={`w-10 h-1 rounded-full ${isTrackEmpty ? 'bg-white/20' : 'bg-black/15'}`}
          />
        </div>

        {/* Sheet header row */}
        <div
          className={`flex items-center gap-3 px-4 pt-1 pb-4 shrink-0 border-b ${
            isTrackEmpty ? 'border-white/8' : 'border-black/6'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center shrink-0 shadow-md">
            <MapPin className="w-4 h-4 text-white" strokeWidth={2} />
          </div>

          <div className="flex-1">
            <p
              className={`font-bold text-sm ${isTrackEmpty ? 'text-white' : 'text-slate-900'}`}
            >
              Trip started
            </p>
            {startDateStr && (
              <p
                className={`text-xs mt-0.5 ${isTrackEmpty ? 'text-white/50' : 'text-slate-400'}`}
              >
                {startDateStr}
              </p>
            )}
          </div>

          {/* Never-ending pill */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${
              isTrackEmpty
                ? 'border-white/15 text-white/60'
                : 'border-black/12 text-slate-600'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" strokeWidth={2} />
            <span>Never-ending</span>
          </div>

          {/* Share */}
          <button
            className={`w-9 h-9 rounded-full border flex items-center justify-center ${
              isTrackEmpty
                ? 'border-white/15 text-white/60'
                : 'border-black/12 text-slate-500'
            }`}
          >
            <Share2 className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        {/* Scrollable content */}
        <div
          className="flex-1 min-h-0 overflow-y-auto"
          style={{ touchAction: 'pan-y pinch-zoom' }}
        >
          {isTrackEmpty ? (
            <TrackEmptyState onAdd={() => {}} />
          ) : trip.steps.length > 0 ? (
            <div className="px-4 pt-4 pb-32">
              {trip.steps.map((step, i) => (
                <StepRow key={step.id} step={step} index={i} />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="flex flex-col items-center py-10 px-6 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <MapPin className="w-7 h-7 text-slate-400" strokeWidth={1.5} />
              </div>
              <p className="text-slate-800 font-bold text-base mb-2">PLAN YOUR ADVENTURE NOW!</p>
              <p className="text-slate-400 text-sm leading-relaxed">
                Tap the <span className="font-bold text-slate-600">+</span> button to start
                building your itinerary.
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* ── Bottom bar: mode toggle + FAB ── */}
      <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-between px-6 pb-8 pt-4 pointer-events-none">
        {/* Mode toggle */}
        <div className="flex items-center bg-white/95 backdrop-blur-xl rounded-full p-1 pointer-events-auto border border-black/8 shadow-lg shadow-black/15">
          {(['plan', 'track'] as ActiveMode[]).map((mode) => {
            const isActive = activeMode === mode;
            return (
              <button
                key={mode}
                onClick={() => setActiveMode(mode)}
                className="relative px-5 py-1.5 rounded-full text-xs font-bold capitalize"
              >
                {isActive && (
                  <motion.div
                    layoutId="detail-mode-pill"
                    className="absolute inset-0 rounded-full bg-blue-500"
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  />
                )}
                <span
                  className={`relative z-10 flex items-center gap-1.5 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400'
                  }`}
                >
                  {mode}
                </span>
              </button>
            );
          })}
        </div>

        {/* FAB */}
        <div className="pointer-events-auto">
          {activeMode === 'plan' ? (
            <PlanFAB onAction={() => {}} />
          ) : (
            <motion.button
              whileTap={{ scale: 0.88 }}
              className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/40"
              onClick={() => {}}
            >
              <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
            </motion.button>
          )}
        </div>
      </div>

      {/* ── Delete confirm modal ── */}
      <AnimatePresence>
        {confirmDelete && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
              onClick={() => setConfirmDelete(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="fixed inset-x-6 top-1/2 -translate-y-1/2 z-[81] bg-white rounded-3xl p-6 shadow-2xl"
            >
              <button
                onClick={() => setConfirmDelete(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
              <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-red-500" strokeWidth={2} />
              </div>
              <h3 className="text-slate-900 font-bold text-lg mb-2">Delete trip?</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                &ldquo;{trip.name}&rdquo; will be permanently deleted. This cannot be undone.
              </p>
              <button
                onClick={() => {
                  onDelete(trip.id);
                  setConfirmDelete(false);
                }}
                className="w-full py-4 rounded-2xl bg-red-500 text-white font-bold text-sm mb-3 active:bg-red-600 transition-colors"
              >
                Yes, delete it
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="w-full py-4 rounded-2xl bg-slate-100 text-slate-700 font-semibold text-sm active:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
