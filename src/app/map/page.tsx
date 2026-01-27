/**
 * TripNoute v2 - Map View Page
 * 
 * Interactive map showing all user's visited places.
 * Hibrit Model: Mapbox (UI/Görsellik) + Google Places (Data/Search)
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { databaseService } from '@/lib/database';
import { Place } from '@/types';
import ProtectedRoute from '@/components/ProtectedRoute';
import MapboxMap from '@/components/MapboxMap';

export default function MapPage() {
  const { user } = useAuth();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  useEffect(() => {
    const loadPlaces = async () => {
      if (user) {
        try {
          const response = await databaseService.getUserPlaces(user.uid);
          setPlaces(response.items);
        } catch (error) {
          console.error('Error loading places:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadPlaces();
  }, [user]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen relative bg-slate-900 flex flex-col">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-tl from-blue-600/20 via-transparent to-transparent"></div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col h-screen">
          {/* Header - HIDDEN - only map visible */}
          <header className="hidden h-16 border-b border-white/10 bg-black/10 backdrop-blur-sm px-6 py-4 flex items-center justify-between flex-shrink-0">
            <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity z-20">
              <Image 
                src="/tripnoute-logo.png" 
                alt="TripNoute Logo" 
                width={40} 
                height={40}
                className="rounded-xl"
              />
            </Link>
          </header>

          {/* Main Content - Full Map */}
          <main className="flex-1 relative w-full">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent mb-4"></div>
                  <p className="text-white text-lg">Loading places...</p>
                </div>
              </div>
            ) : places.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-5xl">🗺️</span>
                  </div>
                  <p className="text-xl text-white font-medium mb-2">No places to show</p>
                  <p className="text-slate-300 mb-6">Add your first place to see it on the map</p>
                  <Link
                    href="/places/add"
                    className="inline-block py-3 px-8 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-all"
                  >
                    Add Place
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {/* Full Screen Map */}
                <MapboxMap
                  places={places}
                  selectedPlace={selectedPlace}
                  onMarkerClick={setSelectedPlace}
                  zoom={2}
                  style="mapbox://styles/mapbox/streets-v12"
                  className="w-full h-full"
                />
              </>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
