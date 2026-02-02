/**
 * TripNoute V2 - Trip & Journey Type Definitions
 * 
 * LINEAR, ISOLATED ITINERARY SYSTEM (Polarsteps-style)
 * 
 * Core Principle: Each Trip is a SANDBOX - no data bleeding between trips.
 * Chain: A → B → C (always sorted by order/timestamp)
 */

import { Timestamp } from './index';

// ============================================
// TRANSPORT MODES
// ============================================
export type TransportMode = 
  | 'flight' 
  | 'car' 
  | 'bus' 
  | 'train' 
  | 'ship' 
  | 'walk'
  | 'walking'
  | 'bike';

// ============================================
// JOURNEY STEP (Single Point in Trip Chain)
// ============================================
export interface JourneyStep {
  id: string;                           // Unique step identifier
  name: string;                         // Location name
  coordinates: [number, number];        // [lng, lat] for Mapbox
  timestamp: number;                    // Unix timestamp (ms)
  order: number;                        // Position in chain (0, 1, 2...)
  transportToNext: TransportMode | null; // How to get to NEXT step (null if last)
  
  // Optional fields
  notes?: string;                       // User notes
  address?: {
    city?: string;
    country?: string;
    formatted?: string;
  };
  durationToNext?: number;              // Minutes to next step
  distanceToNext?: number;              // Kilometers to next step
}

// ============================================
// TRIP (Complete Itinerary)
// ============================================
export interface Trip {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color: string;
  
  // THE CHAIN - Core of the system
  steps: JourneyStep[];                 // MUST be sorted by order
  
  // Metadata
  startDate?: Timestamp;
  endDate?: Timestamp;
  isPublic: boolean;
  tags?: string[];
  coverPhotoUrl?: string;
  
  // Auto-calculated
  totalDistance?: number;               // Total km
  totalDuration?: number;               // Total minutes
  
  // Audit
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// INPUT TYPES (For Create/Update)
// ============================================
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

// ============================================
// TRIP COLORS (Preset Palette)
// ============================================
export const TRIP_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#FFA07A', // Salmon
  '#98D8C8', // Mint
  '#F7DC6F', // Yellow
  '#BB8FCE', // Purple
  '#85C1E2', // Light Blue
  '#F8B739', // Orange
  '#52C17C', // Green
] as const;

export type TripColor = typeof TRIP_COLORS[number];
