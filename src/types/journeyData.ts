import { Timestamp } from './index';
import { TransportMode as BaseTransportMode } from './trip';

export type TransportMode = BaseTransportMode;

export interface JourneyStep {
  id: string;
  name: string;
  coordinates: [number, number];
  address?: {
    city?: string;
    country?: string;
    formatted?: string;
  };
  timestamp: number;
  order: number;
  transportToNext: TransportMode | null;
  durationToNext?: number;
  distanceToNext?: number;
  notes?: string;

  // Optional link to an existing Place document
  placeId?: string;

  // Cached Directions API geometry — [lng, lat][] pairs.
  // Populated for car/bus/bike/walk; null for flight/train/ship (straight line).
  routeGeometry?: [number, number][] | null;
}

export interface Journey {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color: string;
  steps: JourneyStep[];
  startDate: Timestamp;
  endDate: Timestamp;
  isPublic: boolean;
  tags?: string[];
  coverPhotoUrl?: string;
  totalDistance?: number;
  totalDuration?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateJourneyInput {
  name: string;
  description?: string;
  color: string;
  steps: Omit<JourneyStep, 'id'>[];
  startDate?: Date;
  endDate?: Date;
  isPublic: boolean;
  tags?: string[];
}

export interface UpdateJourneyInput {
  id: string;
  name?: string;
  description?: string;
  color?: string;
  steps?: JourneyStep[];
  startDate?: Date;
  endDate?: Date;
  isPublic?: boolean;
  tags?: string[];
}

export const JOURNEY_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#FFA07A',
  '#98D8C8',
  '#F7DC6F',
  '#BB8FCE',
  '#85C1E2',
  '#F8B739',
  '#52C17C',
] as const;

export type JourneyColor = typeof JOURNEY_COLORS[number];

export const validateJourneySteps = (steps: JourneyStep[]): string[] => {
  const errors: string[] = [];

  if (steps.length === 0) {
    errors.push('Journey must have at least one step');
    return errors;
  }

  const seenIds = new Set<string>();
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];

    if (seenIds.has(step.id)) {
      errors.push(`Duplicate step ID: ${step.id}`);
    }
    seenIds.add(step.id);

    if (step.order !== i) {
      errors.push(`Step ${step.id} has wrong order: expected ${i}, got ${step.order}`);
    }

    if (i === steps.length - 1) {
      if (step.transportToNext !== null) {
        errors.push(`Last step ${step.id} must have transportToNext as null`);
      }
    } else {
      if (step.transportToNext === null) {
        errors.push(`Step ${step.id} must have a transport mode (not the last step)`);
      }
    }

    if (i > 0) {
      const prevStep = steps[i - 1];
      if (step.timestamp <= prevStep.timestamp) {
        errors.push(`Step ${step.id} timestamp must be after previous step`);
      }
    }
  }

  return errors;
};

export const normalizeStepChain = (steps: JourneyStep[]): JourneyStep[] => {
  return steps
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((step, index) => ({
      ...step,
      order: index,
      transportToNext: index === steps.length - 1 ? null : step.transportToNext,
    }));
};
