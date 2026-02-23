'use client';

import { motion } from 'framer-motion';
import { TransportMode } from '@/types/trip';

interface TransportPickerProps {
  selected: TransportMode | null;
  onSelect: (mode: TransportMode) => void;
}

const TRANSPORT_OPTIONS: { mode: TransportMode; label: string; emoji: string }[] = [
  { mode: 'flight', label: 'Flight', emoji: '✈️' },
  { mode: 'car', label: 'Car', emoji: '🚗' },
  { mode: 'train', label: 'Train', emoji: '🚂' },
  { mode: 'bus', label: 'Bus', emoji: '🚌' },
  { mode: 'ship', label: 'Ship', emoji: '🚢' },
  { mode: 'bike', label: 'Bike', emoji: '🚲' },
  { mode: 'walk', label: 'Walk', emoji: '🚶' },
];

export default function TransportPicker({ selected, onSelect }: TransportPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {TRANSPORT_OPTIONS.map(({ mode, label, emoji }) => {
        const isSelected = selected === mode;
        return (
          <motion.button
            key={mode}
            onClick={() => onSelect(mode)}
            whileTap={{ scale: 0.93 }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              isSelected
                ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                : 'bg-white/5 border-white/10 text-white/50 hover:text-white/70 hover:bg-white/10'
            }`}
          >
            <span>{emoji}</span>
            <span>{label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
