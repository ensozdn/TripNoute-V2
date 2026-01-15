/**
 * Maps Type Definitions
 * Hibrit Harita Modeli: Mapbox (UI/Görsellik) + Google Places (Data/Search)
 */

import type { Map as MapboxMap, Marker as MapboxMarker, LngLatLike } from 'mapbox-gl';

// ============================================
// GOOGLE PLACES TYPES
// ============================================

export interface GooglePlaceSearchRequest {
  query: string;
  location?: { lat: number; lng: number };
  radius?: number;
}

export interface GooglePlaceAutocompleteRequest {
  input: string;
  types?: string[];
  location?: { lat: number; lng: number };
  radius?: number;
}

export interface GooglePlaceResult {
  placeId: string;
  name: string;
  formattedAddress: string;
  location: {
    lat: number;
    lng: number;
  };
  types?: string[];
  photoReference?: string;
}

export interface GooglePlaceDetails extends GooglePlaceResult {
  phoneNumber?: string;
  website?: string;
  rating?: number;
  openingHours?: string[];
  reviews?: Array<{
    author: string;
    rating: number;
    text: string;
  }>;
}

// ============================================
// MAPBOX TYPES
// ============================================

export interface MapboxConfig {
  accessToken: string;
  container: string | HTMLElement;
  style?: string;
  center?: [number, number]; // [lng, lat]
  zoom?: number;
  pitch?: number;
  bearing?: number;
}

export interface MapMarker {
  id: string;
  position: {
    lat: number;
    lng: number;
  };
  title?: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapViewport {
  center: {
    lat: number;
    lng: number;
  };
  zoom: number;
  bounds?: MapBounds;
}

// ============================================
// MAPBOX SERVICE TYPES
// ============================================

export interface IMapboxService {
  // Map Lifecycle
  initializeMap(config: MapboxConfig): Promise<MapboxMap>;
  destroyMap(): void;
  getMap(): MapboxMap | null;
  
  // Markers
  addMarker(marker: MapMarker): MapboxMarker;
  removeMarker(markerId: string): void;
  clearMarkers(): void;
  
  // Navigation
  flyTo(lat: number, lng: number, zoom?: number): void;
  jumpTo(lat: number, lng: number, zoom?: number): void;
  fitBounds(markers: MapMarker[]): void;
  
  // Route Lines (Polarsteps-style)
  drawRouteLines(places: Array<{ id: string; location: { lat: number; lng: number }; visitDate: any }>): void;
  clearRouteLines(): void;
  focusOnPlace(
    placeId: string,
    places: Array<{ id: string; location: { lat: number; lng: number } }>,
    options?: { zoom?: number; pitch?: number; bearing?: number; duration?: number }
  ): void;
  focusOnRoute(places: Array<{ location: { lat: number; lng: number } }>): void;
  
  // User Location
  enableUserLocation(): void;
  flyToUserLocation(zoom?: number): Promise<{ lat: number; lng: number } | null>;
  
  // Events
  onClick(callback: (lat: number, lng: number) => void): void;
  onMarkerClick(callback: (markerId: string) => void): void;
}

// ============================================
// GOOGLE PLACES SERVICE TYPES
// ============================================

export interface IGooglePlacesService {
  // Search
  searchPlaces(request: GooglePlaceSearchRequest): Promise<GooglePlaceResult[]>;
  
  // Autocomplete
  autocomplete(request: GooglePlaceAutocompleteRequest): Promise<GooglePlaceResult[]>;
  
  // Details
  getPlaceDetails(placeId: string): Promise<GooglePlaceDetails>;
  
  // Geocoding
  geocodeAddress(address: string): Promise<{ lat: number; lng: number }>;
  reverseGeocode(lat: number, lng: number): Promise<string>;
}

// ============================================
// HYBRID MAP TYPES (Combined)
// ============================================

export interface HybridMapConfig {
  mapbox: {
    accessToken: string;
    style?: string;
  };
  google: {
    apiKey: string;
  };
  initialView?: {
    center: [number, number]; // [lng, lat]
    zoom: number;
  };
}

export interface SearchResult extends GooglePlaceResult {
  // Google'dan gelen data + Mapbox'a gönderilecek format
  mapboxPosition: LngLatLike;
}
