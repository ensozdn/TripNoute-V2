/**
 * TripNoute v2 - useGoogleMap Hook
 * 
 * Custom React hook for Google Maps integration.
 * Handles map initialization and lifecycle.
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { googleMapsService, MapConfig, MarkerData } from '@/lib/googleMaps';

interface UseGoogleMapOptions {
  config: MapConfig;
  markers?: MarkerData[];
  fitBounds?: boolean;
  onMarkerClick?: (markerId: string) => void;
}

export function useGoogleMap({
  config,
  markers = [],
  fitBounds = true,
  onMarkerClick,
}: UseGoogleMapOptions) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markerInstances, setMarkerInstances] = useState<google.maps.Marker[]>([]);
  const mapInitialized = useRef(false);

  // Check if API key is configured
  const isConfigured = googleMapsService.isConfigured();
  
  console.log('useGoogleMap - Hook initialized:', {
    hasMapRef: !!mapRef.current,
    isConfigured,
    markersCount: markers.length,
    mapInitialized: mapInitialized.current
  });

  // Initialize map
  useEffect(() => {
    console.log('useGoogleMap - Init effect running:', {
      hasMapRef: !!mapRef.current,
      isConfigured,
      mapInitialized: mapInitialized.current
    });
    
    if (!mapRef.current || !isConfigured || mapInitialized.current) {
      console.warn('useGoogleMap - Skipping init:', {
        hasMapRef: !!mapRef.current,
        isConfigured,
        alreadyInitialized: mapInitialized.current
      });
      setIsLoading(false);
      return;
    }

    const initMap = async () => {
      try {
        console.log('useGoogleMap - Starting map initialization...');
        setIsLoading(true);
        setError(null);

        const mapInstance = await googleMapsService.createMap(
          mapRef.current!,
          config
        );

        console.log('useGoogleMap - Map created successfully!', mapInstance);
        mapInitialized.current = true;
        setMap(mapInstance);
      } catch (err) {
        console.error('useGoogleMap - Error initializing map:', err);
        setError(err instanceof Error ? err.message : 'Failed to load map');
      } finally {
        setIsLoading(false);
      }
    };

    initMap();
  }, [isConfigured, config]); // eslint-disable-line react-hooks/exhaustive-deps

  // Add markers
  useEffect(() => {
    console.log('useGoogleMap - Markers effect:', {
      hasMap: !!map,
      markersCount: markers.length,
      markers
    });
    
    if (!map || markers.length === 0) {
      console.warn('useGoogleMap - Skipping markers:', {
        hasMap: !!map,
        markersCount: markers.length
      });
      return;
    }

    const addMarkers = async () => {
      try {
        console.log('useGoogleMap - Adding markers...');
        // Clear existing markers
        markerInstances.forEach((marker) => marker.setMap(null));

        // Add new markers
        const newMarkers = await googleMapsService.addMarkers(map, markers);
        console.log('useGoogleMap - Markers added:', newMarkers.length);
        
        // Add click listeners if callback provided
        if (onMarkerClick) {
          newMarkers.forEach((marker, index) => {
            marker.addListener('click', () => {
              onMarkerClick(markers[index].id);
            });
          });
        }
        
        setMarkerInstances(newMarkers);

        // Fit bounds if enabled
        if (fitBounds && markers.length > 0) {
          const positions = markers.map((m) => m.position);
          googleMapsService.fitBoundsToMarkers(map, positions);
        }
      } catch (err) {
        console.error('Error adding markers:', err);
      }
    };

    addMarkers();
  }, [map, markers, fitBounds, onMarkerClick]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    mapRef,
    map,
    isLoading,
    error,
    isConfigured,
    markerInstances,
  };
}
