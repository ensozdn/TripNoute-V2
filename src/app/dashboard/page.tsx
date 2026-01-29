'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';
import { databaseService } from '@/lib/database';
import { getMapboxService } from '@/services/maps/MapboxService';
import { journeyDatabaseService } from '@/services/firebase/JourneyDatabaseService';
import { Place } from '@/types';
import { Journey } from '@/types/journeyData';
import ProtectedRoute from '@/components/ProtectedRoute';
import { JourneyHub } from '@/components/journey';
import { Plus, Menu, X, Locate } from 'lucide-react';

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
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const allPlacesForMap = useMemo(() => {
    return places;
  }, [places]);

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        try {
          const placesResponse = await databaseService.getUserPlaces(user.uid);
          setPlaces(placesResponse.items);

          const journeysResponse = await journeyDatabaseService.getUserJourneys(user.uid);
          setJourneys(journeysResponse);
        } catch (error) {
          console.error('Error loading data:', error);
        } finally {
          setLoadingPlaces(false);
        }
      }
    };

    loadData();
  }, [user]);

  useEffect(() => {
    const mapboxService = getMapboxService();
    const map = mapboxService.getMap();

    if (!map) return;

    const startRotation = () => {
      if (map.getZoom() < 3) {
        setTimeout(() => {
          mapboxService.startSlowRotation();
        }, 1000);
      }
    };

    if (map.isStyleLoaded()) {
      startRotation();
    } else {
      map.once('style.load', startRotation);
    }

    return () => {
      mapboxService.stopRotation();
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = () => {
      if (openMenuId) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  useEffect(() => {
    const mapboxService = getMapboxService();
    const map = mapboxService.getMap();

    if (!map || journeys.length === 0) return;

    const renderJourneys = () => {
      mapboxService.clearAllJourneys();
      mapboxService.renderAllJourneys(journeys);
    };

    if (map.isStyleLoaded()) {
      renderJourneys();
    } else {
      map.once('style.load', renderJourneys);
    }
  }, [journeys]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleMarkerClick = (place: Place) => {
    setSelectedPlace(place);

    const mapboxService = getMapboxService();
    mapboxService.focusOnPlace(place.id, allPlacesForMap, {
      zoom: 15,
      pitch: 45,
      bearing: 0,
      duration: 2000
    });
  };

  const handlePlaceDelete = async (placeId: string): Promise<void> => {
    try {
      setPlaces(prevPlaces => prevPlaces.filter(p => p.id !== placeId));

      if (selectedPlace?.id === placeId) {
        setSelectedPlace(null);
      }

      const mapboxService = getMapboxService();
      mapboxService.removeMarker(placeId);

      const remainingPlaces = places.filter(p => p.id !== placeId);
      if (remainingPlaces.length > 1) {
        mapboxService.clearRouteLines();
        mapboxService.drawRouteLines(remainingPlaces);
      } else {
        mapboxService.clearRouteLines();
      }

      await databaseService.deletePlace(placeId);

      console.log('Place deleted successfully');
    } catch (error) {
      console.error('Failed to delete place:', error);

      const response = await databaseService.getUserPlaces(user!.uid);
      setPlaces(response.items);

      throw error;
    }
  };

  const handlePlaceEdit = (place: Place): void => {
    router.push(`/places/edit/${place.id}`);
  };

  const handleGoToMyLocation = async (): Promise<void> => {
    if (!('geolocation' in navigator)) {
      alert('Tarayiciniz konum hizmetlerini desteklemiyor.');
      return;
    }

    const isSecureContext = window.isSecureContext;
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    console.log('Secure Context:', isSecureContext);
    console.log('Is Localhost:', isLocalhost);
    console.log('Hostname:', window.location.hostname);
    console.log('Protocol:', window.location.protocol);

    if (!isSecureContext && !isLocalhost) {
      alert('Konum servisi sadece HTTPS baglantislarinda calisir. Mobile test icin ngrok veya HTTPS kullanin.');
      return;
    }

    setIsLocating(true);

    try {
      console.log('Requesting location...');
      const mapboxService = getMapboxService();
      const result = await mapboxService.flyToUserLocation(14);

      if (!result) {
        console.warn('Could not get user location');
        alert('Konumunuz alinamadi. GPS acik mi kontrol edin.');
      } else {
        console.log('Location success:', result);
      }
    } catch (error) {
      console.error('Error getting user location:', error);
      alert('Konum hatasi. Console loglari kontrol edin.');
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="relative w-full h-screen overflow-hidden bg-slate-900">
        <div className="absolute top-0 left-0 right-0 bottom-0">
          {loadingPlaces ? (
            <div className="w-full h-full flex items-center justify-center bg-slate-900">
              <p className="text-slate-400">Loading your journey...</p>
            </div>
          ) : (
            <MapboxMap
              places={allPlacesForMap}
              selectedPlace={selectedPlace}
              onMarkerClick={handleMarkerClick}
              zoom={2}
              style="mapbox://styles/mapbox/satellite-streets-v12"
              className="absolute top-0 left-0 w-full h-screen"
            />
          )}
        </div>

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

        <div className="absolute top-4 right-4 z-40 flex items-center gap-2">
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

          <button
            onClick={() => setShowMenu(!showMenu)}
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-2.5 shadow-2xl shadow-black/20 hover:bg-white/20 transition-all"
          >
            {showMenu ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
          </button>
        </div>

        {showMenu && (
          <div className="absolute top-16 right-4 z-40 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl shadow-black/20 overflow-hidden min-w-[200px]">
            <div className="p-4 space-y-3">
              <p className="text-sm text-white/80 font-medium">Hi, {user?.displayName?.split(' ')[0] || 'Traveler'}!</p>
              <button
                onClick={handleLogout}
                className="w-full text-left text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all py-2 px-3 rounded-lg"
              >
                Logout
              </button>
            </div>
          </div>
        )}

        <JourneyHub
          places={places}
          selectedPlaceId={selectedPlace?.id}
          onPlaceSelect={handleMarkerClick}
          onPlaceDelete={handlePlaceDelete}
          onPlaceEdit={handlePlaceEdit}
        />

        <Link
          href="/places/add"
          className="absolute bottom-24 right-6 sm:right-8 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-2xl shadow-blue-500/50 flex items-center justify-center transition-all hover:scale-110 active:scale-95 group"
        >
          <Plus className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-300" />
        </Link>

      </div>
    </ProtectedRoute>
  );
}
