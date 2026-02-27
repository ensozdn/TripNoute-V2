'use client';

import { useMemo } from 'react';
import { Plane, Car, Train, Bus, Ship, Bike, Footprints } from 'lucide-react';
import { TransportMode } from '@/types/trip';

interface TransportBreakdownProps {
  transportCounts: Partial<Record<TransportMode, number>>;
}

const TRANSPORT_CONFIG: Record<TransportMode, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  flight:  { label: 'Flight',  icon: <Plane      className="w-4 h-4" />, color: '#a78bfa', bg: 'rgba(124,58,237,0.15)' },
  car:     { label: 'Car',     icon: <Car        className="w-4 h-4" />, color: '#34d399', bg: 'rgba(5,150,105,0.15)'  },
  train:   { label: 'Train',   icon: <Train      className="w-4 h-4" />, color: '#fbbf24', bg: 'rgba(217,119,6,0.15)'  },
  bus:     { label: 'Bus',     icon: <Bus        className="w-4 h-4" />, color: '#fb923c', bg: 'rgba(234,88,12,0.15)'  },
  ship:    { label: 'Ship',    icon: <Ship       className="w-4 h-4" />, color: '#38bdf8', bg: 'rgba(8,145,178,0.15)'  },
  bike:    { label: 'Bike',    icon: <Bike       className="w-4 h-4" />, color: '#60a5fa', bg: 'rgba(2,132,199,0.15)'  },
  walk:    { label: 'Walk',    icon: <Footprints className="w-4 h-4" />, color: '#94a3b8', bg: 'rgba(100,116,139,0.15)'},
  walking: { label: 'Walking', icon: <Footprints className="w-4 h-4" />, color: '#94a3b8', bg: 'rgba(100,116,139,0.15)'},
};

export default function TransportBreakdown({ transportCounts }: TransportBreakdownProps) {
  const sorted = useMemo(() => {
    return Object.entries(transportCounts)
      .filter(([, count]) => count > 0)
      .sort(([, a], [, b]) => b - a) as [TransportMode, number][];
  }, [transportCounts]);

  const total = useMemo(() => sorted.reduce((s, [, c]) => s + c, 0), [sorted]);

  if (sorted.length === 0) {
    return (
      <div className="p-4 rounded-2xl bg-white/10 border border-white/20">
        <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">Transport</p>
        <p className="text-slate-500 text-sm text-center py-4">No transport data yet</p>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-2xl bg-white/10 border border-white/20">
      <p className="text-xs text-slate-400 uppercase tracking-wide mb-4">Transport Breakdown</p>

      <div className="space-y-3">
        {sorted.map(([mode, count]) => {
          const cfg = TRANSPORT_CONFIG[mode];
          const pct = Math.round((count / total) * 100);
          return (
            <div key={mode} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2.5 text-slate-300">
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: cfg.bg, color: cfg.color }}
                  >
                    {cfg.icon}
                  </span>
                  <span className="font-medium">{cfg.label}</span>
                </span>
                <span className="text-slate-300 font-medium tabular-nums">
                  {count}
                  <span className="text-slate-500 font-normal text-xs ml-1">({pct}%)</span>
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden ml-9">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, backgroundColor: cfg.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

