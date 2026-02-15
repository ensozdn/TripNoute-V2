/**
 * JOURNEY HUB V2 - Refactored with ActiveJourneyContext
 * 
 * Single source of truth: activeJourney
 * No more places[] dependency
 */

'use client';

import { useState, useMemo, useRef } from 'react';
import { motion, LayoutGroup, AnimatePresence } from 'framer-motion';
import { Map, BarChart3, ImageIcon } from 'lucide-react';
import { useJourney, useJourneyStats } from '@/contexts/ActiveJourneyContext';

type TabType = 'timeline' | 'insights' | 'gallery';
type SheetState = 'closed' | 'middle' | 'full';

interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ReactNode;
  expandsTo: SheetState;
}

const TABS: TabConfig[] = [
  { id: 'timeline', label: 'Timeline', icon: <Map className="w-5 h-5" />, expandsTo: 'middle' },
  { id: 'insights', label: 'Insights', icon: <BarChart3 className="w-5 h-5" />, expandsTo: 'full' },
  { id: 'gallery', label: 'Gallery', icon: <ImageIcon className="w-5 h-5" />, expandsTo: 'full' },
];

const SNAP_POINTS: Record<SheetState, number> = {
  closed: 0.08,
  middle: 0.5,
  full: 0.95,
};

export default function JourneyHubV2() {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [sheetState, setSheetState] = useState<SheetState>('closed');
  const sheetRef = useRef<HTMLDivElement>(null);

  // 🔥 Single source of truth - ActiveJourneyContext
  const [activeJourney] = useJourney();
  const stats = useJourneyStats();

  // Derived data from active journey
  const { steps, totalPhotos, galleryPhotos } = useMemo(() => {
    if (!activeJourney) {
      return {
        steps: [],
        totalPhotos: 0,
        galleryPhotos: [],
      };
    }

    const allPhotos = activeJourney.steps.flatMap((step) =>
      step.gallery.map((url, photoIndex) => ({
        id: `${step.id}-photo-${photoIndex}`,
        url,
        title: step.title,
        date: step.arrivalDate,
        location: step.location,
      }))
    );

    return {
      steps: activeJourney.steps,
      totalPhotos: allPhotos.length,
      galleryPhotos: allPhotos,
    };
  }, [activeJourney]);

  const handleTabChange = (index: number) => {
    setActiveTabIndex(index);
    const newState = TABS[index].expandsTo;
    setSheetState(newState);
  };

  const handleToggleExpand = () => {
    setSheetState((prev) => {
      if (prev === 'closed') return 'middle';
      if (prev === 'middle') return 'full';
      return 'closed';
    });
  };

  // Show empty state if no active journey
  if (!activeJourney) {
    return (
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-30 bg-background border-t border-border shadow-2xl rounded-t-3xl"
        style={{ height: '8vh' }}
      >
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-muted-foreground">
            No active journey. Create or select a trip to get started.
          </p>
        </div>
      </motion.div>
    );
  }

  const currentHeight = `${SNAP_POINTS[sheetState] * 100}vh`;

  return (
    <LayoutGroup>
      <motion.div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-30 bg-background border-t border-border shadow-2xl rounded-t-3xl overflow-hidden"
        initial={false}
        animate={{ height: currentHeight }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-border">
          {/* Drag Handle */}
          <button
            onClick={handleToggleExpand}
            className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-muted-foreground/30 rounded-full hover:bg-muted-foreground/50 transition-colors"
            aria-label="Toggle sheet"
          />

          {/* Trip Title */}
          <div className="mt-4 mb-2">
            <h2 className="text-lg font-semibold truncate">
              {activeJourney.name}
            </h2>
            {activeJourney.description && (
              <p className="text-sm text-muted-foreground truncate">
                {activeJourney.description}
              </p>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
            {TABS.map((tab, index) => (
              <motion.button
                key={tab.id}
                onClick={() => handleTabChange(index)}
                className={`
                  relative flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md
                  transition-colors text-sm font-medium
                  ${
                    activeTabIndex === index
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }
                `}
                whileTap={{ scale: 0.95 }}
              >
                {activeTabIndex === index && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-background rounded-md shadow-sm"
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {tab.icon}
                  {tab.label}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={TABS[activeTabIndex].id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {TABS[activeTabIndex].id === 'timeline' && (
                <div className="p-4 overflow-y-auto h-full">
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{steps.length}</div>
                        <div className="text-xs text-muted-foreground">Steps</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{stats.countries.length}</div>
                        <div className="text-xs text-muted-foreground">Countries</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{totalPhotos}</div>
                        <div className="text-xs text-muted-foreground">Photos</div>
                      </div>
                    </div>
                    {/* Timeline will go here */}
                    <div className="space-y-2">
                      {steps.map((step, index) => (
                        <div key={step.id} className="p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-start gap-3">
                            <div className="text-sm font-semibold text-primary">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium">{step.title}</h4>
                              <p className="text-xs text-muted-foreground">
                                {step.arrivalDate.toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {TABS[activeTabIndex].id === 'insights' && (
                <div className="p-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Journey Statistics</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Distance:</span>
                          <span className="font-medium">{stats.totalDistance.toFixed(0)} km</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Duration:</span>
                          <span className="font-medium">{Math.round(stats.totalDuration / 60)} hours</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Countries:</span>
                          <span className="font-medium">{stats.countries.join(', ')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Cities:</span>
                          <span className="font-medium">{stats.cities.join(', ')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {TABS[activeTabIndex].id === 'gallery' && (
                <div className="p-4">
                  <div className="grid grid-cols-3 gap-2">
                    {galleryPhotos.map((photo) => (
                      <div key={photo.id} className="aspect-square bg-muted rounded-lg overflow-hidden">
                        <img 
                          src={photo.url} 
                          alt={photo.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  {galleryPhotos.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No photos yet
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </LayoutGroup>
  );
}
