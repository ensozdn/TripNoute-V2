/**
 * TripNoute v2 - Dashboard Page (Refactored)
 * 
 * Premium Travel Journal Experience
 * Full-bleed map with floating glassmorphic UI elements
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
import { Plus, MapPin, Globe2, Camera, Menu, X } from 'lucide-react';

// Dynamic import for MapboxMap to avoid SSR issues
const MapboxMap = dynamic(() => import('@/components/MapboxMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-900">
      <p className="text-slate-400">Loading map...</p>
    </div>
  ),
});

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [showMenu, setShowMenu] = useState(false);

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
      const timer = setTimeout(() => {
        try {
          mapboxService.drawRouteLines(places);
          mapboxService.focusOnRoute(places);
        } catch (error) {
          console.error('Error drawing routes:', error);
        }
      }, 1000);

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

  const handleMarkerClick = (place: Place) => {
    setSelectedPlace(place);
    
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
      <div className="relative w-full h-screen overflow-hidden">
        {/* Full-Bleed Map Background */}
        <div className="absolute inset-0">
          {loadingPlaces ? (
            <div className="w-full h-full flex items-center justify-center bg-slate-900">
              <p className="text-slate-400">Loading your journey...</p>
            </div>
          ) : places.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 p-8">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-6">
                <MapPin className="w-10 h-10 text-white/60" />
              </div>
              <h2 className="text-2xl font-semibold text-white mb-2">Start Your Journey</h2>
              <p className="text-slate-400 text-center mb-8">Add your first place to see it on the map</p>
              <Link 
                href="/places/add" 
                className="py-3 px-6 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-medium transition-all"
              >
                Add First Place
              </Link>
            </div>
          ) : (
            <MapboxMap
              places={places}
              selectedPlace={selectedPlace}
              onMarkerClick={handleMarkerClick}
              zoom={2}
              style="mapbox://styles/mapbox/dark-v11"
              className="w-full h-full"
            />
          )}
        </div>

        {/* Glassmorphic Header */}
        <header className="absolute top-0 left-0 right-0 z-40">
          <div className="mx-4 mt-4 rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50">
            <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Image 
                  src="/tripnoute-logo.png" 
                  alt="TripNoute" 
                  width={32} 
                  height={32}
                  className="rounded-lg"
                />
                <span className="text-lg font-semibold text-white hidden sm:inline">TripNoute</span>
              </Link>

              {/* Desktop Nav */}
              <div className="hidden md:flex items-center gap-4">
                <span className="text-sm text-slate-300">Welcome, {user?.displayName}!</span>
                <button 
                  onClick={handleLogout} 
                  className="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Logout
                </button>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                {showMenu ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
              </button>
            </div>

            {/* Mobile Menu */}
            {showMenu && (
              <div className="md:hidden px-4 pb-4 border-t border-white/10">
                <div className="pt-4 space-y-2">
                  <p className="text-sm text-slate-300 mb-2">Welcome, {user?.displayName}!</p>
                  <button 
                    onClick={handleLogout} 
                    className="w-full text-left text-sm text-slate-400 hover:text-white transition-colors py-2"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Floating Stats Cards - Top Right */}
        {places.length > 0 && (
          <div className="absolute top-24 right-4 z-30 flex flex-col gap-3 w-[280px] hidden lg:flex">
            {/* Places Count */}
            <div className="px-4 py-3 rounded-xl bg-slate-900/40 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{places.length}</p>
                  <p className="text-xs text-slate-400">Places Visited</p>
                </div>
              </div>
            </div>

            {/* Countries Count */}
            <div className="px-4 py-3 rounded-xl bg-slate-900/40 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Globe2 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {new Set(places.map(p => p.address.country)).size}
                  </p>
                  <p className="text-xs text-slate-400">Countries</p>
                </div>
              </div>
            </div>

            {/* Photos Count */}
            <div className="px-4 py-3 rounded-xl bg-slate-900/40 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {places.reduce((total, place) => total + place.photos.length, 0)}
                  </p>
                  <p className="text-xs text-slate-400">Photos</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Floating Timeline - Bottom */}
        {places.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 z-30 p-4">
            <div className="rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50">
              <TravelTimeline
                places={places}
                selectedPlaceId={selectedPlace?.id}
                onPlaceSelect={handleMarkerClick}
                className="p-4"
              />
            </div>
          </div>
        )}

        {/* Floating Action Button - Add Place */}
        <Link
          href="/places/add"
          className="absolute bottom-24 right-6 sm:bottom-8 sm:right-8 z-40 w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 shadow-2xl shadow-blue-500/50 flex items-center justify-center transition-all hover:scale-110 active:scale-95 group"
        >
          <Plus className="w-6 h-6 text-white group-hover:rotate-90 transition-transform" />
        </Link>

        {/* Mobile Stats - Bottom Sheet */}
        {places.length > 0 && (
          <div className="lg:hidden absolute bottom-52 left-4 right-4 z-30">
            <div className="rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 p-4">
              <div className="flex items-center justify-around">
                <div className="text-center">
                  <p className="text-xl font-bold text-white">{places.length}</p>
                  <p className="text-xs text-slate-400">Places</p>
                </div>
                <div className="w-px h-8 bg-white/10"></div>
                <div className="text-center">
                  <p className="text-xl font-bold text-white">
                    {new Set(places.map(p => p.address.country)).size}
                  </p>
                  <p className="text-xs text-slate-400">Countries</p>
                </div>
                <div className="w-px h-8 bg-white/10"></div>
                <div className="text-center">
                  <p className="text-xl font-bold text-white">
                    {places.reduce((total, place) => total + place.photos.length, 0)}
                  </p>
                  <p className="text-xs text-slate-400">Photos</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
