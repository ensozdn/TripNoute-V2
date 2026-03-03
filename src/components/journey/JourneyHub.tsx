'use client';

import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Place } from '@/types';
import { Trip } from '@/types/trip';
import MeTab from './tabs/MeTab';
import JourneyCreator from './creator/JourneyCreator';
import JourneyActionMenu from './JourneyActionMenu';
import JourneyCreationModal from './JourneyCreationModal';
import TripDetailView from './TripDetailView';
import TrippoChat from '@/components/common/TrippoChat';
import { User, Users, Globe, Bell } from 'lucide-react';
import { deduplicateCountries } from '@/utils/dataNormalizer';

type NavTab = 'me' | 'activity' | 'explore' | 'notifications';
type SheetState = 'closed' | 'middle' | 'full';
type ActiveMode = 'plan' | 'track';

const SNAP_POINTS: Record<SheetState, number> = {
  closed: 0.0,
  middle: 0.42,
  full: 0.95,
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
  const isDraggingRef = useRef<boolean>(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (mapPinMode) return;
    dragStartY.current = e.clientY;
    isDraggingRef.current = true;
    if (sheetRef.current) {
      // transition'ı kapat, anlık drag başlasın
      sheetRef.current.style.transition = 'none';
    }
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !sheetRef.current || sheetState === 'closed') return;
    const delta = e.clientY - dragStartY.current;
    const vh = window.innerHeight;
    const currentH = SNAP_POINTS[sheetState] * vh;
    const newH = Math.max(60, Math.min(vh * 0.97, currentH - delta));
    sheetRef.current.style.height = newH + 'px';
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !sheetRef.current) return;
    isDraggingRef.current = false;
    const delta = e.clientY - dragStartY.current;

    // hedef state hesapla
    let next: SheetState = sheetState;
    if (delta < -60) {
      if (sheetState === 'closed') next = 'middle';
      else if (sheetState === 'middle') next = 'full';
    } else if (delta > 60) {
      if (sheetState === 'full') next = 'middle';
      else if (sheetState === 'middle') next = 'closed';
    }

    const vh = window.innerHeight;
    const targetH = SNAP_POINTS[next === 'closed' ? 'middle' : next] * vh;
    const targetTransform = next === 'closed' ? 'translateY(100%)' : 'translateY(0%)';

    // önce hedef px'e transition ile git
    sheetRef.current.style.transition = 'transform 0.42s cubic-bezier(0.32,0.72,0,1), height 0.42s cubic-bezier(0.32,0.72,0,1)';
    sheetRef.current.style.height = targetH + 'px';
    sheetRef.current.style.transform = targetTransform;

    // animasyon bitince inline style'ları temizle, React state'e bırak
    setTimeout(() => {
      if (sheetRef.current) {
        sheetRef.current.style.height = '';
        sheetRef.current.style.transform = '';
        sheetRef.current.style.transition = '';
      }
      setSheetState(next);
    }, 440);
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
          height: `${SNAP_POINTS[sheetState === 'closed' ? 'middle' : sheetState] * 100}vh`,
          transform: (mapPinMode || sheetState === 'closed') ? 'translateY(100%)' : 'translateY(0%)',
          transition: 'transform 0.42s cubic-bezier(0.32,0.72,0,1), height 0.42s cubic-bezier(0.32,0.72,0,1)',
          pointerEvents: (mapPinMode || sheetState === 'closed') ? 'none' : undefined,
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
                <MeTab
                  userName={userName}
                  userPhoto={userPhoto}
                  countriesCount={countriesCount}
                  journeys={journeys}
                  onAddTrip={() => setCreationModalOpen(true)}
                  onAddPlace={onAddPlace ?? (() => {})}
                  onOpenJourneyMenu={(j) => setSelectedTrip(j)}
                />
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
                      setSheetState(sheetState === 'closed' ? 'middle' : 'closed');
                    } else {
                      setActiveNav(item.id);
                      if (sheetState === 'closed') setSheetState('middle');
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

      {/* Trippo Chat — standalone FAB, kendi state'ini yönetir */}
      <TrippoChat
        context={
          journeys.length > 0
            ? `Kullanıcının ${journeys.length} journey'si var. En son: ${journeys[journeys.length - 1]?.name ?? ''}`
            : undefined
        }
      />

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
