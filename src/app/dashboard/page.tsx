'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';
import { databaseService } from '@/lib/database';
import { getMapboxService } from '@/services/maps/MapboxService';
import { journeyDatabaseService } from '@/services/firebase/JourneyDatabaseService';
import { Place } from '@/types';
import { Trip } from '@/types/trip';
import ProtectedRoute from '@/components/ProtectedRoute';
import { JourneyHub } from '@/components/journey';
import SettingsTab from '@/components/journey/tabs/SettingsTab';
import TrippoChat from '@/components/common/TrippoChat';
import { Locate, MapPin, Settings, X } from 'lucide-react';

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
  const [journeys, setJourneys] = useState<Trip[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [mapPinMode, setMapPinMode] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Callback ref for map-pin mode: JourneyCreator passes a handler here
  // so the user can tap the map to drop a waypoint.
  const mapPinCallbackRef = useRef<((name: string, lat: number, lng: number) => void) | null>(null);

  const allPlacesForMap = useMemo(() => places, [places]);

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
      if (map.getZoom() < 4) {
        setTimeout(() => { mapboxService.startSlowRotation(); }, 1000);
      }
    };

    if (map.isStyleLoaded()) {
      startRotation();
    } else {
      map.once('style.load', startRotation);
    }

    return () => { mapboxService.stopRotation(); };
  }, []);

  const [mapReady, setMapReady] = useState(false);

  // Ask the MapboxService to notify us when the style has fully loaded.
  // This is reliable regardless of whether Firebase data or the map loads first.
  useEffect(() => {
    const mapboxService = getMapboxService();
    mapboxService.onMapReady(() => setMapReady(true));
  }, []);

  useEffect(() => {
    const handleClickOutside = () => {
      if (openMenuId) setOpenMenuId(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  useEffect(() => {
    // Both mapReady and journeys must be set before we can render anything.
    if (!mapReady || journeys.length === 0) return;


    const mapboxService = getMapboxService();
    // renderAllJourneys: clears everything first, then renders each journey
    // through the internal queue — guaranteed sequential, no race conditions.
    mapboxService.renderAllJourneys(journeys).catch((err) => {
      console.error('Error rendering journeys:', err);
    });
  }, [mapReady, journeys]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleMarkerClick = (place: Place) => {
    setSelectedPlace(place);
    const mapboxService = getMapboxService();
    mapboxService.focusOnPlace(place.id, allPlacesForMap, {
      zoom: 15, pitch: 45, bearing: 0, duration: 2000
    });
  };

  const handlePlaceDelete = async (placeId: string): Promise<void> => {
    try {
      setPlaces(prevPlaces => prevPlaces.filter(p => p.id !== placeId));
      if (selectedPlace?.id === placeId) setSelectedPlace(null);
      const mapboxService = getMapboxService();
      mapboxService.removeMarker(placeId);
      mapboxService.clearRouteLines();
      await databaseService.deletePlace(placeId);
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

  const handleJourneyCreated = useCallback((journey: Trip) => {
    // State update triggers the render useEffect which calls renderAllJourneys.
    setJourneys((prev) => [journey, ...prev]);
  }, []);

  const handleJourneyUpdated = useCallback((updated: Trip) => {
    // State update triggers the render useEffect which re-renders everything.
    setJourneys((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
  }, []);

  const handleJourneySelect = useCallback((journey: Trip) => {
    const mapboxService = getMapboxService();
    mapboxService.focusOnRoute(
      journey.steps.map((s) => ({ location: { lat: s.coordinates[1], lng: s.coordinates[0] } })),
    );
  }, []);

  const handleJourneyDelete = useCallback(async (journeyId: string) => {
    try {
      setJourneys((prev) => prev.filter((j) => j.id !== journeyId));
      const mapboxService = getMapboxService();
      mapboxService.clearJourney(journeyId);
      await journeyDatabaseService.deleteJourney(journeyId);
    } catch (err) {
      console.error('Failed to delete journey:', err);
    }
  }, []);

  // Called by JourneyCreator when the user taps "Tap on Map".
  // We store the callback; the next map click will forward coords to it.
  const handleRequestMapPin = useCallback(
    (onPinDropped: (name: string, lat: number, lng: number) => void) => {
      mapPinCallbackRef.current = onPinDropped;
      setMapPinMode(true);
    },
    [],
  );

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    if (!mapPinCallbackRef.current) return;
    const cb = mapPinCallbackRef.current;
    mapPinCallbackRef.current = null;
    setMapPinMode(false);

    let name = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=place,locality,neighborhood,address&limit=1&access_token=${token}`,
      );
      if (res.ok) {
        const json = await res.json();
        const feature = json.features?.[0];
        if (feature?.text) name = feature.text;
      }
    } catch {}

    cb(name, lat, lng);
  }, []);

  const handleGoToMyLocation = async (): Promise<void> => {
    if (!('geolocation' in navigator)) {
      alert('Tarayiciniz konum hizmetlerini desteklemiyor.');
      return;
    }

    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!window.isSecureContext && !isLocalhost) {
      alert('Konum servisi sadece HTTPS baglantislarinda calisir.');
      return;
    }

    setIsLocating(true);
    try {
      const mapboxService = getMapboxService();
      const result = await mapboxService.getUserLocation();
      if (!result) {
        alert('Konumunuz alinamadi. GPS acik mi kontrol edin.');
      } else {
        setSelectedPlace(null);
        mapboxService.showUserLocationMarker(result.lat, result.lng);
        mapboxService.stopRotation();
        mapboxService.flyTo(result.lat, result.lng, 14);
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
              onMapClick={handleMapClick}
              zoom={1.5}
              style="mapbox://styles/mapbox/satellite-streets-v12"
              className="absolute top-0 left-0 w-full h-screen"
            />
          )}
        </div>

        <header className="absolute top-5 left-5 z-40">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Image
              src="/tripnoute-logo-v2.jpg"
              alt="TripNoute"
              width={43}
              height={43}
              className="rounded-[10px] shadow-lg shadow-black/20"
            />
            <span className="text-4xl font-bold text-white tracking-tighter drop-shadow-md font-sans">
              TripNoute
            </span>
          </Link>
        </header>

        {mapPinMode && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-500/90 backdrop-blur-sm shadow-xl pointer-events-auto">
            <MapPin className="w-4 h-4 text-white shrink-0" />
            <span className="text-white text-sm font-medium">Tap anywhere on the map</span>
            <button
              onClick={() => { mapPinCallbackRef.current = null; setMapPinMode(false); }}
              className="ml-1 text-white/70 hover:text-white text-xs underline"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="absolute top-4 right-4 z-30 flex flex-col gap-2">
          <button
            onClick={() => setSettingsOpen(true)}
            className="bg-white backdrop-blur-xl border border-black/8 rounded-xl p-2.5 shadow-lg shadow-black/15 hover:bg-slate-50 active:scale-95 transition-all"
            title="Settings"
          >
            <Settings className="w-4 h-4 text-slate-700" />
          </button>
          <button
            onClick={handleGoToMyLocation}
            disabled={isLocating}
            className="bg-white backdrop-blur-xl border border-black/8 rounded-xl p-2.5 shadow-lg shadow-black/15 hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Konumuma Git"
          >
            {isLocating ? (
              <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
            ) : (
              <Locate className="w-4 h-4 text-slate-700" />
            )}
          </button>
          {/* Trippo AI */}
          <TrippoChat
            context={
              journeys.length > 0
                ? `Kullanıcının ${journeys.length} journey'si var. En son: ${journeys[journeys.length - 1]?.name ?? ''}`
                : undefined
            }
          />
        </div>

        {/* Settings overlay */}
        {settingsOpen && (
          <div className="absolute inset-0 z-50 bg-white flex flex-col">
            <div className="flex items-center justify-between px-5 pt-12 pb-4 border-b border-black/8">
              <span className="text-slate-800 font-semibold text-lg">Settings</span>
              <button
                onClick={() => setSettingsOpen(false)}
                className="p-2 rounded-xl bg-black/6 hover:bg-black/10 transition-all"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SettingsTab
                userName={user?.displayName ?? null}
                userEmail={user?.email ?? null}
                userPhoto={user?.photoURL ?? null}
                onLogout={handleLogout}
              />
            </div>
          </div>
        )}

        <JourneyHub
          places={places}
          journeys={journeys}
          selectedPlaceId={selectedPlace?.id}
          onPlaceSelect={handleMarkerClick}
          onPlaceDelete={handlePlaceDelete}
          onPlaceEdit={handlePlaceEdit}
          onJourneyCreated={handleJourneyCreated}
          onJourneySelect={handleJourneySelect}
          onJourneyDelete={handleJourneyDelete}
          onJourneyUpdated={handleJourneyUpdated}
          onRequestMapPin={handleRequestMapPin}
          mapPinMode={mapPinMode}
          userName={user?.displayName}
          userEmail={user?.email}
          userPhoto={user?.photoURL}
          onLogout={handleLogout}
          onAddPlace={() => router.push('/places/add')}
        />

      </div>
    </ProtectedRoute>
  );
}
