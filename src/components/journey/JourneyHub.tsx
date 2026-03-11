'use client';

import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Place } from '@/types';
import { Trip } from '@/types/trip';
import JourneyCreator from './creator/JourneyCreator';
import JourneyActionMenu from './JourneyActionMenu';
import JourneyCreationModal from './JourneyCreationModal';
import TripDetailView from './TripDetailView';
import TrippoChat from '@/components/common/TrippoChat';
import { User, Users, Globe, Bell, Plus, TrendingUp, MapPin, MoreHorizontal } from 'lucide-react';
import { deduplicateCountries } from '@/utils/dataNormalizer';

type NavTab = 'me' | 'activity' | 'explore' | 'notifications';
type SheetState = 'peek' | 'middle' | 'full';
type ActiveMode = 'plan' | 'track';

const SNAP_POINTS: Record<SheetState, number> = {
  peek:   0.10,  // sadece handle + tab bar görünür
  middle: 0.44,  // yarı açık
  full:   0.82,  // neredeyse tam ekran, status bar görünür
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
  onJourneyCreated,
  onJourneyUpdated,
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
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [creationModalOpen, setCreationModalOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<ActiveMode>('plan');
  const [editingJourney, setEditingJourney] = useState<Trip | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number>(0);
  const dragStartH = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const velocityRef = useRef<number>(0);
  const lastYRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (mapPinMode) return;
    const vh = window.innerHeight;
    dragStartY.current = e.clientY;
    dragStartH.current = SNAP_POINTS[sheetState] * vh;
    lastYRef.current = e.clientY;
    lastTimeRef.current = Date.now();
    velocityRef.current = 0;
    isDraggingRef.current = true;
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'none';
      sheetRef.current.style.height = dragStartH.current + 'px';
    }
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !sheetRef.current) return;
    const now = Date.now();
    const dt = now - lastTimeRef.current;
    if (dt > 0) {
      velocityRef.current = (lastYRef.current - e.clientY) / dt; // px/ms, pozitif = yukarı
    }
    lastYRef.current = e.clientY;
    lastTimeRef.current = now;

    const delta = dragStartY.current - e.clientY; // yukarı = pozitif
    const vh = window.innerHeight;
    const newH = Math.max(60, Math.min(vh * 0.97, dragStartH.current + delta));
    sheetRef.current.style.height = newH + 'px';
  };

  const handlePointerUp = () => {
    if (!isDraggingRef.current || !sheetRef.current) return;
    isDraggingRef.current = false;

    const vh = window.innerHeight;
    const currentH = parseFloat(sheetRef.current.style.height) || dragStartH.current;
    const currentRatio = currentH / vh;
    const velocity = velocityRef.current; // px/ms

    // Snap noktaları
    const snapValues = [
      { state: 'peek'   as SheetState, ratio: SNAP_POINTS.peek   },
      { state: 'middle' as SheetState, ratio: SNAP_POINTS.middle },
      { state: 'full'   as SheetState, ratio: SNAP_POINTS.full   },
    ];

    let next: SheetState;

    // Hız bazlı snap (swipe)
    if (velocity > 0.5) {
      // Hızlı yukarı swipe
      next = sheetState === 'middle' ? 'full' : 'full';
    } else if (velocity < -0.5) {
      // Hızlı aşağı swipe
      next = sheetState === 'full' ? 'middle' : 'peek';
    } else {
      // Pozisyon bazlı snap — en yakın noktaya git
      const midToFull = (SNAP_POINTS.middle + SNAP_POINTS.full) / 2;
      const peekToMid = (SNAP_POINTS.peek + SNAP_POINTS.middle) / 2;
      if (currentRatio >= midToFull) next = 'full';
      else if (currentRatio >= peekToMid) next = 'middle';
      else next = 'peek';
    }

    // Hedef yükseklik ve transform
    const targetH = snapValues.find(s => s.state === next)!.ratio * vh;
    const targetTransform = 'translateY(0%)';

    sheetRef.current.style.transition = 'transform 0.38s cubic-bezier(0.32,0.72,0,1), height 0.38s cubic-bezier(0.32,0.72,0,1)';
    sheetRef.current.style.height = targetH + 'px';
    sheetRef.current.style.transform = targetTransform;

    setTimeout(() => {
      if (sheetRef.current) {
        sheetRef.current.style.height = '';
        sheetRef.current.style.transform = '';
        sheetRef.current.style.transition = '';
      }
      setSheetState(next);
    }, 400);
  };

  const countriesCount = useMemo(() => {
    const countryMap = deduplicateCountries(places);
    return countryMap.size;
  }, [places]);

  return (
    <>
      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-40 flex flex-col rounded-t-3xl bg-white border-t border-black/8 shadow-2xl shadow-black/20"
        style={{
          height: `${SNAP_POINTS[sheetState] * 100}vh`,
          transform: (mapPinMode || hidden) ? 'translateY(100%)' : 'translateY(0%)',
          transition: 'transform 0.42s cubic-bezier(0.32,0.72,0,1), height 0.42s cubic-bezier(0.32,0.72,0,1)',
          pointerEvents: (mapPinMode || hidden) ? 'none' : undefined,
        }}
      >
        {/* Handle — drag sadece buradan */}
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
                      <span className="text-slate-900 text-xl font-bold">0</span>
                      <span className="text-slate-400 text-xs mt-0.5">Followers</span>
                    </div>
                    <div className="w-px h-8 bg-black/10" />
                    <div className="flex-1 flex flex-col items-end">
                      <span className="text-slate-900 text-xl font-bold">0</span>
                      <span className="text-slate-400 text-xs mt-0.5">Following</span>
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

                  {/* Journey cards */}
                  {journeys.length > 0 ? (
                    <div className="space-y-3 mb-4">
                      {journeys.map((journey, index) => (
                        <motion.div
                          key={journey.id}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.06 }}
                          className="relative w-full rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
                          style={{ minHeight: 180 }}
                          onClick={() => setSelectedTrip(journey)}
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
          </AnimatePresence>
        </div>
      </div>

      {/* Floating bottom UI — mode toggle + nav + FAB */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center gap-2 pb-5 pt-2 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(255,255,255,0.08) 0%, transparent 100%)',
          display: hidden ? 'none' : undefined,
        }}
      >
        {/* ── Mode Switcher ── */}
        <div className="flex items-center bg-white/95 backdrop-blur-xl rounded-full shadow-lg shadow-black/10 border border-black/6 p-1 pointer-events-auto">
          {(['plan', 'track'] as ActiveMode[]).map((mode) => {
            const isActive = activeMode === mode;
            return (
              <button
                key={mode}
                onClick={() => setActiveMode(mode)}
                className="relative px-5 py-1.5 rounded-full text-xs font-bold capitalize transition-colors"
              >
                {isActive && (
                  <motion.div
                    layoutId="mode-pill"
                    className="absolute inset-0 rounded-full bg-blue-500"
                    transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                  />
                )}
                <span
                  className={`relative z-10 transition-colors ${isActive ? 'text-white' : 'text-slate-400'}`}
                >
                  {mode}
                </span>
              </button>
            );
          })}
        </div>

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
              activeMode={activeMode}
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
        }}
      />

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

      {/* Trip Detail View — full screen */}
      <AnimatePresence>
        {selectedTrip && (
          <TripDetailView
            trip={selectedTrip}
            userName={userName ?? ''}
            userPhoto={userPhoto ?? undefined}
            onBack={() => setSelectedTrip(null)}
            onEdit={(trip) => {
              setSelectedTrip(null);
              setEditingJourney(trip);
              setCreatorOpen(true);
            }}
            onDelete={(tripId) => {
              onJourneyDelete?.(tripId);
              setSelectedTrip(null);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
