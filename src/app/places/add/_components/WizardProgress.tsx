'use client';

import { motion } from 'framer-motion';

interface WizardProgressProps {
  currentStep: 1 | 2 | 3;
  onBack: () => void;
  onClose: () => void;
}

const STEPS = [
  { n: 1, label: 'Location' },
  { n: 2, label: 'Details' },
  { n: 3, label: 'Photos' },
];

export default function WizardProgress({ currentStep, onBack, onClose }: WizardProgressProps) {
  return (
    <div className="absolute top-0 left-0 right-0 z-50 pointer-events-none bg-slate-900/98 backdrop-blur-xl border-b border-white/8">
      {/* Compact single bar */}
      <div className="flex items-center gap-2.5 px-3 pt-3 pb-2.5">
        {/* Back / Close button */}
        <button
          onClick={currentStep === 1 ? onClose : onBack}
          className="pointer-events-auto w-8 h-8 flex items-center justify-center rounded-xl bg-black/40 border border-white/15 text-white shrink-0 hover:bg-black/60 active:scale-95 transition-all"
        >
          {currentStep === 1 ? (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          )}
        </button>

        {/* Step name */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-white/35 font-medium leading-none mb-0.5">Step {currentStep} of 3</p>
          <p className="text-sm font-semibold text-white leading-tight">
            {STEPS[currentStep - 1].label}
          </p>
        </div>

        {/* Step dots */}
        <div className="flex items-center gap-1.5">
          {STEPS.map((step) => {
            const isActive = step.n === currentStep;
            const isDone = step.n < currentStep;
            return (
              <motion.div
                key={step.n}
                animate={{
                  width: isActive ? 18 : 5,
                  backgroundColor: isDone
                    ? 'rgba(255,255,255,0.8)'
                    : isActive
                    ? '#3b82f6'
                    : 'rgba(255,255,255,0.2)',
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="h-1.5 rounded-full"
              />
            );
          })}
        </div>
      </div>

      {/* Progress track */}
      <div className="h-px bg-white/8 mx-0">
        <motion.div
          className="h-full bg-blue-500/60"
          animate={{ width: `${((currentStep - 1) / 2) * 100}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 35 }}
        />
      </div>
    </div>
  );
}

