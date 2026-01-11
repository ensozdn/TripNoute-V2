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

  // Check if API key is configured
  const isConfigured = googleMapsService.isConfigured();

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !isConfigured) {
      setIsLoading(false);
      return;
    }

    const initMap = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const mapInstance = await googleMapsService.createMap(
          mapRef.current!,
          config
        );

        setMap(mapInstance);
      } catch (err) {
        console.error('Error initializing map:', err);
        setError(err instanceof Error ? err.message : 'Failed to load map');
      } finally {
        setIsLoading(false);
      }
    };

    initMap();
  }, [isConfigured]); // eslint-disable-line react-hooks/exhaustive-deps

  // Add markers
  useEffect(() => {
    if (!map || markers.length === 0) return;

    const addMarkers = async () => {
      try {
        // Clear existing markers
        markerInstances.forEach((marker) => marker.setMap(null));

        // Add new markers
        const newMarkers = await googleMapsService.addMarkers(map, markers);
        
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
