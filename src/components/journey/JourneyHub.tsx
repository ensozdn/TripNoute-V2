'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, LayoutGroup, AnimatePresence } from 'framer-motion';
import { Place } from '@/types';
import { Trip } from '@/types/trip';
import { JourneyStats, PlaceFrequency, GalleryPhoto } from '@/types/journey';
import TimelineTab from './tabs/TimelineTab';
import JourneysTab from './tabs/JourneysTab';
import InsightsTab from './tabs/InsightsTab';
import GalleryTab from './tabs/GalleryTab';
import JourneyCreator from './creator/JourneyCreator';
import { Map, Route, BarChart3, ImageIcon } from 'lucide-react';
import { deduplicateCountries, sortByFrequency } from '@/utils/dataNormalizer';

type TabType = 'timeline' | 'journeys' | 'insights' | 'gallery';
type SheetState = 'closed' | 'middle' | 'full';

interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ReactNode;
  expandsTo: SheetState;
}

interface JourneyHubProps {
  places: Place[];
  journeys: Trip[];
  selectedPlaceId?: string | null;
  onPlaceSelect: (place: Place) => void;
  onPlaceDelete?: (placeId: string) => Promise<void>;
  onPlaceEdit?: (place: Place) => void;
  onJourneyCreated: (journey: Trip) => void;
  onJourneySelect: (journey: Trip) => void;
  onJourneyDelete: (journeyId: string) => Promise<void>;
  onJourneyUpdated: (journey: Trip) => void;
  onRequestMapPin: (onPinDropped: (name: string, lat: number, lng: number) => void) => void;
  mapPinMode?: boolean;
  userName?: string | null;
  userEmail?: string | null;
  userPhoto?: string | null;
  onLogout: () => void;
  onAddPlace: () => void;
}

const TABS: TabConfig[] = [
  { id: 'timeline', label: 'Timeline', icon: <Map className="w-4 h-4" />, expandsTo: 'middle' },
  { id: 'journeys', label: 'Journeys', icon: <Route className="w-4 h-4" />, expandsTo: 'middle' },
  { id: 'insights', label: 'Insights', icon: <BarChart3 className="w-4 h-4" />, expandsTo: 'full' },
  { id: 'gallery',  label: 'Gallery',  icon: <ImageIcon className="w-4 h-4" />, expandsTo: 'full' },
];

const SNAP_POINTS: Record<SheetState, number> = {
  closed: 0.065,  // ~55px — just handle + tab bar, maximises map view
  middle: 0.40,   // 60% of screen for map
  full: 0.95,
};

