/**
 * TripNoute v2 - Dashboard Page
 * 
 * Main dashboard for authenticated users.
 * Shows user profile, statistics, and recent places.
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

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="p-10 rounded-2xl bg-white/10 border border-white/20 hover:bg-white/[0.12] transition-all">
            <h2 className="text-2xl font-bold mb-3 text-white">Add New Place</h2>
            <p className="text-slate-300 mb-8 leading-relaxed">
              Document a new location you've visited with photos and notes.
            </p>
            <Link href="/places/add" className="block w-full py-4 px-6 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-all text-center">
              Add Place
            </Link>
          </div>

          <div className="p-10 rounded-2xl bg-white/10 border border-white/20 hover:bg-white/[0.12] transition-all">
            <h2 className="text-2xl font-bold mb-3 text-white">View Map</h2>
            <p className="text-slate-300 mb-8 leading-relaxed">
              See all your visited places on an interactive world map.
            </p>
            <Link href="/map" className="block w-full py-4 px-6 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-medium transition-all text-center">
              Open Map
            </Link>
          </div>
        </div>

        {/* Recent Places */}
        <div>
          <h2 className="text-2xl font-bold mb-8 text-white">Recent Places</h2>
          
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
