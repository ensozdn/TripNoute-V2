/**
 * TripNoute v2 - GoogleMap Component
 * 
 * Interactive Google Maps component with markers.
 */

'use client';

import { useEffect } from 'react';
import { useGoogleMap } from '@/hooks/useGoogleMap';
import { Place } from '@/types';
import { MarkerData } from '@/lib/googleMaps';

interface GoogleMapProps {
  places: Place[];
  selectedPlace: Place | null;
  onMarkerClick?: (place: Place) => void;
}

export default function GoogleMap({
  places,
  selectedPlace,
  onMarkerClick,
}: GoogleMapProps) {
  // Convert places to markers
  const markers: MarkerData[] = places
    .filter((place) => place.location?.lat && place.location?.lng)
    .map((place) => ({
      id: place.id,
      position: {
        lat: place.location.lat,
        lng: place.location.lng,
      },
      title: place.title,
      description: `${place.address.city}, ${place.address.country}`,
    }));

  // Initialize map
  const { mapRef, map, isLoading, error, isConfigured } = useGoogleMap({
    config: {
      center: { lat: 20, lng: 0 },
      zoom: 2,
    },
    markers,
    fitBounds: markers.length > 1,
    onMarkerClick: (markerId) => {
      const place = places.find((p) => p.id === markerId);
      if (place && onMarkerClick) {
        onMarkerClick(place);
      }
    },
  });

  // Center on selected place
  useEffect(() => {
    if (!map || !selectedPlace?.location) return;

    map.panTo({
      lat: selectedPlace.location.lat,
      lng: selectedPlace.location.lng,
    });
    map.setZoom(12);
  }, [map, selectedPlace]);

  // Show error state
  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
        <div className="text-center max-w-md px-6">
          <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-6xl">⚠️</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">Map Error</h3>
          <p className="text-slate-300 mb-6">{error}</p>
        </div>
      </div>
    );
  }

  // Show not configured state
  if (!isConfigured) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
        <div className="text-center max-w-md px-6">
          <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-6xl">🗺️</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">
            Google Maps Not Configured
          </h3>
          <p className="text-slate-300 mb-6 leading-relaxed">
            To enable interactive map view, add your Google Maps API key to the environment variables.
          </p>
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 mb-6">
            <p className="text-blue-300 text-sm font-mono text-left">
              NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
            </p>
          </div>
          <a
            href="https://developers.google.com/maps/documentation/javascript/get-api-key"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block py-3 px-6 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-all"
          >
            Get API Key
          </a>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent mb-4"></div>
          <p className="text-white text-lg">Loading map...</p>
        </div>
      </div>
    );
  }

  // Render map
  return (
    <div ref={mapRef} className="absolute inset-0 w-full h-full" />
  );
}
