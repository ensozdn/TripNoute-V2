'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Place } from '@/types';
import { Trip } from '@/types/trip';
import JourneyCreator from './creator/JourneyCreator';
import JourneyActionMenu from './JourneyActionMenu';
import JourneyCreationModal from './JourneyCreationModal';
import TrippoChat from '@/components/common/TrippoChat';
import { User, Users, Globe, Bell, Plus, TrendingUp, MapPin, MoreHorizontal, Pencil, Trash2, AlertTriangle, ChevronLeft } from 'lucide-react';
import { deduplicateCountries } from '@/utils/dataNormalizer';
type NavTab = 'me' | 'activity' | 'explore' | 'notifications';
type SheetState = 'peek' | 'middle' | 'full';

// Snap noktaları: ekranın ne kadarı görünür (0–1)
const SNAP_VISIBLE: Record<SheetState, number> = {
  peek:   0.20,  // handle + nav bar + biraz boşluk — kolayca yakalanabilir
  middle: 0.46,  // yarı açık
  full:   0.92,  // neredeyse tam ekran
};

interface JourneyHubProps {
  places: Place[];
  journeys?: Trip[];
  selectedPlaceId?: string | null;
  onPlaceSelect: (place: Place) => void;
  onPlaceDelete?: (placeId: string) => Promise<void>;
  onPlaceEdit?: (place: Place) => void;
  onJourneyCreated?: (journey: Trip) => void;
  onJourneySelect?: (journey: Trip) => void;
  onJourneyBack?: () => void;
  onJourneyDelete?: (journeyId: string) => Promise<void>;
  onJourneyUpdated?: (journey: Trip) => void;
  onRequestMapPin?: (onPinDropped: (name: string, lat: number, lng: number) => void) => void;
  mapPinMode?: boolean;
  userName?: string | null;
  userEmail?: string | null;
  userPhoto?: string | null;
  onLogout?: () => void;
  onAddPlace?: () => void;
  hidden?: boolean;
}

