'use client';

import { useEffect, useRef, useState } from 'react';
import { StatCardProps } from '@/types/journey';

function useCountUp(target: number, duration = 800) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) { setDisplay(0); return; }
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return display;
}

export default function StatCard({ icon, label, value, subtitle }: StatCardProps) {
  const isNumber = typeof value === 'number';
  const animated = useCountUp(isNumber ? (value as number) : 0);
  const displayValue = isNumber ? animated : value;

  return (
    <div className="p-4 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
          <span className="text-xl">{icon}</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
            {label}
          </p>
          <p className="text-2xl font-bold text-white truncate">
            {displayValue}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
