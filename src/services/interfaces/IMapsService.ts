/**
 * TripNoute v2 - Maps Service Interface
 * 
 * This interface defines the contract for map operations.
 * Provider-independent: Can be Google Maps, Mapbox, OpenStreetMap, etc.
 */

import { Location, Address } from '@/types';

export interface IMapService {
  /**
   * Initialize the map service
   */
  initialize(apiKey: string): Promise<void>;

  /**
   * Get user's current location
   */
  getCurrentLocation(): Promise<Location>;

  /**
   * Reverse geocode: Get address from coordinates
   */
  getAddressFromCoordinates(location: Location): Promise<Address>;

  /**
   * Forward geocode: Get coordinates from address
   */
  getCoordinatesFromAddress(address: string): Promise<Location>;

  /**
   * Search for places by query
   */
  searchPlaces(query: string, location?: Location): Promise<PlaceSearchResult[]>;

  /**
   * Get autocomplete suggestions
   */
  getAutocompleteSuggestions(input: string, location?: Location): Promise<AutocompleteSuggestion[]>;

  /**
   * Calculate distance between two points (in km)
   */
  calculateDistance(from: Location, to: Location): number;

  /**
   * Get static map image URL
   */
  getStaticMapUrl(location: Location, zoom: number, width: number, height: number): string;
}

export interface PlaceSearchResult {
  name: string;
  location: Location;
  address: Address;
  placeId: string;
  types: string[];
}

export interface AutocompleteSuggestion {
  description: string;
  placeId: string;
  mainText: string;
  secondaryText: string;
}
