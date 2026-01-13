/**
 * TripNoute v2 - Map View Page
 * 
 * Interactive map showing all user's visited places.
 * Hibrit Model: Mapbox (UI/Görsellik) + Google Places (Data/Search)
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { databaseService } from '@/lib/database';
import { Place } from '@/types';
import ProtectedRoute from '@/components/ProtectedRoute';
import MapboxMap from '@/components/MapboxMap';
import PlaceSearchBar from '@/components/PlaceSearchBar';
import type { GooglePlaceResult } from '@/types/maps';

export default function MapPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | undefined>(undefined);

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

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  // Google Places arama sonucu seçilince
  const handlePlaceSelect = (place: GooglePlaceResult) => {
    console.log('Selected place from search:', place);
    // Haritayı bu konuma götür
    setMapCenter([place.location.lng, place.location.lat]);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen relative bg-slate-900">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-tl from-blue-600/20 via-transparent to-transparent"></div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col h-screen">
          {/* Header */}
          <header className="border-b border-white/10 bg-black/10 backdrop-blur-sm">
            <div className="container mx-auto px-6 py-5">
              <nav className="flex items-center justify-between">
                <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <Image 
                    src="/tripnoute-logo.png" 
                    alt="TripNoute Logo" 
                    width={40} 
                    height={40}
                    className="rounded-xl"
                  />
                  <span className="text-xl font-semibold text-white">TripNoute</span>
                </Link>
                <div className="flex items-center gap-6">
                  <Link href="/dashboard" className="text-slate-400 hover:text-white text-sm transition-colors">
                    Dashboard
                  </Link>
                  <span className="text-slate-400 text-sm">Welcome, {user?.displayName}!</span>
                  <button onClick={handleLogout} className="text-slate-400 hover:text-white text-sm transition-colors">
                    Logout
                  </button>
                </div>
              </nav>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 container mx-auto px-6 py-8">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-white mb-3">Map View</h1>
              <p className="text-slate-300">Explore all your visited places on the map</p>
            </div>

            {loading ? (
              <div className="h-[600px] rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                <div className="text-center">
                  <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent mb-4"></div>
                  <p className="text-white text-lg">Loading places...</p>
                </div>
              </div>
            ) : places.length === 0 ? (
              <div className="h-[600px] rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
                {/* Places List Sidebar */}
                <div className="lg:col-span-1 rounded-2xl bg-white/10 border border-white/20 overflow-hidden flex flex-col">
                  {/* Search Bar */}
                  <div className="p-4 border-b border-white/10">
                    <PlaceSearchBar 
                      onPlaceSelect={handlePlaceSelect}
                      placeholder="Yer ara..."
                    />
                  </div>

                  {/* Places Header */}
                  <div className="p-6 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white">Your Places</h2>
                    <p className="text-slate-400 text-sm mt-1">{places.length} locations</p>
                  </div>

                  {/* Places List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {places.map((place) => (
                      <button
                        key={place.id}
                        onClick={() => setSelectedPlace(place)}
                        className={`w-full text-left p-4 rounded-xl transition-all ${
                          selectedPlace?.id === place.id
                            ? 'bg-blue-500/30 border-2 border-blue-500'
                            : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                        }`}
                      >
                        <h3 className="text-white font-semibold mb-1">{place.title}</h3>
                        <p className="text-slate-300 text-sm flex items-center gap-2">
                          <span>📍</span>
                          {place.address.city}, {place.address.country}
                        </p>
                        <p className="text-slate-500 text-xs mt-2">
                          {new Date(place.visitDate.seconds * 1000).toLocaleDateString()}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Map Area */}
                <div className="lg:col-span-2 rounded-2xl bg-white/10 border border-white/20 overflow-hidden flex flex-col">
                  <div className="flex-1 relative min-h-0">
                    <MapboxMap
                      places={places}
                      selectedPlace={selectedPlace}
                      onMarkerClick={setSelectedPlace}
                      center={mapCenter}
                      zoom={2}
                      style="mapbox://styles/mapbox/streets-v12"
                      className="w-full h-full"
                    />
                  </div>

                  {/* Selected Place Info */}
                  {selectedPlace && (
                    <div className="p-6 border-t border-white/10 bg-black/20">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-2">
                            {selectedPlace.title}
                          </h3>
                          <p className="text-slate-300 text-sm mb-3">
                            📍 {selectedPlace.address.formatted || `${selectedPlace.address.city}, ${selectedPlace.address.country}`}
                          </p>
                          {selectedPlace.description && (
                            <p className="text-slate-400 text-sm mb-4">
                              {selectedPlace.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-slate-500">
                            <span>
                              📅 {new Date(selectedPlace.visitDate.seconds * 1000).toLocaleDateString()}
                            </span>
                            {selectedPlace.photos.length > 0 && (
                              <span>📸 {selectedPlace.photos.length} photos</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href={`/places/edit/${selectedPlace.id}`}
                            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-all"
                          >
                            Edit
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
