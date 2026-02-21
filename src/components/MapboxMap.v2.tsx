/**
 * MAPBOX MAP V2 - ActiveJourneyContext Integration
 * 
 * Journey rendering with:
 * - Route lines between steps
 * - Transport medallions
 * - Step markers
 * - Camera focus on active step
 */

'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useMapbox } from '@/hooks/useMapbox';
import { getMapboxService } from '@/services/maps';
import { useJourney, useStep } from '@/contexts/ActiveJourneyContext';
import type { MapMarker } from '@/types/maps';

interface MapboxMapV2Props {
  className?: string;
  enableUserLocation?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
}

export default function MapboxMapV2({
  className = '',
  enableUserLocation = false,
  onMapClick,
}: MapboxMapV2Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

  // 🔥 Get active journey from context
  const [activeJourney] = useJourney();
  const { step: activeStep, setStep } = useStep();

  // Convert journey steps to map markers
  const markers: MapMarker[] = activeJourney?.steps.map((step) => ({
    id: step.id,
    position: {
      lat: step.location[1], // [lng, lat] → lat
      lng: step.location[0], // [lng, lat] → lng
    },
    title: step.title,
    description: `${step.address?.city || ''}, ${step.address?.country || ''}`,
    color: activeStep?.id === step.id ? '#10b981' : '#3b82f6', // Green if active
    icon: step.gallery[0], // First photo as marker icon
  })) || [];

  // Handle marker click - set active step
  const handleMarkerClick = useCallback((markerId: string) => {
    if (!activeJourney) return;
    
    const stepIndex = activeJourney.steps.findIndex((s) => s.id === markerId);
    if (stepIndex !== -1) {
      setStep(activeJourney.steps[stepIndex], stepIndex);
    }
  }, [activeJourney, setStep]);

  // Initialize map
  const { map, isLoaded, error, flyTo } = useMapbox(containerRef, {
    accessToken,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: undefined, // Will be set by journey
    zoom: 2,
    markers,
    enableUserLocation,
    onMapClick,
    onMarkerClick: handleMarkerClick,
  });

  // Fly to active step when it changes
  useEffect(() => {
    if (isLoaded && activeStep) {
      flyTo(activeStep.location[1], activeStep.location[0], 12);
    }
  }, [activeStep, isLoaded, flyTo]);

  // Render journey on map
  useEffect(() => {
    if (!isLoaded || !map || !activeJourney) return;

    const mapboxService = getMapboxService();

    // Clear previous journey
    mapboxService.clearRouteLines();

    // TODO: Phase 3.2 - Refactor MapboxService to use trip.v2.ts types
    // For now, just show markers. Route rendering will be added after
    // MapboxService refactor.
    
    console.log('✅ Journey loaded:', activeJourney.name);
    console.log('📍 Steps:', activeJourney.steps.length);

    return () => {
      mapboxService.clearRouteLines();
    };
  }, [isLoaded, map, activeJourney]);

  // Globe rotation when zoomed out
  useEffect(() => {
    if (!isLoaded || !map) return;

    const mapboxService = getMapboxService();
    const timer = setTimeout(() => {
      if (map.getZoom() < 3) {
        mapboxService.startSlowRotation();
      }
    }, 1000);

    return () => {
      clearTimeout(timer);
      mapboxService.stopRotation();
    };
  }, [isLoaded, map]);

  // Error states
  if (!accessToken) {
    return (
      <div className={`flex items-center justify-center bg-slate-900/50 w-full h-full ${className}`}>
        <div className="text-center">
          <p className="text-red-400 font-medium">Mapbox Access Token bulunamadı</p>
          <p className="text-slate-400 text-sm mt-2">
            .env.local dosyasına NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ekleyin
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-slate-900/50 w-full h-full ${className}`}>
        <div className="text-center">
          <p className="text-red-400 font-medium">Harita yüklenemedi</p>
          <p className="text-slate-400 text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Map Container */}
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full"
      />

      {/* Loading Overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white font-medium">Harita yükleniyor...</p>
          </div>
        </div>
      )}

      {/* Journey Info Overlay */}
      {isLoaded && activeJourney && (
        <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm px-4 py-3 rounded-lg shadow-lg border border-border">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              {activeJourney.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {activeJourney.steps.length} steps • {Math.round(activeJourney.totalDistance || 0)} km
            </p>
            {activeStep && (
              <p className="text-xs text-primary font-medium">
                📍 {activeStep.title}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {isLoaded && !activeJourney && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm">
          <div className="text-center p-8 bg-background/90 rounded-xl border border-border max-w-md">
            <div className="text-4xl mb-4">🗺️</div>
            <h3 className="text-lg font-semibold mb-2">No Active Journey</h3>
            <p className="text-sm text-muted-foreground">
              Create or select a trip to see it on the map
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
