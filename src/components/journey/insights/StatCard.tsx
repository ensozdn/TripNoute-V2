'use client';

import { StatCardProps } from '@/types/journey';

export default function StatCard({ icon, label, value, subtitle }: StatCardProps) {
  return (
    <div className="p-4 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        {}
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
          <span className="text-xl">{icon}</span>
        </div>

        {}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
            {label}
          </p>
          <p className="text-2xl font-bold text-white truncate">
            {value}
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
