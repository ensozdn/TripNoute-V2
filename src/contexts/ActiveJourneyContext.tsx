/**
 * ACTIVE JOURNEY CONTEXT - React Context API
 * 
 * Tek bir activeJourney objesi üzerinden çalışan merkezi sistem.
 * Harita, Timeline ve İstatistikler bu context'ten beslenir.
 */

'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Trip, JourneyStep, sortStepsByDate } from '@/types/trip.v2';

interface ActiveJourneyContextType {
  // Current state
  activeJourney: Trip | null;
  activeStep: JourneyStep | null;
  activeStepIndex: number;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setActiveJourney: (journey: Trip | null) => void;
  setActiveStep: (step: JourneyStep | null, index: number) => void;
  focusNextStep: () => void;
  focusPreviousStep: () => void;
  clearActiveJourney: () => void;
  updateJourneyStep: (stepId: string, updates: Partial<JourneyStep>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Derived state
  journeyPath: [number, number][];
  journeyStats: {
    totalSteps: number;
    totalDistance: number;
    totalDuration: number;
    countries: string[];
    cities: string[];
  };
}

const ActiveJourneyContext = createContext<ActiveJourneyContextType | undefined>(undefined);

export function ActiveJourneyProvider({ children }: { children: ReactNode }) {
  const [activeJourney, setActiveJourneyState] = useState<Trip | null>(null);
  const [activeStep, setActiveStepState] = useState<JourneyStep | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Set active journey
  const setActiveJourney = useCallback((journey: Trip | null) => {
    if (journey) {
      // Sort steps by date
      const sorted = sortStepsByDate(journey.steps);
      const sortedJourney = { ...journey, steps: sorted };
      
      setActiveJourneyState(sortedJourney);
      setActiveStepState(sorted[0] || null);
      setActiveStepIndex(0);
    } else {
      setActiveJourneyState(null);
      setActiveStepState(null);
      setActiveStepIndex(0);
    }
    setError(null);
  }, []);
  
  // Set active step
  const setActiveStep = useCallback((step: JourneyStep | null, index: number) => {
    setActiveStepState(step);
    setActiveStepIndex(index);
  }, []);
  
  // Focus next step
  const focusNextStep = useCallback(() => {
    if (!activeJourney || activeStepIndex >= activeJourney.steps.length - 1) {
      return;
    }
    
    const nextIndex = activeStepIndex + 1;
    const nextStep = activeJourney.steps[nextIndex];
    
    setActiveStepState(nextStep);
    setActiveStepIndex(nextIndex);
  }, [activeJourney, activeStepIndex]);
  
  // Focus previous step
  const focusPreviousStep = useCallback(() => {
    if (!activeJourney || activeStepIndex <= 0) {
      return;
    }
    
    const prevIndex = activeStepIndex - 1;
    const prevStep = activeJourney.steps[prevIndex];
    
    setActiveStepState(prevStep);
    setActiveStepIndex(prevIndex);
  }, [activeJourney, activeStepIndex]);
  
  // Clear active journey
  const clearActiveJourney = useCallback(() => {
    setActiveJourneyState(null);
    setActiveStepState(null);
    setActiveStepIndex(0);
    setError(null);
  }, []);
  
  // Update journey step
  const updateJourneyStep = useCallback((stepId: string, updates: Partial<JourneyStep>) => {
    if (!activeJourney) return;
    
    const updatedSteps = activeJourney.steps.map((step) =>
      step.id === stepId ? { ...step, ...updates } : step
    );
    
    setActiveJourneyState({
      ...activeJourney,
      steps: updatedSteps,
    });
  }, [activeJourney]);
  
  // Set loading
  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);
  
  // Set error
  const setErrorState = useCallback((err: string | null) => {
    setError(err);
  }, []);
  
  // Derived: Journey path (coordinates for map)
  const journeyPath: [number, number][] = activeJourney
    ? activeJourney.steps.map((step) => step.location)
    : [];
  
  // Derived: Journey stats
  const journeyStats = (() => {
    if (!activeJourney) {
      return {
        totalSteps: 0,
        totalDistance: 0,
        totalDuration: 0,
        countries: [],
        cities: [],
      };
    }
    
    const { steps } = activeJourney;
    const countries = new Set<string>();
    const cities = new Set<string>();
    
    steps.forEach((step) => {
      if (step.address?.country) countries.add(step.address.country);
      if (step.address?.city) cities.add(step.address.city);
    });
    
    return {
      totalSteps: steps.length,
      totalDistance: activeJourney.totalDistance || 0,
      totalDuration: activeJourney.totalDuration || 0,
      countries: Array.from(countries),
      cities: Array.from(cities),
    };
  })();
  
  const value: ActiveJourneyContextType = {
    activeJourney,
    activeStep,
    activeStepIndex,
    isLoading,
    error,
    setActiveJourney,
    setActiveStep,
    focusNextStep,
    focusPreviousStep,
    clearActiveJourney,
    updateJourneyStep,
    setLoading,
    setError: setErrorState,
    journeyPath,
    journeyStats,
  };
  
  return (
    <ActiveJourneyContext.Provider value={value}>
      {children}
    </ActiveJourneyContext.Provider>
  );
}

/**
 * HOOKS
 */

// Main hook
export function useActiveJourney() {
  const context = useContext(ActiveJourneyContext);
  if (!context) {
    throw new Error('useActiveJourney must be used within ActiveJourneyProvider');
  }
  return context;
}

// Convenience: Get journey
export function useJourney() {
  const { activeJourney, setActiveJourney } = useActiveJourney();
  return [activeJourney, setActiveJourney] as const;
}

// Convenience: Get step
export function useStep() {
  const { activeStep, activeStepIndex, setActiveStep } = useActiveJourney();
  return { step: activeStep, stepIndex: activeStepIndex, setStep: setActiveStep };
}

// Convenience: Navigation
export function useJourneyNavigation() {
  const { focusNextStep, focusPreviousStep, activeStepIndex, activeJourney } = useActiveJourney();
  
  const totalSteps = activeJourney?.steps.length || 0;
  const canGoNext = activeStepIndex < totalSteps - 1;
  const canGoPrev = activeStepIndex > 0;
  
  return {
    focusNext: focusNextStep,
    focusPrev: focusPreviousStep,
    activeIndex: activeStepIndex,
    totalSteps,
    canGoNext,
    canGoPrev,
  };
}

// Convenience: Stats
export function useJourneyStats() {
  const { journeyStats } = useActiveJourney();
  return journeyStats;
}
