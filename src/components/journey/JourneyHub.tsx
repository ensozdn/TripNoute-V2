'use client';

import { useState, useMemo, useRef } from 'react';
import { motion, LayoutGroup, AnimatePresence } from 'framer-motion';
import { Place } from '@/types';
import { JourneyStats, PlaceFrequency, GalleryPhoto } from '@/types/journey';
import TimelineTab from './tabs/TimelineTab';
import InsightsTab from './tabs/InsightsTab';
import GalleryTab from './tabs/GalleryTab';
import SettingsTab from './tabs/SettingsTab';
import { Map, BarChart3, ImageIcon, Settings } from 'lucide-react';
import { deduplicateCountries, sortByFrequency } from '@/utils/dataNormalizer';

type TabType = 'timeline' | 'insights' | 'gallery' | 'settings';
type SheetState = 'closed' | 'middle' | 'full';

interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ReactNode;
  expandsTo: SheetState;
}

interface JourneyHubProps {
  places: Place[];
  selectedPlaceId?: string | null;
  onPlaceSelect: (place: Place) => void;
  onPlaceDelete?: (placeId: string) => Promise<void>;
  onPlaceEdit?: (place: Place) => void;
  userName?: string | null;
  userEmail?: string | null;
  userPhoto?: string | null;
  onLogout: () => void;
}

const TABS: TabConfig[] = [
  { id: 'timeline', label: 'Timeline', icon: <Map className="w-5 h-5" />, expandsTo: 'middle' },
  { id: 'insights', label: 'Insights', icon: <BarChart3 className="w-5 h-5" />, expandsTo: 'full' },
  { id: 'gallery', label: 'Gallery', icon: <ImageIcon className="w-5 h-5" />, expandsTo: 'full' },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" />, expandsTo: 'full' },
];

const SNAP_POINTS: Record<SheetState, number> = {
  closed: 0.08,
  middle: 0.5,
  full: 0.95,
};

export default function JourneyHub({
  places,
  selectedPlaceId,
  onPlaceSelect,
  onPlaceDelete,
  onPlaceEdit,
  userName,
  userEmail,
  userPhoto,
  onLogout,
}: JourneyHubProps) {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [sheetState, setSheetState] = useState<SheetState>('closed');
  const sheetRef = useRef<HTMLDivElement>(null);

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
          />
        );
      case 'insights':
        return (
          <InsightsTab
            stats={stats}
            placeFrequencies={placeFrequencies}
          />
        );
      case 'gallery':
        return (
          <GalleryTab
            photos={galleryPhotos}
          />
        );
      case 'settings':
        return (
          <SettingsTab
            userName={userName}
            userEmail={userEmail}
            userPhoto={userPhoto}
            onLogout={onLogout}
            places={places}
          />
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      ref={sheetRef}
      initial={{ y: '100%', opacity: 0 }}
      animate={{
        y: 0,
        opacity: 1,
        height: `${sheetHeightPercent * 100}vh`,
        transition: {
          type: 'spring',
          damping: 25,
          stiffness: 200,
          mass: 1,
        },
      }}
      drag="y"
      dragElastic={0.1}
      dragConstraints={{ top: 0, bottom: 0 }}
      onDrag={handleDrag}
      className="fixed bottom-0 left-0 right-0 z-40 flex flex-col rounded-t-3xl"
      style={{
        touchAction: 'none',
      }}
    >
      {}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/20 backdrop-blur-2xl border-t border-white/10 rounded-t-3xl" />

      {}
      <motion.div
        className="relative z-10 flex justify-center py-3"
        animate={{ opacity: [0.5, 0.7, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-12 h-1.5 rounded-full bg-white/40 cursor-grab active:cursor-grabbing" />
      </motion.div>

      {}
      <LayoutGroup>
        <div className="relative z-10 flex items-center border-b border-white/5 px-4 pb-0">
          <div className="flex items-center w-full relative">
            {}
            <motion.div
              layoutId="active-pill"
              className="absolute h-10 bg-white/10 border border-white/20 rounded-xl"
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
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 text-sm font-medium relative z-20 transition-colors duration-200 ${
                  index === activeTabIndex
                    ? 'text-white'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </LayoutGroup>

      {}
      <div
        className="relative z-10 flex-1 min-h-0 overflow-hidden"
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
            className="h-full w-full overflow-y-auto px-4 pb-8"
          >
            {}
            <div className="relative">
              {renderTabContent()}

              {}
              <div className="sticky bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {}
      <div className="relative z-10 h-safe" />
    </motion.div>
  );
}
