
import { Trip, JourneyStep, TransportMode } from '@/types/trip';


export function getIsolatedRoute(tripId: string, allTrips: Trip[]): Trip | null {
  const trip = allTrips.find(t => t.id === tripId);
  
  if (!trip) {
    console.warn(`⚠️ Trip ${tripId} not found - returning null`);
    return null;
  }

  const validatedSteps = validateStepChain(trip.steps);
  
  return {
    ...trip,
    steps: validatedSteps,
  };
}

export function validateStepChain(steps: JourneyStep[]): JourneyStep[] {
  if (steps.length === 0) {
    return [];
  }

  const sorted = [...steps].sort((a, b) => {
    if (a.order !== b.order) {
      return a.order - b.order;
    }
    return a.timestamp - b.timestamp;
  });

  sorted.forEach((step, index) => {
    if (step.order !== index) {
      console.warn(`⚠️ Step order mismatch at index ${index}: expected ${index}, got ${step.order}`);
      step.order = index;
    }
  });

  if (sorted.length > 0) {
    const lastStep = sorted[sorted.length - 1];
    if (lastStep.transportToNext !== null) {
      console.warn(`⚠️ Last step "${lastStep.name}" has transportToNext - fixing to null`);
      lastStep.transportToNext = null;
    }
  }

  return sorted;
}

export function createJourneyStep(
  name: string,
  coordinates: [number, number],
  order: number,
  transportToNext: TransportMode | null = null
): JourneyStep {
  return {
    id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    coordinates,
    transportToNext,
    timestamp: Date.now(),
    order,
  };
}

export function insertStepSafely(
  existingSteps: JourneyStep[],
  newStep: Omit<JourneyStep, 'id' | 'timestamp' | 'order'>,
  insertAtIndex?: number
): JourneyStep[] {
  const steps = [...existingSteps];
  
  const index = insertAtIndex !== undefined ? insertAtIndex : steps.length;
  
  const fullStep: JourneyStep = {
    ...newStep,
    id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    order: index,
  };
  
  steps.splice(index, 0, fullStep);
  
  steps.forEach((step, idx) => {
    step.order = idx;
  });
  
  if (steps.length > 0) {
    steps[steps.length - 1].transportToNext = null;
  }
  
  return steps;
}

export function removeStepSafely(
  existingSteps: JourneyStep[],
  stepId: string
): JourneyStep[] {
  const steps = existingSteps.filter(s => s.id !== stepId);
  
  steps.forEach((step, idx) => {
    step.order = idx;
  });
  
  if (steps.length > 0) {
    steps[steps.length - 1].transportToNext = null;
  }
  
  return steps;
}

export function updateStepSafely(
  existingSteps: JourneyStep[],
  stepId: string,
  updates: Partial<Omit<JourneyStep, 'id' | 'order'>>
): JourneyStep[] {
  const steps = existingSteps.map(step => {
    if (step.id === stepId) {
      return { ...step, ...updates };
    }
    return step;
  });
  
  return validateStepChain(steps);
}


export function validateTrip(trip: Trip): string[] {
  const errors: string[] = [];
  
  if (!trip.id) {
    errors.push('Trip ID is required');
  }
  
  if (!trip.userId) {
    errors.push('User ID is required');
  }
  
  if (!trip.name || trip.name.trim() === '') {
    errors.push('Trip name is required');
  }
  
  if (!trip.color || !trip.color.match(/^#[0-9A-F]{6}$/i)) {
    errors.push('Valid hex color is required');
  }
  
  if (!trip.steps || trip.steps.length === 0) {
    errors.push('Trip must have at least one step');
  }
  
  trip.steps.forEach((step, idx) => {
    if (!step.id) {
      errors.push(`Step ${idx}: ID is required`);
    }
    
    if (!step.name || step.name.trim() === '') {
      errors.push(`Step ${idx}: Name is required`);
    }
    
    if (!step.coordinates || step.coordinates.length !== 2) {
      errors.push(`Step ${idx}: Valid coordinates [lng, lat] required`);
    }
    
    if (step.order !== idx) {
      errors.push(`Step ${idx}: Order mismatch (expected ${idx}, got ${step.order})`);
    }
    
    if (idx === trip.steps.length - 1 && step.transportToNext !== null) {
      errors.push(`Step ${idx}: Last step should have transportToNext = null`);
    }
    
    if (idx < trip.steps.length - 1 && !step.transportToNext) {
      errors.push(`Step ${idx}: Non-last step must have transportToNext`);
    }
  });
  
  return errors;
}

export function tripsAreIsolated(trip1: Trip, trip2: Trip): boolean {
  const step1Ids = new Set(trip1.steps.map(s => s.id));
  const step2Ids = new Set(trip2.steps.map(s => s.id));
  
  for (const id of step1Ids) {
    if (step2Ids.has(id)) {
      console.error(`❌ ISOLATION BREACH: Step ID ${id} exists in both trips!`);
      return false;
    }
  }
  
  return true;
}


export function tripToGeoJSON(trip: Trip): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];
  
  for (let i = 0; i < trip.steps.length - 1; i++) {
    const start = trip.steps[i];
    const end = trip.steps[i + 1];
    
    features.push({
      type: 'Feature',
      properties: {
        tripId: trip.id,
        tripName: trip.name,
        tripColor: trip.color,
        segmentIndex: i,
        transportType: start.transportToNext,
        startName: start.name,
        endName: end.name,
      },
      geometry: {
        type: 'LineString',
        coordinates: [start.coordinates, end.coordinates],
      },
    });
  }
  
  return {
    type: 'FeatureCollection',
    features,
  };
}

export function stepsToGeoJSON(trip: Trip): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = trip.steps.map((step, index) => ({
    type: 'Feature',
    properties: {
      tripId: trip.id,
      stepId: step.id,
      name: step.name,
      order: step.order,
      isFirst: index === 0,
      isLast: index === trip.steps.length - 1,
      transportToNext: step.transportToNext,
    },
    geometry: {
      type: 'Point',
      coordinates: step.coordinates,
    },
  }));
  
  return {
    type: 'FeatureCollection',
    features,
  };
}
