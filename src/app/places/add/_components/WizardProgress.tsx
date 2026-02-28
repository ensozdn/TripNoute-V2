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
    <div className="absolute top-0 left-0 right-0 z-50 pointer-events-none">
      {/* Glass header */}
      <div className="bg-black/50 backdrop-blur-2xl border-b border-white/10">
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">

          {/* Back / Close button */}
          <button
            onClick={currentStep === 1 ? onClose : onBack}
            className="pointer-events-auto w-9 h-9 flex items-center justify-center rounded-2xl bg-white/8 border border-white/12 text-white/70 shrink-0 hover:bg-white/15 hover:text-white active:scale-90 transition-all"
          >
            {currentStep === 1 ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            )}
          </button>

          {/* Step indicators */}
          <div className="flex-1 flex items-center justify-center gap-2">
            {STEPS.map((step, i) => {
              const isDone = step.n < currentStep;
              const isActive = step.n === currentStep;
              return (
                <div key={step.n} className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-1">
                    {/* Circle */}
                    <motion.div
                      animate={{
                        backgroundColor: isDone
                          ? '#22c55e'
                          : isActive
                          ? '#3b82f6'
                          : 'rgba(255,255,255,0.08)',
                        borderColor: isDone
                          ? '#22c55e'
                          : isActive
                          ? '#3b82f6'
                          : 'rgba(255,255,255,0.15)',
                        scale: isActive ? 1.1 : 1,
                      }}
                      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                      className="w-7 h-7 rounded-full border-2 flex items-center justify-center"
                    >
                      {isDone ? (
                        <motion.svg
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-3.5 h-3.5 text-white"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.5}
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </motion.svg>
                      ) : (
                        <span className={`text-xs font-bold ${isActive ? 'text-white' : 'text-white/30'}`}>
                          {step.n}
                        </span>
                      )}
                    </motion.div>
                    {/* Label */}
                    <span className={`text-[10px] font-medium tracking-wide transition-colors ${
                      isActive ? 'text-white' : isDone ? 'text-green-400/70' : 'text-white/20'
                    }`}>
                      {step.label}
                    </span>
                  </div>

                  {/* Connector line between steps */}
                  {i < STEPS.length - 1 && (
                    <motion.div
                      animate={{ backgroundColor: isDone ? '#22c55e' : 'rgba(255,255,255,0.10)' }}
                      transition={{ duration: 0.4 }}
                      className="w-8 h-px mb-4"
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Invisible spacer to balance the back button */}
          <div className="w-9 shrink-0" />
        </div>
      </div>
    </div>
  );
}