export default function JourneyHub({
  places,
  journeys,
  selectedPlaceId,
  onPlaceSelect,
  onPlaceDelete,
  onPlaceEdit,
  onJourneyCreated,
  onJourneySelect,
  onJourneyDelete,
  onJourneyUpdated,
  onRequestMapPin,
  mapPinMode = false,
  userName: _userName,
  userEmail: _userEmail,
  userPhoto: _userPhoto,
  onLogout: _onLogout,
  onAddPlace,
}: JourneyHubProps) {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [sheetState, setSheetState] = useState<SheetState>('middle');
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [editingJourney, setEditingJourney] = useState<Trip | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Detect mobile once on mount
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const stats: JourneyStats = useMemo(() => {
    const countries = new Set<string>();
    const cities = new Set<string>();
    let totalPhotos = 0;
    let firstDate: Date | null = null;
    let lastDate: Date | null = null;

    places.forEach((place) => {

      const normalizedCountry = place.address?.country
        ? place.address.country.trim().toLowerCase().replace(/\s+/g, ' ')
        : null;
      const normalizedCity = place.address?.city
        ? place.address.city.trim().toLowerCase().replace(/\s+/g, ' ')
        : null;

      if (normalizedCountry) countries.add(normalizedCountry);
      if (normalizedCity) cities.add(normalizedCity);

      totalPhotos += place.photos?.length || 0;

      if (place.visitDate?.seconds) {
        const date = new Date(place.visitDate.seconds * 1000);
        if (!firstDate || date < firstDate) firstDate = date;
        if (!lastDate || date > lastDate) lastDate = date;
      }
    });

    return {
      totalPlaces: places.length,
      totalPhotos,
      totalDistance: 0,
      countriesVisited: countries.size,
      citiesVisited: cities.size,
      firstTripDate: firstDate,
      lastTripDate: lastDate,
    };
  }, [places]);

  const placeFrequencies: PlaceFrequency[] = useMemo(() => {
    const countryMap = deduplicateCountries(places);
    const sorted = sortByFrequency(countryMap);

    return sorted.map(([country, count]) => ({
      country,
      count,
    }));
  }, [places]);

  const galleryPhotos: GalleryPhoto[] = useMemo(() => {
    const photos: GalleryPhoto[] = [];
    places.forEach((place) => {
      place.photos?.forEach((photo) => {
        photos.push({
          id: photo.id,
          url: photo.url,
          thumbnailUrl: photo.thumbnailUrl || photo.url,
          placeId: place.id,
          placeTitle: place.title,
          width: photo.width || 400,
          height: photo.height || 400,
        });
      });
    });
    return photos;
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
    }

    else if (info.velocity.y > 300) {
      if (sheetState === 'full') nextState = 'middle';
      else if (sheetState === 'middle') nextState = 'closed';
    }

    else {
      if (newHeightRatio > 0.7) {
        nextState = 'full';
      } else if (newHeightRatio > 0.25) {
        nextState = 'middle';
      } else {
        nextState = 'closed';
      }
    }

    setSheetState(nextState);
  };
  const handleTabClick = (tabIndex: number) => {
    setActiveTabIndex(tabIndex);
    const expandsTo = TABS[tabIndex].expandsTo;
    setSheetState(expandsTo);
  };

  const activeTab = TABS[activeTabIndex];
  const sheetHeightPercent = SNAP_POINTS[sheetState];

  const renderTabContent = () => {
    switch (activeTab.id) {
      case 'timeline':
        return (
          <TimelineTab
            places={places}
            selectedPlaceId={selectedPlaceId}
            onPlaceSelect={onPlaceSelect}
            onPlaceDelete={onPlaceDelete}
            onPlaceEdit={onPlaceEdit}
            onAddPlace={onAddPlace}
          />
        );
      case 'journeys':
        return (
          <JourneysTab
            journeys={journeys}
            onCreateJourney={() => {
              setEditingJourney(null);
              setCreatorOpen(true);
            }}
            onSelectJourney={onJourneySelect}
            onDeleteJourney={onJourneyDelete}
            onEditJourney={(journey) => {
              setEditingJourney(journey);
              setCreatorOpen(true);
            }}
          />
        );
      case 'insights':
        return (
          <InsightsTab
            stats={stats}
            placeFrequencies={placeFrequencies}
            journeys={journeys}
          />
        );
      case 'gallery':
        return (
          <GalleryTab
            photos={galleryPhotos}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
    <motion.div
      ref={sheetRef}
      initial={{ y: '100%', opacity: 0 }}
      animate={{
        y: 0,
        opacity: mapPinMode ? 0 : 1,
        height: mapPinMode ? `${SNAP_POINTS.closed * 100}vh` : `${sheetHeightPercent * 100}vh`,
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
      className="fixed bottom-0 left-0 right-0 z-40 flex flex-col rounded-t-3xl"
      style={{
        pointerEvents: mapPinMode ? 'none' : undefined,
        touchAction: 'none',
      }}
    >
      {}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-2xl border-t border-black/8 rounded-t-3xl shadow-2xl shadow-black/20" />

      {}
      <motion.div
        className="relative z-10 flex justify-center py-2"
        animate={{ opacity: [0.4, 0.65, 0.4] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-10 h-1 rounded-full bg-black/20 cursor-grab active:cursor-grabbing" />
      </motion.div>

      {}
      <LayoutGroup>
        <div className="relative z-10 flex items-center border-b border-black/8 px-4 pb-0">
          <div className="flex items-center w-full relative">
            {}
            <motion.div
              layoutId="active-pill"
              className="absolute h-8 bg-black/8 border border-black/10 rounded-xl"
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 30,
              }}
              style={{
                width: `${100 / TABS.length}%`,
                left: `${(activeTabIndex * 100) / TABS.length}%`,
              }}
            />

            {}
            {TABS.map((tab, index) => (
              <motion.button
                key={tab.id}
                onClick={() => handleTabClick(index)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-1 text-xs font-medium relative z-20 transition-colors duration-200 ${
                  index === activeTabIndex
                    ? 'text-slate-800'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {tab.icon}
                <span className={isMobile ? 'hidden' : 'inline'}>{tab.label}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </LayoutGroup>

      {}
      <div
        className="relative z-10 flex-1 min-h-0 overflow-y-auto"
        style={{
          touchAction: 'pan-y pinch-zoom',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab.id}
            initial={{ x: 20, opacity: 0 }}
            animate={{ 
              x: 0, 
              opacity: 1,
              transition: { 
                type: 'spring',
                stiffness: 300,
                damping: 30,
              }
            }}
            exit={{ 
              x: -20, 
              opacity: 0,
              transition: { 
                duration: 0.2,
              }
            }}
            className="w-full px-4 pb-28"
          >
            {}
            <div className="relative">
              {renderTabContent()}

              {}
              <div className="sticky bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white/60 to-transparent pointer-events-none" />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {}
      <div className="relative z-10 h-safe" />
    </motion.div>

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
        onJourneyCreated(journey);
      }}
      onUpdated={(journey) => {
        setCreatorOpen(false);
        setEditingJourney(null);
        onJourneyUpdated(journey);
      }}
      onRequestMapPin={onRequestMapPin}
    />
    </>
  );
}
