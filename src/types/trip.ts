
import { Timestamp } from './index';


export interface JourneyStep {
  id: string;                           
  name: string;                         
  coordinates: [number, number];        
  transportToNext: TransportMode | null; 
  timestamp: number;                    
  order: number;                        
  notes?: string;                       
  address?: {
    city?: string;
    country?: string;
    formatted?: string;
  };
}

export interface Trip {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color: string;
  steps: JourneyStep[];
  title?: string;
  placeIds?: string[];
  startDate?: Timestamp;
  endDate?: Timestamp;
  isPublic: boolean;
  tags?: string[];
  coverPhotoUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}


export type TransportMode = 
  | 'flight' 
  | 'car' 
  | 'bus' 
  | 'train' 
  | 'ship' 
  | 'walk'
  | 'walking'
  | 'bike';


export interface Stop {
  id: string;
  name: string;
  coordinates: [number, number]; 
  transportToNext: TransportMode | null;
  order: number;
}

export interface TripStop {
  id: string;                    
  order: number;                 
  placeId?: string;              
  location: {
    lat: number;
    lng: number;
  };
  title: string;                 
  address?: {
    formatted: string;
    city?: string;
    country?: string;
  };
  description?: string;          
  arrivalDate?: Date;            
  departureDate?: Date;          
  transportToNext?: TransportMode; 
  photos?: string[];             
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


export interface TripWithPlaces extends Trip {
  places: any[]; 
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
