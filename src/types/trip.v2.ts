import { Timestamp } from './index';

/**
 * TRANSPORT TYPES - Single Source of Truth
 */
export type TransportMode = 
  | 'flight' 
  | 'car' 
  | 'bus' 
  | 'train' 
  | 'ship' 
  | 'walk'
  | 'boat'
  | 'bike';

/**
 * STEP TYPES - Defines the nature of the location
 */
export type StepType = 
  | 'stay'      // Konaklama/geceleme (otel, Airbnb)
  | 'transit'   // Geçiş noktası (aktarma, durak)
  | 'visit';    // Ziyaret (müze, landmark)

/**
 * TRIP STATUS - Lifecycle tracking
 */
export type TripStatus = 
  | 'planning'   // Henüz başlamadı
  | 'ongoing'    // Devam ediyor
  | 'completed'  // Tamamlandı
  | 'cancelled'; // İptal edildi

/**
 * STEP METADATA - Rich context for each stop
 */
export interface StepMetadata {
  arrivalTime?: string;           // ISO format: "2026-02-10T14:30:00Z"
  departureTime?: string;
  weather?: {
    temp: number;                 // Celsius
    condition: string;            // "Sunny", "Rainy", etc.
    icon?: string;
  };
  accommodation?: {
    name: string;
    address: string;
    checkIn?: string;
    checkOut?: string;
  };
  notes?: string;                 // Kısa notlar
  tags?: string[];                // ["beach", "nightlife", "culture"]
}

/**
 * JOURNEY STEP - Core building block of a trip
 * Her durak için zengin veri yapısı
 */
export interface JourneyStep {
  id: string;
  title: string;                  // "Istanbul, Turkey"
  type: StepType;                 // 'stay' | 'transit' | 'visit'
  
  // Location
  location: [number, number];     // [lng, lat]
  address?: {
    city?: string;
    country?: string;
    formatted?: string;
  };
  
  // Chronology
  arrivalDate: Date;              // Actual Date object (not timestamp)
  departureDate?: Date;           // Optional for final destination
  order: number;                  // Sequence in journey (0-indexed)
  
  // Transport to next step
  transportToNext: TransportMode | null;  // null for last step
  durationToNext?: number;        // Minutes
  distanceToNext?: number;        // Kilometers
  
  // Rich content
  gallery: string[];              // Photo URLs
  metadata: StepMetadata;
}

/**
 * TRIP - Main container for a journey
 * Kullanıcının seyahat planı/kaydı
 */
export interface Trip {
  id: string;
  userId: string;
  
  // Identity
  name: string;                   // "European Adventure 2026"
  description?: string;
  color: string;                  // Hex color for map visualization
  coverPhotoUrl?: string;
  
  // Status
  status: TripStatus;             // 'planning' | 'ongoing' | 'completed'
  
  // Steps
  steps: JourneyStep[];           // Ordered by `order` field
  
  // Timeline
  startDate?: Timestamp;          // Firebase Timestamp
  endDate?: Timestamp;
  
  // Computed stats (calculated on save)
  totalDistance?: number;         // Kilometers
  totalDuration?: number;         // Minutes
  
  // Sharing
  isPublic: boolean;
  tags?: string[];
  
  // Audit
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * CREATE TRIP INPUT - For new trip creation
 */
export interface CreateTripInput {
  name: string;
  description?: string;
  color: string;
  status: TripStatus;
  steps: Omit<JourneyStep, 'id' | 'order'>[]; // Auto-generated
  startDate?: Date;
  endDate?: Date;
  isPublic: boolean;
  tags?: string[];
}

/**
 * UPDATE TRIP INPUT - For trip updates
 */
export interface UpdateTripInput {
  id: string;
  name?: string;
  description?: string;
  color?: string;
  status?: TripStatus;
  steps?: JourneyStep[];
  startDate?: Date;
  endDate?: Date;
  isPublic?: boolean;
  tags?: string[];
  coverPhotoUrl?: string;
}

/**
 * TRIP COLORS - Predefined palette
 */
export const TRIP_COLORS = [
  '#FF6B6B',  // Red
  '#4ECDC4',  // Turquoise
  '#45B7D1',  // Blue
  '#FFA07A',  // Orange
  '#98D8C8',  // Mint
  '#F7DC6F',  // Yellow
  '#BB8FCE',  // Purple
  '#85C1E2',  // Sky
  '#F8B739',  // Gold
  '#52C17C',  // Green
] as const;

export type TripColor = typeof TRIP_COLORS[number];

/**
 * UTILITY: Sort steps by arrival date (chronological order)
 */
export function sortStepsByDate(steps: JourneyStep[]): JourneyStep[] {
  return [...steps].sort((a, b) => {
    return new Date(a.arrivalDate).getTime() - new Date(b.arrivalDate).getTime();
  });
}

/**
 * UTILITY: Calculate total distance
 */
export function calculateTripDistance(steps: JourneyStep[]): number {
  return steps.reduce((total, step) => total + (step.distanceToNext || 0), 0);
}

/**
 * UTILITY: Calculate total duration
 */
export function calculateTripDuration(steps: JourneyStep[]): number {
  return steps.reduce((total, step) => total + (step.durationToNext || 0), 0);
}

/**
 * UTILITY: Get trip date range
 */
export function getTripDateRange(trip: Trip): { start: Date | null; end: Date | null } {
  if (trip.steps.length === 0) {
    return { start: null, end: null };
  }
  
  const sorted = sortStepsByDate(trip.steps);
  const start = sorted[0].arrivalDate;
  const lastStep = sorted[sorted.length - 1];
  const end = lastStep.departureDate || lastStep.arrivalDate;
  
  return { start, end };
}
