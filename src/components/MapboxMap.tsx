/**
 * MapboxMap Component
 * Mapbox GL JS kullanarak harita render eder
 * Google Places API ile arama yapabilir
 */

'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useMapbox } from '@/hooks/useMapbox';
import { getMapboxService } from '@/services/maps';
import type { MapMarker } from '@/types/maps';
import type { Place } from '@/types/models/Place';

interface MapboxMapProps {
  places?: Place[];
  selectedPlace?: Place | null;
  onMarkerClick?: (place: Place) => void;
  onMapClick?: (lat: number, lng: number) => void;
  center?: [number, number]; // [lng, lat]
  zoom?: number;
  style?: string;
  className?: string;
}

export default function MapboxMap({
  places = [],
  selectedPlace,
  onMarkerClick,
  onMapClick,
  center,
  zoom = 2,
  style = 'mapbox://styles/mapbox/streets-v12',
  className = '',
}: MapboxMapProps) {
  // Tüm hook'lar en başta
  const containerRef = useRef<HTMLDivElement>(null);
  const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

  // Places'leri MapMarker'lara dönüştür
  const markers: MapMarker[] = useMemo(() => {
    return places
      .filter((place) => place.location?.lat && place.location?.lng)
      .map((place) => {
        // Use first photo as icon if available
        const photoUrl = place.photos?.[0]?.thumbnailUrl || place.photos?.[0]?.url;

        return {
          id: place.id,
          position: {
            lat: place.location!.lat,
            lng: place.location!.lng,
          },
          title: place.title,
          description: `${place.address?.city || ''}, ${place.address?.country || ''}`,
          color: selectedPlace?.id === place.id ? '#10b981' : '#3b82f6',
          icon: photoUrl, // Pass URL or undefined
        };
      });
  }, [places, selectedPlace]);

  // Marker click handler
  const handleMarkerClick = useMemo(() => {
    return (markerId: string) => {
      const place = places.find((p) => p.id === markerId);
      if (place && onMarkerClick) {
        onMarkerClick(place);
      }
    };
  }, [places, onMarkerClick]);

  // Mapbox hook - GeolocateControl disabled, using custom button in Dashboard
  const { map, isLoaded, error, flyTo } = useMapbox(containerRef, {
    accessToken,
    style,
    center,
    zoom,
    markers,
    enableUserLocation: false, // GeolocateControl disabled - custom button in Dashboard
    onMapClick,
    onMarkerClick: handleMarkerClick,
  });

  // Selected place effect
  useEffect(() => {
    if (isLoaded && selectedPlace?.location) {
      flyTo(selectedPlace.location.lat, selectedPlace.location.lng, 14);
    }
  }, [selectedPlace, isLoaded, flyTo]);

  // Start globe rotation when map loads (if in globe view)
  useEffect(() => {
    if (!isLoaded || !map) return;

    const mapboxService = getMapboxService();

    // Start rotation after a delay for dramatic effect
    const timer = setTimeout(() => {
      // Start if we're in globe view (zoom < 3) - regardless of places
      if (map.getZoom() < 3) {
        mapboxService.startSlowRotation();
      }
    }, 1000);

    return () => {
      clearTimeout(timer);
      mapboxService.stopRotation();
    };
    return () => {
      clearTimeout(timer);
      mapboxService.stopRotation();
    };
  }, [isLoaded, map]);

  // Clear route lines when component unmounts
  useEffect(() => {
    if (!isLoaded || !map) return;

    const mapboxService = getMapboxService();

    return () => {
      mapboxService.clearRouteLines();
    };
  }, [isLoaded, map]);

  // No token
  if (!accessToken) {
    return (
      <div className={`flex items-center justify-center bg-slate-900/50 w-full h-full ${className}`} style={{ minHeight: '400px' }}>
        <div className="text-center">
          <p className="text-red-400 font-medium">Mapbox Access Token bulunamadı</p>
          <p className="text-slate-400 text-sm mt-2">
            .env.local dosyasına NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ekleyin
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`flex items-center justify-center bg-slate-900/50 w-full h-full ${className}`} style={{ minHeight: '400px' }}>
        <div className="text-center">
          <p className="text-red-400 font-medium">Harita yüklenemedi</p>
          <p className="text-slate-400 text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-slate-900/50 ${className}`}>
        <div className="text-center">
          <p className="text-red-400 font-medium">Harita yüklenemedi</p>
          <p className="text-slate-400 text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`} style={{ minHeight: '400px' }}>
      {/* Map Container */}
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full"
        style={{ minHeight: '400px' }}
      />

      {/* Loading Overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white font-medium">Harita yükleniyor...</p>
          </div>
        </div>
      )}

      {/* Info Badge */}
      {isLoaded && markers.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-slate-900">
            {markers.length} konum gösteriliyor
          </p>
        </div>
      )}
    </div>
  );
}
