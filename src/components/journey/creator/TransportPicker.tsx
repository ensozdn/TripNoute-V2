'use client';

import { motion } from 'framer-motion';
import { TransportMode } from '@/types/trip';

interface TransportPickerProps {
  selected: TransportMode | null;
  onSelect: (mode: TransportMode) => void;
}

const TRANSPORT_OPTIONS: {
  mode: TransportMode;
  label: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}[] = [
  {
    mode: 'flight',
    label: 'Flight',
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.15)',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2A1.5 1.5 0 0 0 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1l3.5 1v-1.5L13 19v-5.5z" />
      </svg>
    ),
  },
  {
    mode: 'car',
    label: 'Car',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.15)',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.08 3.11H5.77L6.85 7zM19 17H5v-5h14v5zm-2-2.5a1 1 0 1 1 2 0 1 1 0 0 1-2 0zm-10 0a1 1 0 1 1 2 0 1 1 0 0 1-2 0z" />
      </svg>
    ),
  },
  {
    mode: 'train',
    label: 'Train',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.15)',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M12 2c-4 0-8 .5-8 4v9.5A2.5 2.5 0 0 0 6.5 18l-1.5 1.5v.5h2l2-2h6l2 2h2v-.5L17.5 18a2.5 2.5 0 0 0 2.5-2.5V6c0-3.5-4-4-8-4zm0 2c3.51 0 5.5.48 6 1.75V8H6V5.75C6.5 4.48 8.49 4 12 4zM6 10h5v3H6v-3zm7 0h5v3h-5v-3zm-8.5 5A1.5 1.5 0 1 1 6 16.5 1.5 1.5 0 0 1 4.5 15zm15 0a1.5 1.5 0 1 1-1.5 1.5 1.5 1.5 0 0 1 1.5-1.5z" />
      </svg>
    ),
  },
  {
    mode: 'bus',
    label: 'Bus',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.15)',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm9 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM19 13H5V6h14v7z" />
      </svg>
    ),
  },
  {
    mode: 'ship',
    label: 'Ship',
    color: '#06b6d4',
    bg: 'rgba(6,182,212,0.15)',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v-2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l1.89-6.68c.08-.26.06-.54-.06-.78s-.34-.42-.6-.5L20 10.62V6c0-1.1-.9-2-2-2h-3V1H9v3H6c-1.1 0-2 .9-2 2v4.62l-1.29.42c-.26.08-.48.26-.6.5s-.15.52-.06.78L3.95 19zM6 6h12v3.97L12 8 6 9.97V6z" />
      </svg>
    ),
  },
  {
    mode: 'bike',
    label: 'Bike',
    color: '#f97316',
    bg: 'rgba(249,115,22,0.15)',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M15.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM5 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5S3.1 13.5 5 13.5s3.5 1.6 3.5 3.5S6.9 20.5 5 20.5zm5.8-10l2.4-2.4.8.8c1.3 1.3 3 2.1 5.1 2.1V9c-1.5 0-2.7-.6-3.6-1.5l-1.9-1.9c-.5-.4-1-.6-1.6-.6s-1.1.2-1.4.6L7.8 8.4C7.3 8.8 7 9.4 7 10c0 .6.3 1.2.8 1.6l3.2 2.4V19h2v-6.2l-2.2-1.8zM19 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5z" />
      </svg>
    ),
  },
  {
    mode: 'walk',
    label: 'Walk',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.15)',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z" />
      </svg>
    ),
  },
];

export default function TransportPicker({ selected, onSelect }: TransportPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {TRANSPORT_OPTIONS.map(({ mode, label, icon, color, bg }) => {
        const isSelected = selected === mode;
        return (
          <motion.button
            key={mode}
            onClick={() => onSelect(mode)}
            whileTap={{ scale: 0.93 }}
            whileHover={{ scale: 1.05 }}
            style={
              isSelected
                ? { backgroundColor: bg, borderColor: color, color }
                : undefined
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isSelected
                ? 'shadow-sm'
                : 'bg-black/4 border-black/8 text-slate-500 hover:text-slate-700 hover:bg-black/8 hover:border-black/15'
            }`}
          >
            <span
              style={isSelected ? { color } : undefined}
              className={isSelected ? '' : 'text-slate-400'}
            >
              {icon}
            </span>
            <span>{label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

