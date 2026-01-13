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
  const googlePlaces = useRef(getGooglePlacesService());

  const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

  // Marker'ı oluştur (seçili konum varsa)
  const markers = selectedLocation
    ? [
        {
          id: 'selected-location',
          position: selectedLocation,
          title: 'Seçili Konum',
          color: '#10b981',
        },
      ]
    : [];

  // Harita tıklama handler'ı
  const handleMapClick = async (lat: number, lng: number) => {
    console.log('Map clicked:', { lat, lng });
    setSelectedLocation({ lat, lng });

    // Google Reverse Geocoding ile adres al
    setIsGeocodingAddress(true);
    try {
      const address = await googlePlaces.current.reverseGeocode(lat, lng);
      console.log('Reverse geocoded address:', address);
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
    console.log('Place selected from search:', place);
    const location = {
      lat: place.location.lat,
      lng: place.location.lng,
    };
    setSelectedLocation(location);
    onLocationSelect({
      ...location,
      address: place.formattedAddress,
    });
  };

  // Mapbox hook
  const { isLoaded, error, flyTo, flyToUserLocation } = useMapbox(containerRef, {
    accessToken,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: initialLocation ? [initialLocation.lng, initialLocation.lat] : [0, 0],
    zoom: initialLocation ? 14 : 2,
    markers,
    enableUserLocation: true,
    onMapClick: handleMapClick,
  });

  // Selected location değişince haritayı oraya götür
  useEffect(() => {
    if (isLoaded && selectedLocation) {
      flyTo(selectedLocation.lat, selectedLocation.lng, 14);
    }
  }, [selectedLocation, isLoaded, flyTo]);

  if (!accessToken) {
    return (
      <div className={`flex items-center justify-center bg-slate-800/50 rounded-xl ${className}`}>
        <div className="text-center p-8">
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
      <div className={`flex items-center justify-center bg-slate-800/50 rounded-xl ${className}`}>
        <div className="text-center p-8">
          <p className="text-red-400 font-medium">Harita yüklenemedi</p>
          <p className="text-slate-400 text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="space-y-4">
        {/* Search Bar */}
        <PlaceSearchBar
          onPlaceSelect={handlePlaceSelect}
          placeholder="Yer ara veya haritaya tıkla..."
        />

        {/* Map Container */}
        <div className="relative h-[400px] rounded-xl overflow-hidden border border-white/20">
          <div ref={containerRef} className="absolute inset-0 w-full h-full" />

          {/* Loading Overlay */}
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white font-medium">Harita yükleniyor...</p>
              </div>
            </div>
          )}

          {/* My Location Button */}
          {isLoaded && (
            <button
              onClick={() => flyToUserLocation(14)}
              className="absolute top-4 right-4 bg-white hover:bg-slate-50 text-slate-900 p-3 rounded-lg shadow-lg transition-all hover:shadow-xl active:scale-95 z-10"
              title="Konumuma Git"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          )}

          {/* Geocoding Indicator */}
          {isGeocodingAddress && (
            <div className="absolute top-20 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-medium text-slate-900">Adres alınıyor...</p>
              </div>
            </div>
          )}

          {/* Instructions */}
          {isLoaded && !selectedLocation && (
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-3 rounded-lg shadow-lg max-w-xs">
              <p className="text-sm font-medium text-slate-900">
                Konum seçmek için haritaya tıklayın veya yukarıdan arama yapın
              </p>
            </div>
          )}

          {/* Selected Location Info */}
          {isLoaded && selectedLocation && (
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-3 rounded-lg shadow-lg">
              <p className="text-xs text-slate-600 mb-1">Seçili Konum:</p>
              <p className="text-sm font-medium text-slate-900">
                {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
              </p>
            </div>
          )}
        </div>

        {/* Helper Text */}
        <p className="text-sm text-slate-400">
          Haritaya tıklayarak veya yukarıdan arama yaparak konum seçin. Adres otomatik olarak
          alınacak.
        </p>
      </div>
    </div>
  );
}
