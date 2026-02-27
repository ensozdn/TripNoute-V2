'use client';

import { useMemo, useState } from 'react';
import { MapPin, Globe, Camera, Route, Calendar, Layers } from 'lucide-react';
import { JourneyStats, PlaceFrequency } from '@/types/journey';
import { Trip, TransportMode } from '@/types/trip';
import StatCard from '../insights/StatCard';
import PlacesChart from '../insights/PlacesChart';
import TransportBreakdown from '../insights/TransportBreakdown';

interface InsightsTabProps {
  stats: JourneyStats;
  placeFrequencies: PlaceFrequency[];
  journeys: Trip[];
}

// Haversine formula — straight-line km between two [lng, lat] points
function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLng = ((b[0] - a[0]) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[1] * Math.PI) / 180) *
      Math.cos((b[1] * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function formatDistance(km: number): string {
  if (km < 1) return '0 km';
  if (km >= 1000) return `${(km / 1000).toFixed(1)}k km`;
  return `${Math.round(km)} km`;
}

function formatDateRange(start?: Date | null, end?: Date | null): string {
  if (!start && !end) return 'No date set';
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  if (!end || start?.toDateString() === end?.toDateString()) return fmt(start!);
  return `${fmt(start!)} – ${fmt(end!)}`;
}

export default function InsightsTab({ stats, placeFrequencies, journeys }: InsightsTabProps) {
  // 'all' = aggregate view, otherwise a journey id
  const [selected, setSelected] = useState<'all' | string>('all');

  // ── Per-journey computed stats ──────────────────────────────────────────
  const journeyStats = useMemo(() => {
    return journeys.map((j) => {
      const transportCounts: Partial<Record<TransportMode, number>> = {};
      let totalKm = 0;
      const countries = new Set<string>();
      const cities = new Set<string>();

      for (let i = 0; i < j.steps.length; i++) {
        const step = j.steps[i];

        // Collect geo
        if (step.address?.country) countries.add(step.address.country.trim().toLowerCase());
        if (step.address?.city) cities.add(step.address.city.trim().toLowerCase());

        // Transport + distance to next step
        if (i < j.steps.length - 1 && step.transportToNext) {
          const mode = step.transportToNext;
          transportCounts[mode] = (transportCounts[mode] ?? 0) + 1;

          const next = j.steps[i + 1];
          // Use cached geometry length if available, else straight line
          if (step.routeGeometry && step.routeGeometry.length > 1) {
            for (let k = 0; k < step.routeGeometry.length - 1; k++) {
              totalKm += haversineKm(step.routeGeometry[k], step.routeGeometry[k + 1]);
            }
          } else {
            totalKm += haversineKm(step.coordinates, next.coordinates);
          }
        }
      }

      const startDate = j.startDate ? new Date(j.startDate.seconds * 1000) : null;
      const endDate = j.endDate ? new Date(j.endDate.seconds * 1000) : null;

      return {
        id: j.id,
        name: j.name,
        color: j.color,
        steps: j.steps.length,
        transportCounts,
        totalKm,
        countries: countries.size,
        cities: cities.size,
        startDate,
        endDate,
      };
    });
  }, [journeys]);

  const selectedJourney = selected === 'all' ? null : journeyStats.find(j => j.id === selected);

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3 pt-3">

      {/* Journey selector pill row */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelected('all')}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
            selected === 'all'
              ? 'bg-white/20 border-white/30 text-white'
              : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-300'
          }`}
        >
          All Journeys
        </button>
        {journeys.map((j) => (
          <button
            key={j.id}
            onClick={() => setSelected(j.id)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              selected === j.id
                ? 'bg-white/20 border-white/30 text-white'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-300'
            }`}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: j.color }}
            />
            <span className="max-w-[120px] truncate">{j.name}</span>
          </button>
        ))}
      </div>

      {/* ── All Journeys view ── */}
      {selected === 'all' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={<MapPin className="w-5 h-5 text-red-400" />}   label="Places"    value={stats.totalPlaces}       subtitle={`${stats.citiesVisited} cities`} />
            <StatCard icon={<Globe className="w-5 h-5 text-blue-400" />}   label="Countries" value={stats.countriesVisited} />
            <StatCard icon={<Camera className="w-5 h-5 text-purple-400" />} label="Photos"   value={stats.totalPhotos} />
            <StatCard icon={<Layers className="w-5 h-5 text-emerald-400" />} label="Journeys" value={journeys.length} />
          </div>

          <div className="p-4 rounded-2xl bg-white/10 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Journey Period</p>
                <p className="text-white font-medium text-sm">
                  {formatDateRange(stats.firstTripDate, stats.lastTripDate)}
                </p>
              </div>
            </div>
          </div>

          <PlacesChart data={placeFrequencies} />
        </>
      )}

      {/* ── Single Journey view ── */}
      {selectedJourney && (
        <>
          {/* Date range banner */}
          <div className="p-3 rounded-2xl bg-white/10 border border-white/20 flex items-center gap-3">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: journeys.find(j => j.id === selectedJourney.id)?.color }} />
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Dates</p>
              <p className="text-white text-sm font-medium">
                {formatDateRange(selectedJourney.startDate, selectedJourney.endDate)}
              </p>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={<MapPin className="w-5 h-5 text-red-400" />}   label="Stops"     value={selectedJourney.steps}    subtitle="waypoints" />
            <StatCard icon={<Globe className="w-5 h-5 text-blue-400" />}   label="Countries" value={selectedJourney.countries} />
            <StatCard icon={<Route className="w-5 h-5 text-green-400" />}  label="Distance"  value={formatDistance(selectedJourney.totalKm)} />
            <StatCard icon={<Camera className="w-5 h-5 text-violet-400" />} label="Cities"   value={selectedJourney.cities} />
          </div>

          {/* Transport breakdown */}
          <TransportBreakdown transportCounts={selectedJourney.transportCounts} />
        </>
      )}
    </div>
  );
}

