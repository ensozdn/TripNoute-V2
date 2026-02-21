/**
 * DASHBOARD V2 - With ActiveJourneyContext Integration
 * 
 * Wraps page with ActiveJourneyProvider
 * Uses JourneyHub.v2
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';
import { ActiveJourneyProvider } from '@/contexts/ActiveJourneyContext';
import { tripServiceV2 } from '@/services/firebase/TripService.v2';
import { Trip } from '@/types/trip.v2';
import ProtectedRoute from '@/components/ProtectedRoute';
import JourneyHubV2 from '@/components/journey/JourneyHub.v2';
import { Plus, Menu, X, Locate } from 'lucide-react';

const MapboxMapV2 = dynamic(() => import('@/components/MapboxMap.v2'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-900">
      <p className="text-slate-400">Loading map...</p>
    </div>
  ),
});

function DashboardContent() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    const loadTrips = async () => {
      if (user) {
        try {
          const userTrips = await tripServiceV2.getUserTrips(user.uid);
          setTrips(userTrips);
          console.log('✅ Loaded trips:', userTrips.length);
        } catch (error) {
          console.error('❌ Error loading trips:', error);
        } finally {
          setLoadingTrips(false);
        }
      }
    };

    loadTrips();
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleLocateMe = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Location:', position.coords);
          setIsLocating(false);
        },
        (error) => {
          console.error('Location error:', error);
          setIsLocating(false);
        }
      );
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Map Background */}
      <div className="absolute inset-0">
        <MapboxMapV2 />
      </div>

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-20 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              TripNoute
            </h1>
            {user && (
              <span className="text-sm text-muted-foreground">
                {user.email}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Locate Button */}
            <button
              onClick={handleLocateMe}
              disabled={isLocating}
              className="p-2 rounded-lg bg-background border border-border hover:bg-muted transition-colors disabled:opacity-50"
              title="Locate me"
            >
              <Locate className={`w-5 h-5 ${isLocating ? 'animate-pulse' : ''}`} />
            </button>

            {/* Add Place Button */}
            <button
              onClick={() => router.push('/places/add')}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Add Place</span>
            </button>

            {/* Menu Button */}
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg bg-background border border-border hover:bg-muted transition-colors"
            >
              {showMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Side Menu */}
      {showMenu && (
        <aside className="absolute top-16 right-4 z-20 w-64 bg-background border border-border rounded-lg shadow-lg p-4">
          <div className="space-y-2">
            <div className="pb-2 border-b border-border">
              <p className="text-sm font-medium">Trips: {trips.length}</p>
              {loadingTrips && (
                <p className="text-xs text-muted-foreground">Loading...</p>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
            >
              Logout
            </button>
          </div>
        </aside>
      )}

      {/* Journey Hub - Refactored V2 */}
      <JourneyHubV2 />
    </div>
  );
}

export default function DashboardPageV2() {
  return (
    <ProtectedRoute>
      <ActiveJourneyProvider>
        <DashboardContent />
      </ActiveJourneyProvider>
    </ProtectedRoute>
  );
}
