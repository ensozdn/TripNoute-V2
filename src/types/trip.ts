import { Timestamp } from './index';

export type TransportMode = 
  | 'flight' 
  | 'car' 
  | 'bus' 
  | 'train' 
  | 'ship' 
  | 'walk'
  | 'walking'
  | 'bike';

export interface JourneyStep {
  id: string;
  name: string;
  coordinates: [number, number];
  timestamp: number;
  order: number;
  transportToNext: TransportMode | null;

  // Optional link to an existing Place document
  placeId?: string;

  notes?: string;
  address?: {
    city?: string;
    country?: string;
    formatted?: string;
  };
  durationToNext?: number;
  distanceToNext?: number;

  // Cached Directions API geometry — [lng, lat][] pairs.
  // Populated for car/bus/bike/walk; null for flight/train/ship (straight line).
  routeGeometry?: [number, number][] | null;
}

export interface Trip {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color: string;

  steps: JourneyStep[];

  startDate?: Timestamp;
  endDate?: Timestamp;
  isPublic: boolean;
  tags?: string[];
  coverPhotoUrl?: string;

  totalDistance?: number;
  totalDuration?: number;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateTripInput {
  name: string;
  description?: string;
  color: string;
  steps: Omit<JourneyStep, 'id'>[]; 
  startDate?: Date;
  endDate?: Date;
  isPublic: boolean;
  tags?: string[];
}

export interface UpdateTripInput {
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

export const TRIP_COLORS = [
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

export type TripColor = typeof TRIP_COLORS[number];
