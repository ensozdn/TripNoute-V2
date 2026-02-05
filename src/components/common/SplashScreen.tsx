'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // 3 saniye sonra splash screen'i kapat
    const timer = setTimeout(() => {
      setIsVisible(false);
      // Fade out animasyonu bittikten sonra onComplete çağır
      setTimeout(onComplete, 500);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900"
        >
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-blue-600/10 animate-pulse" />
          
          {/* Logo container with animation */}
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ 
              x: 0, 
              opacity: 1,
            }}
            transition={{ 
              duration: 1,
              ease: "easeOut"
            }}
            className="relative z-10 flex flex-col items-center gap-10"
          >
            {/* Logo + Text - YAN YANA */}
            <div className="flex items-center gap-4 md:gap-8">
              {/* Logo */}
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ 
                  x: 0,
                  opacity: 1,
                }}
                transition={{ 
                  duration: 1.2,
                  ease: "easeOut",
                  delay: 0.2
                }}
                className="relative"
              >
                {/* Glow effect - optimized */}
                <div className="absolute inset-0 bg-blue-400/20 md:bg-blue-400/30 blur-[60px] md:blur-[80px] rounded-full scale-125 md:scale-150" />
                
                {/* Logo - Responsive */}
                <motion.div
                  animate={{ 
                    y: [0, -12, 0],
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Image
                    src="/tripnoute-logo.png"
                    alt="TripNoute Logo"
                    width={100}
                    height={100}
                    className="relative rounded-[20px] md:rounded-[28px] shadow-2xl md:w-[140px] md:h-[140px]"
                    priority
                  />
                </motion.div>
              </motion.div>

              {/* App Name - Responsive */}
              <motion.h1
                initial={{ x: -80, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                className="text-4xl sm:text-5xl md:text-7xl font-bold text-white tracking-wide leading-none"
              >
                TripNoute
              </motion.h1>
            </div>

            {/* Loading dots */}
            <motion.div
              initial={{ x: -60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="flex gap-2.5"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                  className="w-2.5 h-2.5 md:w-3 md:h-3 bg-blue-400 rounded-full"
                />
              ))}
            </motion.div>

            {/* Tagline */}
            <motion.p
              initial={{ x: -60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 1, duration: 0.6, ease: "easeOut" }}
              className="text-slate-300 text-sm sm:text-base md:text-lg font-light tracking-wide px-4 text-center"
            >
              Your Personal Travel Journey
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
