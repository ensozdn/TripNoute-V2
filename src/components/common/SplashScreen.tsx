'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  type Phase = 'entry' | 'idle' | 'fly-out' | 'fly-in' | 'settle';
  const [phase, setPhase] = useState<Phase>('entry');

  useEffect(() => {
    // 0.7s → yerinde dur (idle)
    const t0 = setTimeout(() => setPhase('idle'), 700);
    // 1.2s → uçak fırlar
    const t1 = setTimeout(() => setPhase('fly-out'), 1200);
    // 2.0s → karşı taraftan anında konumlan
    const t2 = setTimeout(() => setPhase('fly-in'), 2000);
    // 2.05s → yumuşak yerine gel
    const t3 = setTimeout(() => setPhase('settle'), 2050);
    // 4.0s → splash kapan
    const t4 = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500);
    }, 4000);
    return () => {
      clearTimeout(t0); clearTimeout(t1);
      clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
    };
  }, [onComplete]);

  // Uçak animasyonu — logodaki açı -45° (sol-altta kuyruk, sağ-üste burun)
  // rotate sabit -45° kalıyor, sadece x/y/opacity/scale değişiyor
  const planeAnimate = {
    entry:     { x: -160, y: 110,  rotate: 0, opacity: 0, scale: 0.4 },
    idle:      { x: 8,    y: -8,   rotate: 0, opacity: 1, scale: 1   },
    'fly-out': { x: 240,  y: -180, rotate: 0, opacity: 0, scale: 0.5 },
    'fly-in':  { x: -200, y: 130,  rotate: 0, opacity: 0, scale: 0.5 },
    settle:    { x: 8,    y: -8,   rotate: 0, opacity: 1, scale: 1   },
  };
  const planeTransition = {
    entry:     { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
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
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{
            background: 'linear-gradient(160deg, #0f172a 0%, #0c1a3a 55%, #0f172a 100%)',
            overflow: 'hidden',
          }}
        >
          {/* Grid */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
              backgroundSize: '44px 44px',
            }}
          />

          {/* Top glow */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-80 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse, rgba(59,130,246,0.35) 0%, transparent 70%)',
              filter: 'blur(60px)',
            }}
          />

          {/* Floating particles */}
          {[
            { top: '10%', left: '8%',  delay: 0   },
            { top: '18%', left: '84%', delay: 0.9 },
            { top: '52%', left: '5%',  delay: 1.6 },
            { top: '72%', left: '89%', delay: 0.4 },
            { top: '38%', left: '93%', delay: 2.1 },
            { top: '82%', left: '16%', delay: 1.3 },
          ].map((p, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-blue-400"
              style={{ top: p.top, left: p.left, width: 3, height: 3 }}
              animate={{ y: [0, -14, 0], opacity: [0.15, 0.5, 0.15] }}
              transition={{ duration: 3.5 + p.delay, repeat: Infinity, ease: 'easeInOut', delay: p.delay }}
            />
          ))}

          {/* ── Main content ── */}
          <div
            className="relative z-10 flex flex-col items-center"
            style={{ overflow: 'visible' }}
          >
            {/* Logo + uçak — ikisi aynı relative container içinde */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="relative mb-8"
              style={{ width: 120, height: 120, overflow: 'visible' }}
            >
              {/* Pulse ring 1 */}
              <motion.div
                className="absolute rounded-[40px] border border-blue-400/25"
                style={{ inset: -12 }}
                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
              />
              {/* Pulse ring 2 */}
              <motion.div
                className="absolute rounded-[40px] border border-blue-300/15"
                style={{ inset: -12 }}
                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut', delay: 1.2 }}
              />

              {/* Glow */}
              <div
                className="absolute pointer-events-none"
                style={{
                  inset: -16,
                  background: 'radial-gradient(circle, rgba(59,130,246,0.45) 0%, transparent 65%)',
                  filter: 'blur(24px)',
                  borderRadius: 40,
                }}
              />

              {/* Orijinal PNG logo — dokunmuyoruz */}
              <Image
                src="/tripnoute-logo.png"
                alt="TripNoute"
                width={120}
                height={120}
                className="relative rounded-[24px] shadow-2xl"
                style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
                priority
              />

              {/*
                ── Uçak SVG ──
                Logo PNG içindeki uçakla tam aynı pozisyona oturuyor.
                Logo 120x120, uçak logonun içinde ortada-biraz sağda.
                absolute ile logo üstüne bindiriyoruz, z-index:10
                overflow:visible — animasyon sırasında logo dışına çıkabilir
              */}
              {/* Animasyonlu uçak — Lucide Plane path, logodaki uçakla aynı şekil */}
              <motion.div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: 45,
                  height: 45,
                  marginTop: -27.5,
                  marginLeft: -27.5,
                  overflow: 'visible',
                  zIndex: 10,
                }}
                animate={planeAnimate[phase]}
                transition={planeTransition[phase]}
              >
                <svg
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ width: '100%', height: '100%', overflow: 'visible', filter: 'drop-shadow(0 2px 12px rgba(0,0,0,0.5))' }}
                >
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
              <span className="text-white">Trip</span>
              <span style={{ color: '#60a5fa' }}>Noute</span>
            </motion.h1>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="text-slate-400 text-sm tracking-widest uppercase mb-10"
            >
              Your world, your story.
            </motion.p>

            {/* Loading bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75, duration: 0.4 }}
              className="w-32 h-[3px] rounded-full overflow-hidden"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #1d4ed8, #3b82f6, #7dd3fc)' }}
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 2.8, delay: 0.85, ease: 'easeInOut' }}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
