/**
 * MapboxMap Component
 * Mapbox GL JS kullanarak harita render eder
 * Google Places API ile arama yapabilir
 */

'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
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
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Places'leri MapMarker'lara dönüştür
  const markers: MapMarker[] = useMemo(() => {
    return places
      .filter((place) => place.location?.lat && place.location?.lng)
      .map((place) => ({
        id: place.id,
        position: {
          lat: place.location!.lat,
          lng: place.location!.lng,
        },
        title: place.title,
        description: `${place.address?.city || ''}, ${place.address?.country || ''}`,
        color: selectedPlace?.id === place.id ? '#10b981' : '#3b82f6',
      }));
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

  // Mapbox hook - Custom location button kullanıyoruz (GeolocateControl kaldırıldı)
  const { map, isLoaded, error, flyTo, flyToUserLocation } = useMapbox(containerRef, {
    accessToken,
    style,
    center,
    zoom,
    markers,
    enableUserLocation: false, // GeolocateControl devre dışı - custom button kullanıyoruz
    onMapClick,
    onMarkerClick: handleMarkerClick,
  });

  // Handle locate button click with error handling
  const handleLocateMe = async () => {
    alert('🔍 Konum isteği başladı...');
    setIsLocating(true);
    setLocationError(null);
    
    try {
      const result = await flyToUserLocation(12);
      
      if (!result) {
        alert('❌ Konum alınamadı!');
        setLocationError('Konumunuz alınamadı. GPS\'i açın ve tekrar deneyin.');
      } else {
        alert('✅ Konum bulundu! Harita hareket ediyor...');
        setLocationError(null);
        console.log('✅ Konumunuz başarıyla alındı:', result);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu';
      alert('⚠️ Hata: ' + errorMsg);
      setLocationError(errorMsg);
      console.error('❌ Konum hatası:', err);
    } finally {
      setIsLocating(false);
    }
  };

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

      {/* My Location Button - Mobile Optimized */}
      {isLoaded && (
        <div className="absolute bottom-24 left-4 z-10 flex flex-col gap-2">
          <button
            onClick={handleLocateMe}
            disabled={isLocating}
            className="bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 disabled:bg-white/5 text-white p-3.5 rounded-2xl shadow-2xl shadow-black/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Konumuma Git"
            aria-label="Konumuma Git"
          >
            {isLocating ? (
              <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                <path strokeLinecap="round" d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="2" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            )}
          </button>
          
          {/* Error message */}
          {locationError && (
            <div className="bg-red-500/90 backdrop-blur-xl text-white px-3 py-2 rounded-xl text-xs max-w-xs shadow-xl">
              ❌ {locationError}
            </div>
          )}
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
