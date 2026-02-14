/**
 * ACTIVE JOURNEY STORE - Zustand State Management
 * 
 * Tek bir activeJourney objesi üzerinden çalışan merkezi sistem.
 * Harita, Timeline ve İstatistikler bu store'dan beslenir.
 */

'use client';

import { create } from 'zustand';
import { Trip, JourneyStep } from '@/types/trip.v2';

interface ActiveJourneyState {
  // Current active journey
  activeJourney: Trip | null;
  
  // Current focused step (for map camera)
  activeStep: JourneyStep | null;
  activeStepIndex: number;
  
  // Loading states
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
}

export const useJourneyStore = create<ActiveJourneyState>((set, get) => ({
  // Initial state
  activeJourney: null,
  activeStep: null,
  activeStepIndex: 0,
  isLoading: false,
  error: null,
  
  // Set active journey
  setActiveJourney: (journey) => {
    set({
      activeJourney: journey,
      activeStep: journey?.steps[0] || null,
      activeStepIndex: 0,
      error: null,
    });
  },
  
  // Set active step (for map focus)
  setActiveStep: (step, index) => {
    set({
      activeStep: step,
      activeStepIndex: index,
    });
  },
  
  // Navigate to next step
  focusNextStep: () => {
    const { activeJourney, activeStepIndex } = get();
    
    if (!activeJourney || activeStepIndex >= activeJourney.steps.length - 1) {
      return; // Already at last step
    }
    
    const nextIndex = activeStepIndex + 1;
    const nextStep = activeJourney.steps[nextIndex];
    
    set({
      activeStep: nextStep,
      activeStepIndex: nextIndex,
    });
  },
  
  // Navigate to previous step
  focusPreviousStep: () => {
    const { activeJourney, activeStepIndex } = get();
    
    if (!activeJourney || activeStepIndex <= 0) {
      return; // Already at first step
    }
    
    const prevIndex = activeStepIndex - 1;
    const prevStep = activeJourney.steps[prevIndex];
    
    set({
      activeStep: prevStep,
      activeStepIndex: prevIndex,
    });
  },
  
  // Clear active journey
  clearActiveJourney: () => {
    set({
      activeJourney: null,
      activeStep: null,
      activeStepIndex: 0,
      error: null,
    });
  },
  
  // Update a specific step
  updateJourneyStep: (stepId, updates) => {
    const { activeJourney } = get();
    
    if (!activeJourney) return;
    
    const updatedSteps = activeJourney.steps.map((step) =>
      step.id === stepId ? { ...step, ...updates } : step
    );
    
    set({
      activeJourney: {
        ...activeJourney,
        steps: updatedSteps,
      },
    });
  },
  
  // Loading state
  setLoading: (loading) => {
    set({ isLoading: loading });
  },
  
  // Error state
  setError: (error) => {
    set({ error });
  },
}));

/**
 * SELECTORS - Derived state (memoized)
 */

// Get current path coordinates for map rendering
export const selectJourneyPath = (state: ActiveJourneyState): [number, number][] => {
  if (!state.activeJourney) return [];
  return state.activeJourney.steps.map((step) => step.location);
};

// Get journey stats
export const selectJourneyStats = (state: ActiveJourneyState) => {
  if (!state.activeJourney) {
    return {
      totalSteps: 0,
      totalDistance: 0,
      totalDuration: 0,
      countries: [],
      cities: [],
    };
  }
  
  const { steps } = state.activeJourney;
  
  const countries = new Set<string>();
  const cities = new Set<string>();
  
  steps.forEach((step) => {
    if (step.address?.country) countries.add(step.address.country);
    if (step.address?.city) cities.add(step.address.city);
  });
  
  return {
    totalSteps: steps.length,
    totalDistance: state.activeJourney.totalDistance || 0,
    totalDuration: state.activeJourney.totalDuration || 0,
    countries: Array.from(countries),
    cities: Array.from(cities),
  };
};

// Check if journey is complete
export const selectIsJourneyComplete = (state: ActiveJourneyState): boolean => {
  return state.activeJourney?.status === 'completed';
};

// Check if journey is ongoing
export const selectIsJourneyOngoing = (state: ActiveJourneyState): boolean => {
  return state.activeJourney?.status === 'ongoing';
};

/**
 * HOOKS - Convenience wrappers
 */

// Use active journey
export const useActiveJourney = () => {
  const journey = useJourneyStore((state) => state.activeJourney);
  const setJourney = useJourneyStore((state) => state.setActiveJourney);
  return [journey, setJourney] as const;
};

// Use active step
export const useActiveStep = () => {
  const step = useJourneyStore((state) => state.activeStep);
  const stepIndex = useJourneyStore((state) => state.activeStepIndex);
  const setStep = useJourneyStore((state) => state.setActiveStep);
  
  return { step, stepIndex, setStep };
};

// Use journey navigation
export const useJourneyNavigation = () => {
  const focusNext = useJourneyStore((state) => state.focusNextStep);
  const focusPrev = useJourneyStore((state) => state.focusPreviousStep);
  const activeIndex = useJourneyStore((state) => state.activeStepIndex);
  const totalSteps = useJourneyStore((state) => state.activeJourney?.steps.length || 0);
  
  return {
    focusNext,
    focusPrev,
    activeIndex,
    totalSteps,
    canGoNext: activeIndex < totalSteps - 1,
    canGoPrev: activeIndex > 0,
  };
};
