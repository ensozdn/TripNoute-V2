/**
 * TripNoute v2 - Dashboard Page
 * 
 * Main dashboard for authenticated users.
 * Shows user profile, statistics, and recent places.
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="bg-[#0f0f14] border-b border-slate-800/50">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20">
                T
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">TripNoute</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-slate-500 text-sm">Welcome, {user.displayName}!</span>
              <Button variant="ghost" onClick={handleLogout} className="text-slate-400 hover:text-white hover:bg-transparent">
                Logout
              </Button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Dashboard Title */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent mb-2">Dashboard</h1>
          <p className="text-slate-500">Track your travel memories and adventures</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="p-6 bg-[#0f0f14] border-slate-800/50 hover:border-slate-700/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <span className="text-2xl">📍</span>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">
                  {user.stats?.totalPlaces || 0}
                </p>
                <p className="text-slate-500 text-sm">Places Visited</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-[#0f0f14] border-slate-800/50 hover:border-slate-700/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <span className="text-2xl">🌍</span>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">
                  {user.stats?.countriesVisited || 0}
                </p>
                <p className="text-slate-500 text-sm">Countries</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-[#0f0f14] border-slate-800/50 hover:border-slate-700/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <span className="text-2xl">📸</span>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">
                  {user.stats?.totalPhotos || 0}
                </p>
                <p className="text-slate-500 text-sm">Photos</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card className="p-8 bg-[#0f0f14] border-slate-800/50 hover:border-slate-700/50 transition-colors">
            <h2 className="text-2xl font-bold mb-3 text-white">Add New Place</h2>
            <p className="text-slate-500 mb-6 text-sm">
              Document a new location you've visited with photos and notes.
            </p>
            <Button size="lg" className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all">
              Add Place
            </Button>
          </Card>

          <Card className="p-8 bg-[#0f0f14] border-slate-800/50 hover:border-slate-700/50 transition-colors">
            <h2 className="text-2xl font-bold mb-3 text-white">View Map</h2>
            <p className="text-slate-500 mb-6 text-sm">
              See all your visited places on an interactive world map.
            </p>
            <Button size="lg" className="w-full bg-slate-800/50 hover:bg-slate-700/50 text-white border border-slate-700/50 hover:border-slate-600/50 transition-all">
              Open Map
            </Button>
          </Card>
        </div>

        {/* Recent Places */}
        <div>
          <h2 className="text-2xl font-bold mb-6 text-white">Recent Places</h2>
          <Card className="p-12 text-center bg-[#0f0f14] border-slate-800/50">
            <div className="w-16 h-16 bg-slate-800/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🗺️</span>
            </div>
            <p className="text-lg text-slate-300 font-medium mb-2">No places yet!</p>
            <p className="text-slate-500 text-sm">Start your journey by adding your first place.</p>
          </Card>
        </div>
      </main>
    </div>
  );
}
