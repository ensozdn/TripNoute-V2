'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Archive } from 'lucide-react';

export type FeedMode = 'live' | 'past';

interface LivePastToggleProps {
  mode: FeedMode;
  onModeChange: (mode: FeedMode) => void;
  liveCount?: number;
}

export default function LivePastToggle({ mode, onModeChange, liveCount = 0 }: LivePastToggleProps) {
  return (
    <div className="relative flex items-center gap-1 p-1 bg-slate-100 rounded-2xl">
      {/* Animated background indicator */}
      <motion.div
        layoutId="toggleIndicator"
        className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg"
        initial={false}
        animate={{ 
          x: mode === 'live' ? 4 : 'calc(100% + 4px)',
        }}
        transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
      />

      {/* Live button */}
      <button
        onClick={() => onModeChange('live')}
        className={`
          relative z-10 flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm
          transition-colors duration-200
          ${mode === 'live' ? 'text-white' : 'text-slate-600'}
        `}
      >
        <TrendingUp className="w-4 h-4" strokeWidth={2.5} />
        <span>Live Now</span>
        {liveCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`
              px-2 py-0.5 rounded-full text-xs font-bold
              ${mode === 'live' ? 'bg-white/25 text-white' : 'bg-blue-100 text-blue-600'}
            `}
          >
            {liveCount}
          </motion.span>
        )}
      </button>

      {/* Past button */}
      <button
        onClick={() => onModeChange('past')}
        className={`
          relative z-10 flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm
          transition-colors duration-200
          ${mode === 'past' ? 'text-white' : 'text-slate-600'}
        `}
      >
        <Archive className="w-4 h-4" strokeWidth={2.5} />
        <span>Past Trips</span>
      </button>
    </div>
  );
}
