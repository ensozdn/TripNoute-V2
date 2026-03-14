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
  center?: [number, number];
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

  const containerRef = useRef<HTMLDivElement>(null);
  const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

  const markers: MapMarker[] = useMemo(() => {
    return places
      .filter((place) => place.location?.lat && place.location?.lng)
      .map((place) => {

        const photoUrl = place.photos?.[0]?.thumbnailUrl || place.photos?.[0]?.url;

        return {
          id: place.id,
          position: {
            lat: place.location!.lat,
            lng: place.location!.lng,
          },
          title: place.title,
          description: `${place.address?.city || ''}, ${place.address?.country || ''}`,
          color: selectedPlace?.id === place.id ? '#0037ffff' : '#0062ffff',
          icon: photoUrl,
        };
      });
  }, [places, selectedPlace]);

  const handleMarkerClick = useMemo(() => {
    return (markerId: string) => {
      const place = places.find((p) => p.id === markerId);
      if (place && onMarkerClick) {
        onMarkerClick(place);
      }
    };
  }, [places, onMarkerClick]);

  const { map, isLoaded, error, flyTo } = useMapbox(containerRef, {
    accessToken,
    style,
    center,
    zoom,
    markers,
    enableUserLocation: false,
    onMapClick,
    onMarkerClick: handleMarkerClick,
  });

  useEffect(() => {
    if (isLoaded && selectedPlace?.location) {
      flyTo(selectedPlace.location.lat, selectedPlace.location.lng, 14);
    }
  }, [selectedPlace, isLoaded, flyTo]);

  useEffect(() => {
    if (!isLoaded || !map) return;

    const mapboxService = getMapboxService();

    const timer = setTimeout(() => {
      if (map.getZoom() < 4) {
        mapboxService.startSlowRotation();
      }
    }, 1000);

    return () => {
      clearTimeout(timer);
      mapboxService.stopRotation();
    };
  }, [isLoaded, map]);

  useEffect(() => {
    if (!isLoaded || !map) return;

    // No cleanup needed here — journey layers are managed by dashboard callbacks
  }, [isLoaded, map]);

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

  return (
    <div className={`relative w-full h-full ${className}`} style={{ minHeight: '400px' }}>
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full"
        style={{
          minHeight: '400px',
          // Force GPU compositing layer — keeps map rendering isolated from React re-paints
          transform: 'translateZ(0)',
          willChange: 'transform',
        }}
      />

      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white font-medium">Harita yükleniyor...</p>
          </div>
        </div>
      )}
    </div>
  );
}
