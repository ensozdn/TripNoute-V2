'use client';

import { useState, useEffect } from 'react';
import SplashScreen from './SplashScreen';

interface SplashScreenProviderProps {
  children: React.ReactNode;
}

export default function SplashScreenProvider({ children }: SplashScreenProviderProps) {
  const [showSplash, setShowSplash] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  useEffect(() => {
    // Check if this is the first load (no session storage flag)
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
    
    if (hasSeenSplash) {
      // User has already seen splash in this session
      setShowSplash(false);
      setIsFirstLoad(false);
    }
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
    // Mark splash as seen for this session
    sessionStorage.setItem('hasSeenSplash', 'true');
  };

  // If not first load, don't show splash at all
  if (!isFirstLoad) {
    return <>{children}</>;
  }

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <div style={{ opacity: showSplash ? 0 : 1, transition: 'opacity 0.3s', pointerEvents: showSplash ? 'none' : 'auto' }}>
        {children}
      </div>
    </>
  );
}
