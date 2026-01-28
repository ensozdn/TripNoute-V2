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
import { JourneyHub } from '@/components/journey';
import { Plus, MapPin, Menu, X, Locate } from 'lucide-react';
import TripCreationWizard from '@/components/journey/TripCreationWizard';

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
  const [isLocating, setIsLocating] = useState(false);
  const [showTripWizard, setShowTripWizard] = useState(false);

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

  // Cinematic Globe Rotation - Start after map loads
  useEffect(() => {
    const mapboxService = getMapboxService();
    const map = mapboxService.getMap();

    if (!map) return;

    // Wait for style to load, then start rotation
    const startRotation = () => {
      // Start rotation if in globe view (zoom < 3), regardless of places count
      if (map.getZoom() < 3) {
        setTimeout(() => {
          mapboxService.startSlowRotation();
        }, 1000); // 1 second delay for dramatic effect
      }
    };

    if (map.isStyleLoaded()) {
      startRotation();
    } else {
      map.once('style.load', startRotation);
    }

    // Cleanup: stop rotation on unmount
    return () => {
      mapboxService.stopRotation();
    };
  }, []); // Empty dependency - only run once on mount



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

  // Handle place deletion with map sync
  const handlePlaceDelete = async (placeId: string): Promise<void> => {
    try {
      // Optimistic UI update
      setPlaces(prevPlaces => prevPlaces.filter(p => p.id !== placeId));

      // Clear selected if deleting current selection
      if (selectedPlace?.id === placeId) {
        setSelectedPlace(null);
      }

      // Remove from map
      const mapboxService = getMapboxService();
      mapboxService.removeMarker(placeId);

      // Re-draw routes with remaining places
      const remainingPlaces = places.filter(p => p.id !== placeId);
      if (remainingPlaces.length > 1) {
        mapboxService.clearRouteLines();
        mapboxService.drawRouteLines(remainingPlaces);
      } else {
        mapboxService.clearRouteLines();
      }

      // Delete from Firebase
      await databaseService.deletePlace(placeId);

      console.log('✅ Place deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete place:', error);

      // Revert optimistic update on error
      const response = await databaseService.getUserPlaces(user!.uid);
      setPlaces(response.items);

      throw error; // Re-throw to let Timeline show error
    }
  };

  // Handle place edit navigation
  const handlePlaceEdit = (place: Place): void => {
    router.push(`/places/edit/${place.id}`);
  };

  // Handle go to my location
  const handleGoToMyLocation = async (): Promise<void> => {
    console.log('🔘 Location button clicked!');

    // Check if geolocation is supported
    if (!('geolocation' in navigator)) {
      alert('❌ Tarayıcınız konum hizmetlerini desteklemiyor.');
      return;
    }

    // Check if on HTTPS or localhost
    const isSecureContext = window.isSecureContext;
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    console.log('🔒 Secure Context:', isSecureContext);
    console.log('🏠 Is Localhost:', isLocalhost);
    console.log('🌐 Hostname:', window.location.hostname);
    console.log('🔗 Protocol:', window.location.protocol);

    if (!isSecureContext && !isLocalhost) {
      alert('⚠️ Konum servisi sadece HTTPS bağlantılarında çalışır.\n\nMobile test için ngrok veya HTTPS kullanın.');
      return;
    }

    setIsLocating(true);

    try {
      console.log('📍 Requesting location...');
      const mapboxService = getMapboxService();
      const result = await mapboxService.flyToUserLocation(14);

      if (!result) {
        console.warn('⚠️ Could not get user location');
        alert('❌ Konumunuz alınamadı. GPS açık mı kontrol edin.');
      } else {
        console.log('✅ Location success:', result);
      }
    } catch (error) {
      console.error('❌ Error getting user location:', error);
      alert('❌ Konum hatası. Console logları kontrol edin.');
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="relative w-full h-screen overflow-hidden bg-slate-900">
        {/* Full-Bleed Map Background */}
        <div className="absolute top-0 left-0 right-0 bottom-0">
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
              style="mapbox://styles/mapbox/satellite-streets-v12"
              className="absolute top-0 left-0 w-full h-screen"
            />
          )}
        </div>

        {/* Floating Logo Only - Minimal Design */}
        <header className="absolute top-4 left-4 z-40">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity group">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-2.5 shadow-2xl shadow-black/20 group-hover:bg-white/20 transition-all">
              <Image
                src="/tripnoute-logo.png"
                alt="TripNoute"
                width={28}
                height={28}
                className="rounded-lg"
              />
            </div>
          </Link>
        </header>

        {/* Top Right Controls */}
        <div className="absolute top-4 right-4 z-40 flex items-center gap-2">
          {/* My Location Button */}
          <button
            onClick={handleGoToMyLocation}
            disabled={isLocating}
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-2.5 shadow-2xl shadow-black/20 hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Konumuma Git"
          >
            {isLocating ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Locate className="w-5 h-5 text-white" />
            )}
          </button>

          {/* Menu Button */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-2.5 shadow-2xl shadow-black/20 hover:bg-white/20 transition-all"
          >
            {showMenu ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
          </button>
        </div>

        {/* Floating Menu Dropdown */}
        {showMenu && (
          <div className="absolute top-16 right-4 z-40 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl shadow-black/20 overflow-hidden min-w-[200px]">
            <div className="p-4 space-y-3">
              <p className="text-sm text-white/80 font-medium">Hi, {user?.displayName?.split(' ')[0] || 'Traveler'}! 👋</p>
              <button
                onClick={handleLogout}
                className="w-full text-left text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all py-2 px-3 rounded-lg"
              >
                Logout
              </button>
            </div>
          </div>
        )}

        {/* Journey Hub - Premium Tabbed Interface */}
        {places.length > 0 && (
          <JourneyHub
            places={places}
            selectedPlaceId={selectedPlace?.id}
            onPlaceSelect={handleMarkerClick}
            onPlaceDelete={handlePlaceDelete}
            onPlaceEdit={handlePlaceEdit}
          />
        )}

        {/* Floating Action Button - Open Wizard */}
        <button
          onClick={() => setShowTripWizard(true)}
          className="absolute bottom-24 right-6 sm:right-8 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-2xl shadow-blue-500/50 flex items-center justify-center transition-all hover:scale-110 active:scale-95 group"
        >
          <Plus className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-300" />
        </button>

        {/* Trip Creation Wizard Modal */}
        <TripCreationWizard
          isOpen={showTripWizard}
          onClose={() => setShowTripWizard(false)}
        />

      </div>
    </ProtectedRoute>
  );
}


