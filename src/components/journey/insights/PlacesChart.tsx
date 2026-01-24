/**
 * PlacesChart Component
 * 
 * Places frequency chart placeholder.
 * Single Responsibility: Only renders frequency visualization.
 */

'use client';

import { PlaceFrequency } from '@/types/journey';

interface PlacesChartProps {
  data: PlaceFrequency[];
  className?: string;
}

export default function PlacesChart({ data, className = '' }: PlacesChartProps) {
  // Find max count for percentage calculation
  const maxCount = Math.max(...data.map(d => d.count), 1);

  if (data.length === 0) {
    return (
      <div className={`p-4 rounded-2xl bg-white/10 border border-white/20 ${className}`}>
        <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">
          Places by Country
        </p>
        <p className="text-slate-500 text-sm text-center py-4">
          No data yet
        </p>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-2xl bg-white/10 border border-white/20 ${className}`}>
      <p className="text-xs text-slate-400 uppercase tracking-wide mb-4">
        Places by Country
      </p>
      
      <div className="space-y-3">
        {data.slice(0, 5).map((item) => (
          <div key={item.country} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300 truncate">{item.country}</span>
              <span className="text-slate-400 ml-2">{item.count}</span>
            </div>
            
            {/* Progress Bar */}
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
                style={{ width: `${(item.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
