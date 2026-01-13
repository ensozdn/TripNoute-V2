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
  onMapClick?: (lat: number, lng: number) => void;
  onMarkerClick?: (markerId: string) => void;
}

interface UseMapboxReturn {
  map: MapboxMap | null;
  isLoaded: boolean;
  error: string | null;
  flyTo: (lat: number, lng: number, zoom?: number) => void;
  jumpTo: (lat: number, lng: number, zoom?: number) => void;
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
    if (!containerRef.current || isInitialized.current) return;

    const initMap = async () => {
      try {
        console.log('Initializing Mapbox map...');

        const initializedMap = await mapboxService.current.initializeMap({
          container: containerRef.current!,
          accessToken: options.accessToken,
          style: options.style || 'mapbox://styles/mapbox/streets-v12',
          center: options.center || [0, 0],
          zoom: options.zoom || 2,
        });

        setMap(initializedMap);
        setIsLoaded(true);
        isInitialized.current = true;

        console.log('Mapbox map initialized successfully');
      } catch (err) {
        console.error('Failed to initialize Mapbox map:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    initMap();

    // Cleanup
    return () => {
      if (isInitialized.current) {
        console.log('Cleaning up Mapbox map...');
        mapboxService.current.destroyMap();
        setMap(null);
        setIsLoaded(false);
        isInitialized.current = false;
      }
    };
  }, [containerRef, options.accessToken, options.style]);

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

    console.log('Updating markers:', options.markers.length);

    // Önce tüm marker'ları temizle
    mapboxService.current.clearMarkers();

    // Yeni marker'ları ekle
    options.markers.forEach((marker) => {
      mapboxService.current.addMarker(marker);
    });

    // Marker'ları içine alacak şekilde fit yap
    if (options.markers.length > 0) {
      mapboxService.current.fitBounds(options.markers);
    }
  }, [isLoaded, options.markers]);

  // Helper functions
  const flyTo = (lat: number, lng: number, zoom?: number) => {
    if (!isLoaded) return;
    mapboxService.current.flyTo(lat, lng, zoom);
  };

  const jumpTo = (lat: number, lng: number, zoom?: number) => {
    if (!isLoaded) return;
    mapboxService.current.jumpTo(lat, lng, zoom);
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
    addMarker,
    removeMarker,
    clearMarkers,
    setStyle,
  };
};
