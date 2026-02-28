'use client';

import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Place } from '@/types';
import { Trip } from '@/types/trip';
import MeTab from './tabs/MeTab';
import JourneyCreator from './creator/JourneyCreator';
import { User, Users, Globe, Bell, Search } from 'lucide-react';
import { deduplicateCountries } from '@/utils/dataNormalizer';

type NavTab = 'me' | 'activity' | 'explore' | 'notifications';
type SheetState = 'closed' | 'middle' | 'full';

const SNAP_POINTS: Record<SheetState, number> = {
  closed: 0.08,
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
  onRequestMapPin,
  mapPinMode = false,
  userName,
  userPhoto,
  onAddPlace,
}: JourneyHubProps) {
  const [activeNav, setActiveNav] = useState<NavTab>('me');
  const [sheetState, setSheetState] = useState<SheetState>('middle');
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [editingJourney, setEditingJourney] = useState<Trip | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const countriesCount = useMemo(() => {
    const countryMap = deduplicateCountries(places);
    return countryMap.size;
  }, [places]);

  const handleDrag = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { y: number }; velocity: { y: number } }
  ) => {
    const viewportHeight = window.innerHeight;
    const currentHeight = SNAP_POINTS[sheetState] * viewportHeight;
    const newHeight = currentHeight - info.offset.y;
    const newHeightRatio = newHeight / viewportHeight;

    let nextState: SheetState = sheetState;

    if (info.velocity.y < -300) {
      if (sheetState === 'closed') nextState = 'middle';
      else if (sheetState === 'middle') nextState = 'full';
    } else if (info.velocity.y > 300) {
      if (sheetState === 'full') nextState = 'middle';
      else if (sheetState === 'middle') nextState = 'closed';
    } else {
      if (newHeightRatio > 0.7) nextState = 'full';
      else if (newHeightRatio > 0.25) nextState = 'middle';
      else nextState = 'closed';
    }

    setSheetState(nextState);
  };

  const sheetHeightPercent = SNAP_POINTS[sheetState];

  return (
    <>
      {/* Bottom Sheet */}
      <motion.div
        ref={sheetRef}
        initial={{ y: '100%', opacity: 0 }}
        animate={{
          y: 0,
          opacity: mapPinMode ? 0 : 1,
          height: mapPinMode
            ? `${SNAP_POINTS.closed * 100}vh`
            : `${sheetHeightPercent * 100}vh`,
          transition: {
            type: 'spring',
            damping: 25,
            stiffness: 200,
            mass: 1,
          },
        }}
        drag={mapPinMode ? false : 'y'}
        dragElastic={0.1}
        dragConstraints={{ top: 0, bottom: 0 }}
        onDrag={handleDrag}
        className="fixed bottom-0 left-0 right-0 z-40 flex flex-col rounded-t-3xl bg-white border-t border-black/8 shadow-2xl shadow-black/20"
        style={{
          pointerEvents: mapPinMode ? 'none' : undefined,
          touchAction: 'none',
        }}
      >
        {/* Handle */}
        <motion.div
          className="flex justify-center pt-2.5 pb-1 shrink-0"
          animate={{ opacity: [0.4, 0.65, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-10 h-1 rounded-full bg-black/20 cursor-grab active:cursor-grabbing" />
        </motion.div>

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
                  onAddTrip={() => {
                    setEditingJourney(null);
                    setCreatorOpen(true);
                  }}
                  onAddPlace={onAddPlace ?? (() => {})}
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
      </motion.div>

      {/* Floating Bottom Nav Bar */}
      <div className="fixed bottom-4 left-0 right-0 z-50 flex items-center justify-center gap-3 px-4 pointer-events-none">
        {/* Nav pill */}
        <div className="flex items-center bg-white/95 backdrop-blur-xl rounded-full shadow-2xl shadow-black/15 border border-black/6 pointer-events-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveNav(item.id);
                  if (sheetState === 'closed') setSheetState('middle');
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

        {/* Search button */}
        <button className="w-14 h-14 rounded-full bg-white/95 backdrop-blur-xl border border-black/6 shadow-2xl shadow-black/15 flex items-center justify-center text-slate-700 hover:bg-white transition-all pointer-events-auto active:scale-95">
          <Search className="w-5 h-5" strokeWidth={2} />
        </button>
      </div>

      {/* Journey Creator */}
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
    </>
  );
}
