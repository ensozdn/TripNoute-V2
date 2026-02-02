import { Location, Address } from '@/types';

export interface IMapService {
  initialize(apiKey: string): Promise<void>;
  getCurrentLocation(): Promise<Location>;
  getAddressFromCoordinates(location: Location): Promise<Address>;
  getCoordinatesFromAddress(address: string): Promise<Location>;
  searchPlaces(query: string, location?: Location): Promise<PlaceSearchResult[]>;
  getAutocompleteSuggestions(input: string, location?: Location): Promise<AutocompleteSuggestion[]>;
  calculateDistance(from: Location, to: Location): number;
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
