/**
 * MapboxLocationPicker Component
 * Add/Edit sayfalarında konum seçimi için özel Mapbox haritası
 * Google Places ile entegre çalışır (hibrit model)
 */

'use client';

import { useRef, useEffect, useState } from 'react';
import { useMapbox } from '@/hooks/useMapbox';
import { getGooglePlacesService } from '@/services/maps';
import PlaceSearchBar from './PlaceSearchBar';
import type { GooglePlaceResult } from '@/types/maps';

interface MapboxLocationPickerProps {
  initialLocation?: { lat: number; lng: number };
  onLocationSelect: (location: { lat: number; lng: number; address?: string }) => void;
  className?: string;
}

export default function MapboxLocationPicker({
  initialLocation,
  onLocationSelect,
  className = '',
}: MapboxLocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation || null);
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const googlePlaces = useRef(getGooglePlacesService());
  const [showHint, setShowHint] = useState(!initialLocation);

  const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

  // Marker'ı oluştur
  const markers = selectedLocation
    ? [
      {
        id: 'selected-location',
        position: selectedLocation,
        title: 'Seçili Konum',
        color: '#3b82f6', // Premium Blue
      },
    ]
    : [];

  // Harita tıklama handler'ı
  const handleMapClick = async (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    setShowHint(false);

    // Google Reverse Geocoding ile adres al
    setIsGeocodingAddress(true);
    try {
      const address = await googlePlaces.current.reverseGeocode(lat, lng);
      onLocationSelect({ lat, lng, address });
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      onLocationSelect({ lat, lng });
    } finally {
      setIsGeocodingAddress(false);
    }
  };

  // Google Places arama sonucu seçilince
  const handlePlaceSelect = async (place: GooglePlaceResult) => {
    const location = {
      lat: place.location.lat,
      lng: place.location.lng,
    };
    setSelectedLocation(location);
    setShowHint(false);
    onLocationSelect({
      ...location,
      address: place.formattedAddress,
    });
  };

  // Handle locate button click
  const handleLocateMe = async () => {
    setIsLocating(true);
    setLocationError(null);
    setShowHint(false);

    try {
      const result = await flyToUserLocation(14); // Slightly closer zoom for precision

      if (!result) {
        // Show silent error toast instead of alert
        setLocationError('Konum alınamadı');
        setTimeout(() => setLocationError(null), 3000);
      } else {
        setSelectedLocation({ lat: result.lat, lng: result.lng });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Hata';
      setLocationError(errorMsg);
      setTimeout(() => setLocationError(null), 3000);
    } finally {
      setIsLocating(false);
    }
  };

  // Mapbox hook
  const { isLoaded, error, flyTo, flyToUserLocation } = useMapbox(containerRef, {
    accessToken,
    style: 'mapbox://styles/mapbox/satellite-streets-v12', // Premium Satellite View
    center: initialLocation ? [initialLocation.lng, initialLocation.lat] : [0, 0],
    zoom: initialLocation ? 14 : 2,
    markers,
    enableUserLocation: false,
    onMapClick: handleMapClick,
  });

  // Selected location effect
  useEffect(() => {
    if (isLoaded && selectedLocation) {
      flyTo(selectedLocation.lat, selectedLocation.lng, 14);
    }
  }, [selectedLocation, isLoaded, flyTo]);

  if (!accessToken) return null; // Fail silently or handle in parent
  if (error) return null;

  return (
    <div className={`relative w-full h-[500px] md:h-[600px] rounded-3xl overflow-hidden border border-white/20 shadow-2xl bg-slate-900 ${className}`}>

      {/* 1. Map Canvas */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* 2. Top Controls Layer (Search + Location) */}
      <div className="absolute top-0 left-0 right-0 p-4 space-y-4 z-10 pointer-events-none">

        {/* Floating Search Bar */}
        <div className="pointer-events-auto shadow-2xl shadow-black/20">
          <PlaceSearchBar
            onPlaceSelect={handlePlaceSelect}
            placeholder="Konum ara..."
            className="w-full"
          />
        </div>

      </div>

      {/* 3. Floating Action Buttons (Right Side) */}
      <div className="absolute top-24 right-4 flex flex-col gap-3 z-10 pointer-events-none">
        {/* Locate Me Button */}
        {isLoaded && (
          <button
            onClick={handleLocateMe}
            disabled={isLocating}
            className="pointer-events-auto w-12 h-12 flex items-center justify-center bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl hover:bg-white/20 active:scale-95 transition-all text-white disabled:opacity-50"
          >
            {isLocating ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S5.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* 4. Bottom Info Layer */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none z-10">

        {/* Helper Hint Pill */}
        {showHint && !selectedLocation && (
          <div className="bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-medium border border-white/10 shadow-lg animate-fade-in">
            Haritaya tıkla veya ara
          </div>
        )}

        {/* Selected Location Card */}
        {selectedLocation && (
          <div className="pointer-events-auto bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-2xl mx-4 max-w-sm w-full border border-white/50 animate-slide-up">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {isGeocodingAddress ? 'Adres alınıyor...' : 'Konum Seçildi'}
                </p>
                <p className="text-xs text-slate-500 truncate font-mono">
                  {selectedLocation.lat.toFixed(5)}, {selectedLocation.lng.toFixed(5)}
                </p>
              </div>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </div>
          </div>
        )}
      </div>

      {/* 5. Notifications/Toasts */}
      {locationError && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-500/90 backdrop-blur-md text-white px-4 py-2 rounded-xl text-sm shadow-xl z-50 animate-bounce-in">
          {locationError}
        </div>
      )}

      {/* Loading State */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-md z-20">
          <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
