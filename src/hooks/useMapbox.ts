/**
 * useMapbox Hook
 * Mapbox harita yönetimi için React hook
 */

import { useEffect, useRef, useState } from 'react';
import type { Map as MapboxMap } from 'mapbox-gl';
import { getMapboxService } from '@/services/maps';
import type { MapMarker } from '@/types/maps';

interface UseMapboxOptions {
  accessToken: string;
  style?: string;
  center?: [number, number]; // [lng, lat]
  zoom?: number;
  markers?: MapMarker[];
  enableUserLocation?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
  onMarkerClick?: (markerId: string) => void;
}

interface UseMapboxReturn {
  map: MapboxMap | null;
  isLoaded: boolean;
  error: string | null;
  flyTo: (lat: number, lng: number, zoom?: number) => void;
  jumpTo: (lat: number, lng: number, zoom?: number) => void;
  flyToUserLocation: (zoom?: number) => Promise<{ lat: number; lng: number } | null>;
  getUserLocation: () => Promise<{ lat: number; lng: number } | null>;
  addMarker: (marker: MapMarker) => void;
  removeMarker: (markerId: string) => void;
  clearMarkers: () => void;
  setStyle: (styleUrl: string) => void;
}

export const useMapbox = (
  containerRef: React.RefObject<HTMLDivElement | null>,
  options: UseMapboxOptions
): UseMapboxReturn => {
  const [map, setMap] = useState<MapboxMap | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mapboxService = useRef(getMapboxService());
  const isInitialized = useRef(false);

  // Map initialization
  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    if (isInitialized.current) {
      return;
    }

    const initMap = async () => {
      try {
        const initializedMap = await mapboxService.current.initializeMap({
          container: containerRef.current!,
          accessToken: options.accessToken,
          style: options.style || 'mapbox://styles/mapbox/dark-v11',
          center: options.center || [0, 0],
          zoom: options.zoom || 1.5,
        });

        setMap(initializedMap);
        setIsLoaded(true);
        isInitialized.current = true;
      } catch (err) {
        console.error('Failed to initialize Mapbox map:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    initMap();

    // Cleanup
    return () => {
      if (isInitialized.current) {
        mapboxService.current.destroyMap();
        setMap(null);
        setIsLoaded(false);
        isInitialized.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.accessToken, options.style]);

  // Event handlers
  useEffect(() => {
    if (!isLoaded) return;

    if (options.onMapClick) {
      mapboxService.current.onClick(options.onMapClick);
    }

    if (options.onMarkerClick) {
      mapboxService.current.onMarkerClick(options.onMarkerClick);
    }
  }, [isLoaded, options.onMapClick, options.onMarkerClick]);

  // Markers management
  useEffect(() => {
    if (!isLoaded || !options.markers) return;

    mapboxService.current.clearMarkers();

    options.markers.forEach((marker) => {
      mapboxService.current.addMarker(marker);
    });

    // REMOVED: Auto fitBounds that was breaking globe view
    // Markers are added but map stays in globe view for cinematic rotation
    // User can manually zoom to places or click timeline to focus
    // if (options.markers.length > 0) {
    //   mapboxService.current.fitBounds(options.markers);
    // }
  }, [isLoaded, options.markers]);

  // User location
  useEffect(() => {
    if (!isLoaded || !options.enableUserLocation) return;

    mapboxService.current.enableUserLocation();
  }, [isLoaded, options.enableUserLocation]);

  // Helper functions
  const flyTo = (lat: number, lng: number, zoom?: number) => {
    if (!isLoaded) return;
    mapboxService.current.flyTo(lat, lng, zoom);
  };

  const jumpTo = (lat: number, lng: number, zoom?: number) => {
    if (!isLoaded) return;
    mapboxService.current.jumpTo(lat, lng, zoom);
  };

  const flyToUserLocation = async (zoom?: number): Promise<{ lat: number; lng: number } | null> => {
    if (!isLoaded) return null;
    return mapboxService.current.flyToUserLocation(zoom);
  };

  const getUserLocation = async (): Promise<{ lat: number; lng: number } | null> => {
    return mapboxService.current.getUserLocation();
  };

  const addMarker = (marker: MapMarker) => {
    if (!isLoaded) return;
    mapboxService.current.addMarker(marker);
  };

  const removeMarker = (markerId: string) => {
    if (!isLoaded) return;
    mapboxService.current.removeMarker(markerId);
  };

  const clearMarkers = () => {
    if (!isLoaded) return;
    mapboxService.current.clearMarkers();
  };

  const setStyle = (styleUrl: string) => {
    if (!isLoaded) return;
    mapboxService.current.setStyle(styleUrl);
  };

  return {
    map,
    isLoaded,
    error,
    flyTo,
    jumpTo,
    flyToUserLocation,
    getUserLocation,
    addMarker,
    removeMarker,
    clearMarkers,
    setStyle,
  };
};
