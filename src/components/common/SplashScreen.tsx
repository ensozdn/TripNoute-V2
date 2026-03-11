'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  type Phase = 'entry' | 'idle' | 'fly-out' | 'fly-in' | 'settle';
  const [phase, setPhase] = useState<Phase>('idle');
  const onCompleteRef = useRef(onComplete);

  const finish = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => onCompleteRef.current(), 500);
  }, []);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('fly-out'), 1200);
    const t2 = setTimeout(() => setPhase('fly-in'), 2000);
    const t3 = setTimeout(() => setPhase('settle'), 2050);
    const t4 = setTimeout(finish, 2500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
    };
  }, [finish]);

  const planeAnimate = {
    entry:     { x: 8,    y: -8,   rotate: 0, opacity: 0, scale: 0.4 },
    idle:      { x: 8,    y: -8,   rotate: 0, opacity: 1, scale: 1   },
    'fly-out': { x: 240,  y: -180, rotate: 0, opacity: 0, scale: 0.5 },
    'fly-in':  { x: -200, y: 130,  rotate: 0, opacity: 0, scale: 0.5 },
    settle:    { x: 8,    y: -8,   rotate: 0, opacity: 1, scale: 1   },
  };
  const planeTransition = {
    entry:     { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
    idle:      { duration: 0 },
    'fly-out': { duration: 0.65, ease: [0.4, 0, 0.8, 0] as const },
    'fly-in':  { duration: 0 },
    settle:    { duration: 0.85, ease: [0.22, 1, 0.36, 1] as const },
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #ffffff 0%, #eff6ff 50%, #dbeafe 100%)' }}
        >
          {/* Dot grid overlay */}
          <div className="absolute inset-0 opacity-[0.022]"
            style={{ backgroundImage: 'radial-gradient(circle, #2563eb 1px, transparent 1px)', backgroundSize: '36px 36px' }} />

          {/* Blue orbs */}
          <motion.div className="absolute -top-32 -left-32 w-80 h-80 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }}
            animate={{ scale: [1, 1.12, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div className="absolute -bottom-24 -right-20 w-72 h-72 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)', filter: 'blur(36px)' }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
          />

          {/* ── Main content ── */}
          <div className="relative z-10 flex flex-col items-center" style={{ overflow: 'visible' }}>
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="relative mb-8"
              style={{ width: 120, height: 120, overflow: 'visible' }}
            >
              {/* Pulse ring 1 */}
              <motion.div
                className="absolute rounded-[40px]"
                style={{ inset: -12, border: '1px solid rgba(59,130,246,0.3)' }}
                animate={{ scale: [1, 1.45], opacity: [0.5, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
              />
              {/* Pulse ring 2 */}
              <motion.div
                className="absolute rounded-[40px]"
                style={{ inset: -12, border: '1px solid rgba(59,130,246,0.18)' }}
                animate={{ scale: [1, 1.45], opacity: [0.4, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut', delay: 1.1 }}
              />
              {/* Glow */}
              <div className="absolute pointer-events-none"
                style={{ inset: -16, background: 'radial-gradient(circle, rgba(37,99,235,0.14) 0%, transparent 65%)', filter: 'blur(20px)', borderRadius: 40 }}
              />

              <Image
                src="/tripnoute-logo.png"
                alt="TripNoute"
                width={120}
                height={120}
                className="relative rounded-[24px]"
                style={{ boxShadow: '0 8px 32px rgba(37,99,235,0.22), 0 2px 8px rgba(0,0,0,0.08)' }}
                priority
              />

              {/* Animasyonlu uçak — beyaz */}
              <motion.div
                style={{
                  position: 'absolute', top: '50%', left: '50%',
                  width: 45, height: 45, marginTop: -27.5, marginLeft: -27.5,
                  overflow: 'visible', zIndex: 10,
                }}
                animate={planeAnimate[phase]}
                transition={planeTransition[phase]}
              >
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
                  style={{ width: '100%', height: '100%', overflow: 'visible', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.25))' }}>
                  <path
                    d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"
                    fill="white"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="0.3"
                  />
                </svg>
              </motion.div>
            </motion.div>

            {/* Brand name */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="text-[40px] font-bold tracking-tight leading-none mb-2"
            >
              <span className="text-slate-900">Trip</span>
              <span style={{ color: '#2563eb' }}>Noute</span>
            </motion.h1>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="text-slate-500 text-sm tracking-widest uppercase mb-10"
            >
              Your world, your story.
            </motion.p>

            {/* Loading bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75, duration: 0.4 }}
              className="w-32 h-[3px] rounded-full overflow-hidden"
              style={{ backgroundColor: 'rgba(37,99,235,0.08)' }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #1d4ed8, #3b82f6, #93c5fd)' }}
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 2.8, delay: 0.85, ease: 'easeInOut' }}
              />
            </motion.div>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.9, delay: 1.0 }}
              className="mt-10 flex flex-col items-center gap-1.5"
            >
              <div className="flex items-center justify-center gap-2">
                <div className="h-px w-8 bg-blue-200" />
                <span className="text-xs font-semibold tracking-widest uppercase text-blue-400">
                  Made for Travelers
                </span>
                <div className="h-px w-8 bg-blue-200" />
              </div>
              <p className="text-slate-400 text-[11px] tracking-wide font-medium">© 2026 TripNoute</p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


