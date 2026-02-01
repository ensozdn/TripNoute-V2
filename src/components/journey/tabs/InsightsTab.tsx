/**
 * InsightsTab Component
 * 
 * Travel statistics dashboard.
 * Single Responsibility: Only renders insights/stats view.
 */

'use client';

import { MapPin, Globe, Camera, Route, Calendar } from 'lucide-react';
import { JourneyStats, PlaceFrequency } from '@/types/journey';
import StatCard from '../insights/StatCard';
import PlacesChart from '../insights/PlacesChart';

interface InsightsTabProps {
  stats: JourneyStats;
  placeFrequencies: PlaceFrequency[];
}

export default function InsightsTab({
  stats,
  placeFrequencies,
}: InsightsTabProps) {
  // Format distance
  const formatDistance = (km: number): string => {
    if (km < 1) return '0 km';
    if (km >= 1000) return `${(km / 1000).toFixed(1)}k km`;
    return `${Math.round(km)} km`;
  };

  // Format date range
  const formatDateRange = (): string => {
    if (!stats.firstTripDate || !stats.lastTripDate) return 'No trips yet';

    const first = stats.firstTripDate.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    });
    const last = stats.lastTripDate.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    });

    return first === last ? first : `${first} - ${last}`;
  };

  return (
    <div>
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCard
          icon={<MapPin className="w-5 h-5 text-red-400" />}
          label="Places"
          value={stats.totalPlaces}
          subtitle={`${stats.citiesVisited} cities`}
        />
        <StatCard
          icon={<Globe className="w-5 h-5 text-blue-400" />}
          label="Countries"
          value={stats.countriesVisited}
        />
        <StatCard
          icon={<Camera className="w-5 h-5 text-purple-400" />}
          label="Photos"
          value={stats.totalPhotos}
        />
        <StatCard
          icon={<Route className="w-5 h-5 text-green-400" />}
          label="Distance"
          value={formatDistance(stats.totalDistance)}
        />
      </div>

      {/* Date Range Card */}
      <div className="p-4 rounded-2xl bg-white/10 border border-white/20 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">
              Journey Period
            </p>
            <p className="text-white font-medium">
              {formatDateRange()}
            </p>
          </div>
        </div>
      </div>

      {/* Places Frequency Chart */}
      <PlacesChart data={placeFrequencies} />
    </div>
  );
}
