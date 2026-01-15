/**
 * TripNoute v2 - Dashboard Page
 * 
 * Main dashboard for authenticated users.
 * Shows user profile, statistics, and recent places with integrated map.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';
import { databaseService } from '@/lib/database';
import { getMapboxService } from '@/services/maps/MapboxService';
import { Place } from '@/types';
import ProtectedRoute from '@/components/ProtectedRoute';
import TravelTimeline from '@/components/timeline/TravelTimeline';

// Dynamic import for MapboxMap to avoid SSR issues
const MapboxMap = dynamic(() => import('@/components/MapboxMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-800/50 rounded-2xl">
      <p className="text-slate-400">Loading map...</p>
    </div>
  ),
});

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
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
          setLoadingPlaces(false);
        }
      }
    };

    loadPlaces();
  }, [user]);

  // Draw route lines when places change
  useEffect(() => {
    const mapboxService = getMapboxService();
    
    if (places.length > 0) {
      // Wait a bit for map to be ready
      const timer = setTimeout(() => {
        mapboxService.drawRouteLines(places);
        mapboxService.focusOnRoute(places);
      }, 500);

      return () => {
        clearTimeout(timer);
        mapboxService.clearRouteLines();
      };
    }

    return () => {
      mapboxService.clearRouteLines();
    };
  }, [places]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (openMenuId) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleDeletePlace = async (placeId: string) => {
    if (!confirm('Are you sure you want to delete this place?')) {
      return;
    }

    setDeletingId(placeId);
    try {
      await databaseService.deletePlace(placeId);
      // Remove from local state
      setPlaces(places.filter(p => p.id !== placeId));
      setOpenMenuId(null);
    } catch (error) {
      console.error('Error deleting place:', error);
      alert('Failed to delete place. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditPlace = (placeId: string) => {
    router.push(`/places/edit/${placeId}`);
  };

  const handleMarkerClick = (place: Place) => {
    setSelectedPlace(place);
    
    // Focus on the clicked place with cinematic camera angle
    const mapboxService = getMapboxService();
    mapboxService.focusOnPlace(place.id, places, {
      zoom: 15,
      pitch: 45,
      bearing: 0,
      duration: 2000
    });
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen relative bg-slate-900">
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-tl from-blue-600/20 via-transparent to-transparent"></div>
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-white/10 bg-black/10 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-5">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image 
                src="/tripnoute-logo.png" 
                alt="TripNoute Logo" 
                width={40} 
                height={40}
                className="rounded-xl"
              />
              <span className="text-xl font-semibold text-white">TripNoute</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/map" className="text-slate-400 hover:text-white text-sm transition-colors">
                Map
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
      <main className="container mx-auto px-6 py-16">
        {/* Dashboard Title */}
        <div className="mb-16 text-center">
          <h1 className="text-5xl font-bold text-white mb-4">Dashboard</h1>
          <p className="text-slate-300 text-lg">Track your travel memories and adventures</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="p-8 rounded-2xl bg-white/10 border border-white/20 hover:bg-white/[0.12] transition-all">
            <div className="flex items-center gap-5">
              <div className="h-14 w-14 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <span className="text-3xl">📍</span>
              </div>
              <div>
                <p className="text-4xl font-bold text-white mb-1">
                  {places.length}
                </p>
                <p className="text-slate-300 text-sm">Places Visited</p>
              </div>
            </div>
          </div>

          <div className="p-8 rounded-2xl bg-white/10 border border-white/20 hover:bg-white/[0.12] transition-all">
            <div className="flex items-center gap-5">
              <div className="h-14 w-14 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <span className="text-3xl">🌍</span>
              </div>
              <div>
                <p className="text-4xl font-bold text-white mb-1">
                  {new Set(places.map(p => p.address.country)).size}
                </p>
                <p className="text-slate-300 text-sm">Countries</p>
              </div>
            </div>
          </div>

          <div className="p-8 rounded-2xl bg-white/10 border border-white/20 hover:bg-white/[0.12] transition-all">
            <div className="flex items-center gap-5">
              <div className="h-14 w-14 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <span className="text-3xl">📸</span>
              </div>
              <div>
                <p className="text-4xl font-bold text-white mb-1">
                  {places.reduce((total, place) => total + place.photos.length, 0)}
                </p>
                <p className="text-slate-300 text-sm">Photos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Map & Places Section */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {/* Map - Takes 2 columns */}
          <div className="lg:col-span-2">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Your Travel Map</h2>
              <Link 
                href="/map" 
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2"
              >
                Full Screen
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Link>
            </div>
            <div className="rounded-2xl overflow-hidden border border-white/20 bg-slate-800/50" style={{ height: '600px' }}>
              {loadingPlaces ? (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-slate-400">Loading map...</p>
                </div>
              ) : places.length === 0 ? (
                <div className="w-full h-full flex flex-col items-center justify-center p-8">
                  <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-4">
                    <span className="text-4xl">🗺️</span>
                  </div>
                  <p className="text-xl text-white font-medium mb-2">No places yet!</p>
                  <p className="text-slate-400 text-center mb-6">Add your first place to see it on the map</p>
                  <Link 
                    href="/places/add" 
                    className="py-3 px-6 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-all"
                  >
                    Add Place
                  </Link>
                </div>
              ) : (
                <MapboxMap
                  places={places}
                  selectedPlace={selectedPlace}
                  onMarkerClick={handleMarkerClick}
                  zoom={2}
                  style="mapbox://styles/mapbox/streets-v12"
                  className="w-full h-full"
                />
              )}
            </div>
          </div>

          {/* Quick Actions Sidebar - Takes 1 column */}
          <div className="space-y-6">
            <div className="p-8 rounded-2xl bg-white/10 border border-white/20 hover:bg-white/[0.12] transition-all">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">➕</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">Add New Place</h3>
              <p className="text-slate-300 mb-6 text-sm leading-relaxed">
                Document a new location you've visited with photos and notes.
              </p>
              <Link 
                href="/places/add" 
                className="block w-full py-3 px-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-all text-center text-sm"
              >
                Add Place
              </Link>
            </div>

            <div className="p-8 rounded-2xl bg-white/10 border border-white/20">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Total Places</span>
                  <span className="text-white font-semibold">{places.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Countries</span>
                  <span className="text-white font-semibold">
                    {new Set(places.map(p => p.address.country)).size}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Photos</span>
                  <span className="text-white font-semibold">
                    {places.reduce((total, place) => total + place.photos.length, 0)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-400/30">
              <h3 className="text-lg font-bold mb-2 text-white">💡 Tip</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Click on map markers to view place details, or use the full screen map for better navigation.
              </p>
            </div>
          </div>
        </div>

        {/* Travel Timeline */}
        {places.length > 0 && (
          <div className="mb-16">
            <TravelTimeline
              places={places}
              selectedPlaceId={selectedPlace?.id}
              onPlaceSelect={handleMarkerClick}
              className="p-8 rounded-2xl bg-white/10 border border-white/20"
            />
          </div>
        )}

        {/* Recent Places */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white">Recent Places</h2>
            {places.length > 6 && (
              <Link href="/map" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                View all →
              </Link>
            )}
          </div>
          
          {loadingPlaces ? (
            <div className="p-16 rounded-2xl bg-white/10 border border-white/20 text-center">
              <p className="text-slate-300">Loading places...</p>
            </div>
          ) : places.length === 0 ? (
            <div className="p-16 rounded-2xl bg-white/10 border border-white/20 text-center">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🗺️</span>
              </div>
              <p className="text-xl text-white font-medium mb-2">No places yet!</p>
              <p className="text-slate-300">Start your journey by adding your first place.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {places.slice(0, 6).map((place) => (
                <div
                  key={place.id}
                  className="p-6 rounded-2xl bg-white/10 border border-white/20 hover:bg-white/[0.12] transition-all relative"
                >
                  {/* Actions Menu */}
                  <div className="absolute top-4 right-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === place.id ? null : place.id);
                      }}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
                      disabled={deletingId === place.id}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="5" r="2" />
                        <circle cx="12" cy="12" r="2" />
                        <circle cx="12" cy="19" r="2" />
                      </svg>
                    </button>
                    
                    {/* Dropdown Menu */}
                    {openMenuId === place.id && (
                      <div className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-800 border border-white/20 shadow-xl overflow-hidden z-10">
                        <button
                          onClick={() => handleEditPlace(place.id)}
                          className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/10 transition-colors"
                        >
                          Edit Place
                        </button>
                        <button
                          onClick={() => handleDeletePlace(place.id)}
                          disabled={deletingId === place.id}
                          className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        >
                          {deletingId === place.id ? 'Deleting...' : 'Delete Place'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Place Header */}
                  <div className="mb-4 pr-8">
                    <h3 className="text-xl font-bold text-white mb-2">{place.title}</h3>
                    <p className="text-slate-300 text-sm flex items-center gap-2">
                      <span>📍</span>
                      {place.address.city}, {place.address.country}
                    </p>
                  </div>

                  {/* Place Description */}
                  {place.description && (
                    <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                      {place.description}
                    </p>
                  )}

                  {/* Place Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <span className="text-slate-500 text-xs">
                      {new Date(place.visitDate.seconds * 1000).toLocaleDateString()}
                    </span>
                    {place.photos.length > 0 && (
                      <span className="text-slate-500 text-xs flex items-center gap-1">
                        📸 {place.photos.length}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      </div>
    </div>
    </ProtectedRoute>
  );
}