const NAV_ITEMS: { id: NavTab; label: string; icon: React.ReactNode }[] = [
  { id: 'me',            label: 'Me',            icon: <User className="w-5 h-5" /> },
  { id: 'activity',      label: 'Activity',      icon: <Users className="w-5 h-5" /> },
  { id: 'explore',       label: 'Explore',       icon: <Globe className="w-5 h-5" /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" /> },
];

export default function JourneyHub({
  places,
  journeys = [],
  selectedPlaceId,
  onPlaceSelect,
  onPlaceDelete,
  onPlaceEdit,
  onJourneyCreated,
  onJourneyUpdated,
  onJourneySelect,
  onJourneyBack,
  onJourneyDelete,
  onRequestMapPin,
  mapPinMode = false,
  userName,
  userPhoto,
  onAddPlace,
  hidden = false,
}: JourneyHubProps) {
  const [activeNav, setActiveNav] = useState<NavTab>('me');
  const [sheetState, setSheetState] = useState<SheetState>('middle');
  const [prevSheetState, setPrevSheetState] = useState<SheetState>('middle');
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [creationModalOpen, setCreationModalOpen] = useState(false);
  const [editingJourney, setEditingJourney] = useState<Trip | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [openPlaceMenuId, setOpenPlaceMenuId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);
  const [tripDeleteConfirm, setTripDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const sheetRef     = useRef<HTMLDivElement>(null);
  const dragStartY   = useRef(0);
  const dragStartTop = useRef(0);
  const isDragging   = useRef(false);
  const velY         = useRef(0);
  const lastY        = useRef(0);
  const lastT        = useRef(0);
  const stateRef     = useRef<SheetState>('middle'); // stale closure olmadan son state

  // translateY px: sheet height = 100dvh + 24px, visible kısmı = SNAP_VISIBLE oranı
  // inner white div 100dvh olduğundan hesap aynı — sadece 24px transparan üst kısım fark yaratır
  const snapPx = (s: SheetState) => window.innerHeight * (1 - SNAP_VISIBLE[s]);

  const setTY = (px: number, animate: boolean) => {
    const el = sheetRef.current;
    if (!el) return;
    el.style.transition = animate ? 'transform 0.42s cubic-bezier(0.32,0.72,0,1)' : 'none';
    el.style.transform  = `translateY(${Math.round(px)}px)`;
  };

  // Trip seçilince sheet peek'e iner (harita görünsün), kapanınca eski state'e döner
  useEffect(() => {
    if (selectedTrip) {
      setPrevSheetState(stateRef.current);
      setSheetState('peek');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTrip]);

  // State değişince sheet'i doğru px konumuna götür (CSS %'sini bypass et)
  useEffect(() => {
    stateRef.current = sheetState;
    if (!isDragging.current) setTY(snapPx(sheetState), true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetState]);

  // mapPinMode veya hidden değişince sheet'i gizle/göster
  useEffect(() => {
    if (mapPinMode || hidden) {
      setTY(window.innerHeight, true); // tamamen aşağı kaydir
    } else {
      setTY(snapPx(stateRef.current), true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapPinMode, hidden]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (mapPinMode) return;
    isDragging.current   = true;
    dragStartY.current   = e.clientY;
    dragStartTop.current = snapPx(stateRef.current);
    velY.current  = 0;
    lastY.current = e.clientY;
    lastT.current = Date.now();
    setTY(dragStartTop.current, false);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const now = Date.now();
    const dt  = now - lastT.current;
    if (dt > 0) velY.current = (e.clientY - lastY.current) / dt;
    lastY.current = e.clientY;
    lastT.current = now;

    const delta  = e.clientY - dragStartY.current;
    const minPx  = snapPx('full');
    const maxPx  = window.innerHeight * 0.93;
    const newPx  = Math.max(minPx, Math.min(maxPx, dragStartTop.current + delta));
    setTY(newPx, false);
  };

  const handlePointerUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const el = sheetRef.current;
    if (!el) return;

    const matrix    = new DOMMatrix(getComputedStyle(el).transform);
    const currentPx = matrix.m42;
    const vel       = velY.current;

    // Neredeyse hareket yoksa (tap) ve peek'teyse → middle'a çık
    const totalMove = Math.abs(currentPx - dragStartTop.current);
    if (totalMove < 8 && stateRef.current === 'peek') {
      setTY(snapPx('middle'), true);
      setTimeout(() => setSheetState('middle'), 50);
      return;
    }

    let next: SheetState;
    if (vel > 0.5) {
      next = stateRef.current === 'full' ? 'middle' : 'peek';
    } else if (vel < -0.5) {
      next = stateRef.current === 'peek' ? 'middle' : 'full';
    } else {
      const states: SheetState[] = ['peek', 'middle', 'full'];
      next = states.reduce((best, s) =>
        Math.abs(snapPx(s) - currentPx) < Math.abs(snapPx(best) - currentPx) ? s : best
      , states[0]);
    }

    setTY(snapPx(next), true);
    setTimeout(() => setSheetState(next), 50);
  };

  const countriesCount = useMemo(() => {
    const countryMap = deduplicateCountries(places);
    return countryMap.size;
  }, [places]);

  const closeTripView = () => {
    setSelectedTrip(null);
    setSheetState(prevSheetState);
    onJourneyBack?.();
  };

  return (
    <>
      {/* Bottom Sheet — dış wrapper transparan, rounded köşeler sadece inner white div'de */}
      {/* Yükseklik 100dvh + 24px (rounded-t-3xl radius): sheet tam yukarı çekilse bile
          üst köşeler harita üzerinde float eder, status bar bölgesi beyaz kalmaz. */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-40"
        style={{
          height: 'calc(100dvh + 24px)',
          willChange: 'transform',
          pointerEvents: (mapPinMode || hidden) ? 'none' : undefined,
        }}
      >
        {/* Inner white surface — yükseklik 100dvh ile sınırlı, ekstra 24px transparan kalır */}
        <div className="flex flex-col rounded-t-3xl border-t border-black/8 shadow-2xl shadow-black/20"
          style={{
            height: '100dvh',
            backgroundColor: 'rgba(255,255,255,0.97)',
            backdropFilter: 'blur(32px) saturate(180%)',
            WebkitBackdropFilter: 'blur(32px) saturate(180%)',
          }}
        >
        {/* Handle — tüm sheet'ten sürüklenebilir, sadece scroll alanı hariç */}
        <div
          className="flex justify-center pt-2.5 pb-3 shrink-0 cursor-grab active:cursor-grabbing select-none"
          style={{ touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div className="w-10 h-1 rounded-full bg-black/20" />
        </div>

        {/* Scrollable content */}
        <div
          className="flex-1 min-h-0 overflow-y-auto"
          style={{ touchAction: 'pan-y pinch-zoom' }}
        >
          <AnimatePresence mode="wait">
            {selectedTrip ? (
              /* ── Trip Detail View (inline, harita görünür kalır) ── */
              <motion.div
                key="trip-detail"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.22 } }}
                exit={{ opacity: 0, y: 16, transition: { duration: 0.18 } }}
                className="px-4 pb-32 pt-3"
              >
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <button
                    onClick={closeTripView}
                    className="w-9 h-9 rounded-xl bg-black/6 flex items-center justify-center active:scale-90 transition-transform shrink-0"
                  >
                    <ChevronLeft className="w-5 h-5 text-slate-700" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-slate-900 text-lg font-bold truncate">{selectedTrip.name}</h2>
                    <p className="text-slate-400 text-xs">{selectedTrip.steps.length} stops</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingJourney(selectedTrip);
                      setCreatorOpen(true);
                    }}
                    className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center active:scale-90 transition-transform shrink-0"
                  >
                    <Pencil className="w-4 h-4 text-blue-500" />
                  </button>
                  <button
                    onClick={() => {
                      setTripDeleteConfirm({ id: selectedTrip.id, name: selectedTrip.name });
                    }}
                    className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center active:scale-90 transition-transform shrink-0"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>

                {/* Trip color banner */}
                <div
                  className="w-full rounded-2xl mb-4 flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${selectedTrip.color ?? '#1e3a5f'}dd, ${selectedTrip.color ?? '#1e3a5f'}88)`,
                    height: 72,
                  }}
                >
                  <p className="text-white text-2xl font-bold opacity-80">{selectedTrip.name}</p>
                </div>

                {/* Stats row */}
                <div className="flex gap-2 mb-5">
                  <div className="flex-1 bg-black/[0.03] rounded-2xl px-3 py-2.5 text-center">
                    <p className="text-slate-900 text-lg font-bold">{selectedTrip.steps.length}</p>
                    <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wide mt-0.5">Stops</p>
                  </div>
                  {selectedTrip.steps?.[0]?.timestamp && (
                    <div className="flex-1 bg-black/[0.03] rounded-2xl px-3 py-2.5 text-center">
                      <p className="text-slate-900 text-lg font-bold">
                        {new Date(selectedTrip.steps[0].timestamp).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wide mt-0.5">Started</p>
                    </div>
                  )}
                  {selectedTrip.steps?.length >= 2 &&
                    selectedTrip.steps[0]?.timestamp &&
                    selectedTrip.steps[selectedTrip.steps.length - 1]?.timestamp && (
                    <div className="flex-1 bg-black/[0.03] rounded-2xl px-3 py-2.5 text-center">
                      <p className="text-slate-900 text-lg font-bold">
                        {Math.max(1, Math.round(
                          (selectedTrip.steps[selectedTrip.steps.length - 1].timestamp - selectedTrip.steps[0].timestamp)
                          / (1000 * 60 * 60 * 24)
                        ))}
                      </p>
                      <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wide mt-0.5">Days</p>
                    </div>
                  )}
                </div>

                {/* Steps list */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 rounded-full bg-blue-500" />
                    <h3 className="text-slate-900 text-sm font-bold">Route</h3>
                  </div>
                </div>
                {selectedTrip.steps.length === 0 ? (
                  <button
                    onClick={() => {
                      setEditingJourney(selectedTrip);
                      setCreatorOpen(true);
                    }}
                    className="w-full flex flex-col items-center py-8 px-4 rounded-2xl border-2 border-dashed border-black/10 hover:border-blue-400/50 hover:bg-blue-50/40 transition-colors text-center"
                  >
                    <MapPin className="w-8 h-8 text-blue-300 mb-2" strokeWidth={1.5} />
                    <p className="text-slate-600 text-sm font-semibold mb-0.5">No route yet</p>
                    <p className="text-slate-400 text-xs">Tap to add waypoints and build your route</p>
                  </button>
                ) : (
                <div className="space-y-2">
                  {selectedTrip.steps.map((step, i) => (
                    <div
                      key={step.id ?? i}
                      className="flex items-center gap-3 bg-black/[0.025] rounded-2xl px-4 py-3"
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
                        style={{ backgroundColor: selectedTrip.color ?? '#1e3a5f' }}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-900 text-sm font-semibold truncate">{step.name}</p>
                        {step.timestamp && (
                          <p className="text-slate-400 text-xs mt-0.5">
                            {new Date(step.timestamp).toLocaleDateString('en-US', {
                              weekday: 'short', day: 'numeric', month: 'short'
                            })}
                          </p>
                        )}
                      </div>
                      {i < selectedTrip.steps.length - 1 && (
                        <div className="text-slate-300 text-xs">→</div>
                      )}
                    </div>
                  ))}
                </div>
                )}
              </motion.div>
            ) : (
            <motion.div
              key={activeNav}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.2 } }}
              exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
              className="px-4 pb-32"
            >
              {activeNav === 'me' && (
                <div className="pt-4 pb-8">
                  {/* Profile row */}
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-200 shrink-0 ring-2 ring-black/8">
                      {userPhoto ? (
                        <img src={userPhoto} alt={userName ?? 'Traveler'} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                          <span className="text-white text-2xl font-bold">
                            {(userName ?? 'T').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h2 className="text-slate-900 text-xl font-bold leading-tight">{userName ?? 'Traveler'}</h2>
                      <p className="text-slate-400 text-sm mt-0.5">Traveler</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center mb-5">
                    <div className="flex-1 flex flex-col items-start">
                      <span className="text-slate-900 text-xl font-bold">{countriesCount}</span>
                      <span className="text-slate-400 text-xs mt-0.5">Countries</span>
                    </div>
                    <div className="w-px h-8 bg-black/10" />
                    <div className="flex-1 flex flex-col items-center">
                      <span className="text-slate-900 text-xl font-bold">{places.length}</span>
                      <span className="text-slate-400 text-xs mt-0.5">Places</span>
                    </div>
                    <div className="w-px h-8 bg-black/10" />
                    <div className="flex-1 flex flex-col items-end">
                      <span className="text-slate-900 text-xl font-bold">{journeys.length}</span>
                      <span className="text-slate-400 text-xs mt-0.5">Trips</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 mb-6">
                    <button
                      onClick={() => setCreationModalOpen(true)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-blue-500 active:scale-95 transition-all"
                    >
                      <Plus className="w-4 h-4 text-white" strokeWidth={2.5} />
                      <span className="text-white text-sm font-semibold">Add trip</span>
                    </button>
                    <button
                      onClick={onAddPlace ?? (() => {})}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-black/15 active:scale-95 transition-all"
                    >
                      <TrendingUp className="w-4 h-4 text-slate-700" strokeWidth={2} />
                      <span className="text-slate-700 text-sm font-semibold">Add place</span>
                    </button>
                  </div>

                  {/* ── Journey cards ── */}
                  {journeys.length > 0 ? (
                    <div className="space-y-3 mb-6">
                      {journeys.map((journey, index) => (
                        <motion.div
                          key={journey.id}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.06 }}
                          className="relative w-full rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
                          style={{ minHeight: 180 }}
                          onClick={() => {
                            setSelectedTrip(journey);
                            onJourneySelect?.(journey);
                          }}
                        >
                          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${journey.color ?? '#1e3a5f'}cc, ${journey.color ?? '#1e3a5f'}55)`, backgroundColor: '#1e3a5f' }} />
                          <div className="absolute inset-0 bg-black/30" />
                          <div className="absolute top-3 left-3">
                            <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
                              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                              <span className="text-white text-[10px] font-bold tracking-widest uppercase">Now Traveling</span>
                            </div>
                          </div>
                          <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                            <MoreHorizontal className="w-4 h-4 text-white" />
                          </div>
                          <div className="relative z-10 p-4 pt-12 flex flex-col justify-end" style={{ minHeight: 180 }}>
                            <h3 className="text-white text-2xl font-bold mb-3 leading-tight">{journey.name}</h3>
                            <div className="flex items-end justify-between">
                              <div className="flex items-center gap-6">
                                {journey.steps?.[0]?.timestamp && (
                                  <>
                                    <div>
                                      <p className="text-white text-lg font-bold leading-none">{new Date(journey.steps[0].timestamp).getFullYear()}</p>
                                      <p className="text-white/60 text-[10px] font-semibold tracking-wider uppercase mt-0.5">
                                        {new Date(journey.steps[0].timestamp).toLocaleDateString('en-US', { month: 'long' }).toUpperCase()}
                                      </p>
                                    </div>
                                    {journey.steps?.[journey.steps.length - 1]?.timestamp && (
                                      <div>
                                        <p className="text-white text-lg font-bold leading-none">
                                          {Math.max(1, Math.round((journey.steps[journey.steps.length - 1].timestamp - journey.steps[0].timestamp) / (1000 * 60 * 60 * 24)))}
                                        </p>
                                        <p className="text-white/60 text-[10px] font-semibold tracking-wider uppercase mt-0.5">Days</p>
                                      </div>
                                    )}
                                  </>
                                )}
                                {journey.steps?.length > 0 && (
                                  <div>
                                    <p className="text-white text-lg font-bold leading-none">{journey.steps.length}</p>
                                    <p className="text-white/60 text-[10px] font-semibold tracking-wider uppercase mt-0.5">Stops</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
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
                        onClick={() => setCreationModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-blue-500 active:scale-95 transition-all shadow-lg shadow-blue-500/25"
                      >
                        <Plus className="w-5 h-5 text-white" strokeWidth={2.5} />
                        <span className="text-white text-base font-semibold">Add your first trip</span>
                      </button>
                    </motion.div>
                  )}

                  {/* ── Place cards ── */}
                  {places.length > 0 && (
                    <>
                      {/* Section header */}
                      <div className="flex items-center justify-between mb-4 mt-2">
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-4 rounded-full bg-blue-500" />
                          <h3 className="text-slate-900 text-sm font-bold tracking-tight">My Places</h3>
                        </div>
                        <span className="text-[11px] text-blue-500 font-semibold bg-blue-50 px-2.5 py-1 rounded-full">
                          {places.length} saved
                        </span>
                      </div>

                      <div className="space-y-3">
                        {places.map((place, index) => {
                          const isMenuOpen = openPlaceMenuId === place.id;
                          const isSelected = selectedPlaceId === place.id;
                          const coverPhoto = place.photos?.[0]?.url ?? null;
                          const visitDate = place.visitDate
                            ? new Date(
                                typeof place.visitDate === 'object' && 'seconds' in place.visitDate
                                  ? (place.visitDate as { seconds: number }).seconds * 1000
                                  : place.visitDate
                              ).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                            : null;

                          // Pick a color accent per index for no-photo cards
                          const accents = [
                            { bg: 'bg-blue-500',   light: 'bg-blue-50'   },
                            { bg: 'bg-violet-500', light: 'bg-violet-50' },
                            { bg: 'bg-emerald-500',light: 'bg-emerald-50'},
                            { bg: 'bg-amber-500',  light: 'bg-amber-50'  },
                            { bg: 'bg-rose-500',   light: 'bg-rose-50'   },
                            { bg: 'bg-cyan-500',   light: 'bg-cyan-50'   },
                          ];
                          const accent = accents[index % accents.length];

                          return (
                            /* Outer wrapper: overflow-visible so dropdown escapes the card */
                            <motion.div
                              key={place.id}
                              initial={{ opacity: 0, y: 14 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.28, delay: index * 0.05 }}
                              className="relative"
                            >
                              {/* Card itself: overflow-hidden for rounded corners + photo crop */}
                              <div
                                className={`relative rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform
                                  ${isSelected
                                    ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/15'
                                    : 'shadow-sm shadow-black/8'
                                  }`}
                                onClick={() => {
                                  if (isMenuOpen) setOpenPlaceMenuId(null);
                                  else onPlaceSelect(place);
                                }}
                              >
                                {/* Card body */}
                                <div className="flex gap-0 bg-white">

                                  {/* Left accent strip / photo */}
                                  {coverPhoto ? (
                                    <div className="w-20 h-20 shrink-0 relative">
                                      <img
                                        src={coverPhoto}
                                        alt={place.title}
                                        className="w-full h-full object-cover"
                                      />
                                      <div className="absolute inset-0 bg-gradient-to-r from-black/5 to-transparent" />
                                    </div>
                                  ) : (
                                    <div className={`w-3 shrink-0 ${accent.bg}`} />
                                  )}

                                  {/* Content */}
                                  <div className="flex-1 min-w-0 px-3.5 py-3">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <p className="text-slate-900 text-sm font-bold truncate leading-snug">
                                          {place.title}
                                        </p>
                                        <div className="flex items-center gap-1 mt-1">
                                          <MapPin className="w-3 h-3 shrink-0 text-slate-300" />
                                          <p className="text-slate-400 text-xs truncate">
                                            {[place.address?.city, place.address?.country].filter(Boolean).join(', ') || 'Location saved'}
                                          </p>
                                        </div>
                                      </div>

                                      {/* Menu button */}
                                      <button
                                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-black/6 active:bg-black/10 transition-colors shrink-0 mt-0.5"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setOpenPlaceMenuId(isMenuOpen ? null : place.id);
                                        }}
                                      >
                                        <MoreHorizontal className="w-4 h-4 text-slate-400" />
                                      </button>
                                    </div>

                                    {/* Bottom row: date badge */}
                                    {visitDate && (
                                      <div className="flex items-center gap-1.5 mt-2">
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${accent.light} ${
                                          accent.bg.replace('bg-', 'text-')
                                        }`}>
                                          {visitDate}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>{/* end card */}

                              {/* Dropdown menu — outside overflow-hidden card */}
                              <AnimatePresence>
                                {isMenuOpen && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.92, y: -4 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.92, y: -4 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 top-2 z-50 bg-white rounded-2xl shadow-xl shadow-black/15 border border-black/8 overflow-hidden min-w-[160px]"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 text-sm font-medium hover:bg-black/5 active:bg-black/8 transition-colors"
                                      onClick={() => {
                                        setOpenPlaceMenuId(null);
                                        onPlaceEdit?.(place);
                                      }}
                                    >
                                      <Pencil className="w-4 h-4 text-slate-400" />
                                      Edit
                                    </button>
                                    <div className="h-px bg-black/6 mx-3" />
                                    <button
                                      className="w-full flex items-center gap-3 px-4 py-3 text-red-500 text-sm font-medium hover:bg-red-50 active:bg-red-100 transition-colors"
                                      onClick={() => {
                                        setOpenPlaceMenuId(null);
                                        setDeleteConfirm({ id: place.id, title: place.title });
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4 text-red-400" />
                                      Delete
                                    </button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          );
                        })}
                      </div>
                    </>
                  )}

                </div>
              )}
              {activeNav === 'activity' && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Users className="w-12 h-12 text-slate-200 mb-3" strokeWidth={1.5} />
                  <p className="text-slate-400 text-sm">Activity coming soon</p>
                </div>
              )}
              {activeNav === 'explore' && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Globe className="w-12 h-12 text-slate-200 mb-3" strokeWidth={1.5} />
                  <p className="text-slate-400 text-sm">Explore coming soon</p>
                </div>
              )}
              {activeNav === 'notifications' && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Bell className="w-12 h-12 text-slate-200 mb-3" strokeWidth={1.5} />
                  <p className="text-slate-400 text-sm">No notifications yet</p>
                </div>
              )}
            </motion.div>
            )} {/* end selectedTrip ternary */}
          </AnimatePresence>
        </div>
        </div>{/* /inner white surface */}
      </div>

      {/* Floating bottom UI — mode toggle + nav + FAB */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center gap-2 pb-5 pt-2 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(255,255,255,0.08) 0%, transparent 100%)',
          display: hidden ? 'none' : undefined,
        }}
      >
        {/* ── Nav pill + FAB row ── */}
        <div className="flex items-center justify-center gap-3 w-full px-4 pr-4">
          {/* Nav pill */}
          <div className="flex items-center bg-white/95 backdrop-blur-xl rounded-full shadow-2xl shadow-black/15 border border-black/6 pointer-events-auto">
            {NAV_ITEMS.map((item) => {
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (activeNav === item.id) {
                      setSheetState(sheetState === 'peek' ? 'middle' : 'peek');
                    } else {
                      setActiveNav(item.id);
                      if (sheetState === 'peek') setSheetState('middle');
                    }
                  }}
                  className="relative flex flex-col items-center gap-0.5 px-5 py-3 transition-all duration-200"
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-active-bg"
                      className="absolute inset-1 rounded-full bg-slate-100"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className={`relative z-10 transition-colors duration-200 ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                    {item.icon}
                  </span>
                  <span className={`relative z-10 text-[10px] font-semibold transition-colors duration-200 ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Dynamic Action FAB */}
          <div className="pointer-events-auto">
            <JourneyActionMenu
              activeMode="plan"
              onCreateItinerary={() => setCreationModalOpen(true)}
              onAddSpot={onAddPlace}
              onAddStay={() => setCreationModalOpen(true)}
              onAddDestination={() => setCreationModalOpen(true)}
              onAddFirstStep={() => setCreationModalOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* Journey Creation Modal (4-step) */}
      <JourneyCreationModal
        isOpen={creationModalOpen}
        onClose={() => setCreationModalOpen(false)}
        onCreated={(trip) => {
          setCreationModalOpen(false);
          onJourneyCreated?.(trip);
          // Immediately open waypoint editor so user can add route stops
          setEditingJourney(trip);
          setCreatorOpen(true);
        }}
      />

      {/* ── Delete confirmation modal ── */}
      <AnimatePresence>
        {deleteConfirm && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm"
              onClick={() => setDeleteConfirm(null)}
            />
            {/* Modal card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="fixed z-[71] left-4 right-4 bottom-8 bg-white rounded-3xl shadow-2xl shadow-black/25 overflow-hidden"
              style={{ maxWidth: 400, margin: '0 auto' }}
            >
              <div className="p-6">
                <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4 mx-auto">
                  <AlertTriangle className="w-7 h-7 text-red-500" strokeWidth={1.5} />
                </div>
                <h3 className="text-slate-900 text-lg font-bold text-center mb-1.5">Delete place?</h3>
                <p className="text-slate-400 text-sm text-center leading-relaxed mb-6">
                  <span className="font-semibold text-slate-600">{deleteConfirm.title}</span> will be permanently removed from your map.
                </p>
                <div className="flex gap-3">
                  <button
                    className="flex-1 py-3.5 rounded-2xl border border-black/12 text-slate-700 text-sm font-semibold active:scale-95 transition-all"
                    onClick={() => setDeleteConfirm(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-1 py-3.5 rounded-2xl bg-red-500 text-white text-sm font-semibold active:scale-95 transition-all shadow-lg shadow-red-500/25"
                    onClick={async () => {
                      const { id } = deleteConfirm;
                      setDeleteConfirm(null);
                      await onPlaceDelete?.(id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Trip delete confirmation modal ── */}
      <AnimatePresence>
        {tripDeleteConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm"
              onClick={() => setTripDeleteConfirm(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="fixed z-[71] left-4 right-4 bottom-8 bg-white rounded-3xl shadow-2xl shadow-black/25 overflow-hidden"
              style={{ maxWidth: 400, margin: '0 auto' }}
            >
              <div className="p-6">
                <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4 mx-auto">
                  <AlertTriangle className="w-7 h-7 text-red-500" strokeWidth={1.5} />
                </div>
                <h3 className="text-slate-900 text-lg font-bold text-center mb-1.5">Delete trip?</h3>
                <p className="text-slate-400 text-sm text-center leading-relaxed mb-6">
                  <span className="font-semibold text-slate-600">{tripDeleteConfirm.name}</span> will be permanently removed from your map.
                </p>
                <div className="flex gap-3">
                  <button
                    className="flex-1 py-3.5 rounded-2xl border border-black/12 text-slate-700 text-sm font-semibold active:scale-95 transition-all"
                    onClick={() => setTripDeleteConfirm(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-1 py-3.5 rounded-2xl bg-red-500 text-white text-sm font-semibold active:scale-95 transition-all shadow-lg shadow-red-500/25"
                    onClick={() => {
                      const { id } = tripDeleteConfirm;
                      setTripDeleteConfirm(null);
                      onJourneyDelete?.(id);
                      closeTripView();
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Journey Creator — waypoint editor (editing existing trips) */}
      {onRequestMapPin && (
        <JourneyCreator
          isOpen={creatorOpen}
          places={places}
          editingJourney={editingJourney}
          onClose={() => {
            setCreatorOpen(false);
            setEditingJourney(null);
          }}
          onCreated={(journey) => {
            setCreatorOpen(false);
            setEditingJourney(null);
            onJourneyCreated?.(journey);
          }}
          onUpdated={(journey) => {
            setCreatorOpen(false);
            setEditingJourney(null);
            // Update the selected trip so detail view shows new route immediately
            if (selectedTrip?.id === journey.id) {
              setSelectedTrip(journey);
              onJourneySelect?.(journey);
            }
            onJourneyUpdated?.(journey);
          }}
          onRequestMapPin={onRequestMapPin}
        />
      )}

      {/* Trippo Chat — standalone FAB, bottom sheet arkasında kalır (z-30) */}
      {!hidden && (
        <TrippoChat
          context={
            journeys.length > 0
              ? `Kullanıcının ${journeys.length} journey'si var. En son: ${journeys[journeys.length - 1]?.name ?? ''}`
              : undefined
          }
        />
      )}
    </>
  );
}
