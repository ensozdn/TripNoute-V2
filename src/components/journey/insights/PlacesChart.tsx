'use client';

import { PlaceFrequency } from '@/types/journey';

interface PlacesChartProps {
  data: PlaceFrequency[];
  className?: string;
}

// Convert country name → flag emoji via regional indicator letters
function countryFlag(countryName: string): string {
  const MAP: Record<string, string> = {
    'turkey': '🇹🇷', 'türkiye': '🇹🇷',
    'united states': '🇺🇸', 'usa': '🇺🇸', 'united states of america': '🇺🇸',
    'united kingdom': '🇬🇧', 'uk': '🇬🇧', 'england': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    'germany': '🇩🇪', 'deutschland': '🇩🇪',
    'france': '🇫🇷',
    'italy': '🇮🇹',
    'spain': '🇪🇸',
    'portugal': '🇵🇹',
    'netherlands': '🇳🇱', 'holland': '🇳🇱',
    'belgium': '🇧🇪',
    'switzerland': '🇨🇭',
    'austria': '🇦🇹',
    'greece': '🇬🇷',
    'sweden': '🇸🇪',
    'norway': '🇳🇴',
    'denmark': '🇩🇰',
    'finland': '🇫🇮',
    'poland': '🇵🇱',
    'czech republic': '🇨🇿', 'czechia': '🇨🇿',
    'hungary': '🇭🇺',
    'romania': '🇷🇴',
    'bulgaria': '🇧🇬',
    'croatia': '🇭🇷',
    'serbia': '🇷🇸',
    'ukraine': '🇺🇦',
    'russia': '🇷🇺',
    'japan': '🇯🇵',
    'china': '🇨🇳',
    'south korea': '🇰🇷', 'korea': '🇰🇷',
    'india': '🇮🇳',
    'thailand': '🇹🇭',
    'vietnam': '🇻🇳',
    'indonesia': '🇮🇩',
    'malaysia': '🇲🇾',
    'singapore': '🇸🇬',
    'australia': '🇦🇺',
    'new zealand': '🇳🇿',
    'canada': '🇨🇦',
    'mexico': '🇲🇽',
    'brazil': '🇧🇷',
    'argentina': '🇦🇷',
    'colombia': '🇨🇴',
    'peru': '🇵🇪',
    'chile': '🇨🇱',
    'south africa': '🇿🇦',
    'egypt': '🇪🇬',
    'morocco': '🇲🇦',
    'israel': '🇮🇱',
    'uae': '🇦🇪', 'united arab emirates': '🇦🇪',
    'saudi arabia': '🇸🇦',
    'jordan': '🇯🇴',
    'georgia': '🇬🇪',
    'armenia': '🇦🇲',
    'azerbaijan': '🇦🇿',
  };
  return MAP[countryName.toLowerCase()] ?? '🌍';
}

export default function PlacesChart({ data, className = '' }: PlacesChartProps) {
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
        {data.slice(0, 6).map((item) => (
          <div key={item.country} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300 truncate flex items-center gap-2">
                <span>{countryFlag(item.country)}</span>
                <span className="capitalize">{item.country}</span>
              </span>
              <span className="text-slate-400 ml-2">{item.count}</span>
            </div>
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
