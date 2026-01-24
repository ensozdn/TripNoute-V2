/**
 * JourneyHub Component
 * 
 * Main container for the tabbed journey interface.
 * Single Responsibility: Manages tab state and coordinates sub-components.
 */

'use client';

import { useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Place } from '@/types';
import { TabType, JourneyStats, PlaceFrequency, GalleryPhoto } from '@/types/journey';
import JourneyTabs from './JourneyTabs';
import TimelineTab from './tabs/TimelineTab';
import InsightsTab from './tabs/InsightsTab';
import GalleryTab from './tabs/GalleryTab';

interface JourneyHubProps {
  places: Place[];
  selectedPlaceId?: string | null;
  onPlaceSelect: (place: Place) => void;
  onPlaceDelete?: (placeId: string) => Promise<void>;
  onPlaceEdit?: (place: Place) => void;
}

export default function JourneyHub({
  places,
  selectedPlaceId,
  onPlaceSelect,
  onPlaceDelete,
  onPlaceEdit,
}: JourneyHubProps) {
  const [activeTab, setActiveTab] = useState<TabType>('timeline');

  // Calculate journey stats from places
  const stats: JourneyStats = useMemo(() => {
    const countries = new Set<string>();
    const cities = new Set<string>();
    let totalPhotos = 0;
    let firstDate: Date | null = null;
    let lastDate: Date | null = null;

    places.forEach((place) => {
      // Count countries and cities
      if (place.address?.country) countries.add(place.address.country);
      if (place.address?.city) cities.add(place.address.city);

      // Count photos
      totalPhotos += place.photos?.length || 0;

      // Track date range
      if (place.visitDate?.seconds) {
        const date = new Date(place.visitDate.seconds * 1000);
        if (!firstDate || date < firstDate) firstDate = date;
        if (!lastDate || date > lastDate) lastDate = date;
      }
    });

    return {
      totalPlaces: places.length,
      totalPhotos,
      totalDistance: 0, // TODO: Calculate actual distance
      countriesVisited: countries.size,
      citiesVisited: cities.size,
      firstTripDate: firstDate,
      lastTripDate: lastDate,
    };
  }, [places]);

  // Calculate place frequencies by country
  const placeFrequencies: PlaceFrequency[] = useMemo(() => {
    const countryMap = new Map<string, number>();

    places.forEach((place) => {
      const country = place.address?.country || 'Unknown';
      countryMap.set(country, (countryMap.get(country) || 0) + 1);
    });

    return Array.from(countryMap.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count);
  }, [places]);

  // Collect all photos from places
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

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'timeline':
        return (
          <TimelineTab
            key="timeline"
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
            key="insights"
            stats={stats}
            placeFrequencies={placeFrequencies}
          />
        );
      case 'gallery':
        return (
          <GalleryTab
            key="gallery"
            photos={galleryPhotos}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 max-h-1/2 flex flex-col bg-black/40 backdrop-blur-md border-t border-white/10">
      {/* Drag Handle */}
      <div className="flex justify-center pt-3 pb-1">
        <div className="w-12 h-1.5 rounded-full bg-white/30" />
      </div>

      {/* Tab Navigation */}
      <JourneyTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {renderTabContent()}
        </AnimatePresence>
      </div>
    </div>
  );
}
