'use client';

import { motion } from 'framer-motion';

interface StepMetaProps {
  name: string;
  onNameChange: (value: string) => void;
  onNext: () => void;
}

export default function StepMeta({
  name,
  onNameChange,
  onNext,
}: StepMetaProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ type: 'spring', damping: 28, stiffness: 280 }}
      className="flex flex-col gap-6"
    >
      <div>
        <label className="text-xs text-white/40 uppercase tracking-widest font-medium mb-2 block">
          Journey Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="e.g. Summer Europe Trip"
          maxLength={60}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-white/30 transition-colors"
        />
      </div>

      <button
        onClick={onNext}
        disabled={name.trim().length === 0}
        className="mt-2 w-full py-3.5 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
      >
        Continue
      </button>
    </motion.div>
  );
}
