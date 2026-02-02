import type { Map as MapboxMap, Marker as MapboxMarker, LngLatLike } from 'mapbox-gl';

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

export interface MapboxConfig {
  accessToken: string;
  container: string | HTMLElement;
  style?: string;
  center?: [number, number];
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

export interface IMapboxService {

  initializeMap(config: MapboxConfig): Promise<MapboxMap>;
  destroyMap(): void;
  getMap(): MapboxMap | null;

  addMarker(marker: MapMarker): MapboxMarker;
  removeMarker(markerId: string): void;
  clearMarkers(): void;

  flyTo(lat: number, lng: number, zoom?: number): void;
  jumpTo(lat: number, lng: number, zoom?: number): void;
  fitBounds(markers: MapMarker[]): void;

  clearRouteLines(): void;
  focusOnPlace(
    placeId: string,
    places: Array<{ id: string; location: { lat: number; lng: number } }>,
    options?: { zoom?: number; pitch?: number; bearing?: number; duration?: number }
  ): void;
  focusOnRoute(places: Array<{ location: { lat: number; lng: number } }>): void;

  enableUserLocation(): void;
  getUserLocation(): Promise<{ lat: number; lng: number } | null>;
  flyToUserLocation(zoom?: number): Promise<{ lat: number; lng: number } | null>;

  onClick(callback: (lat: number, lng: number) => void): void;
  onMarkerClick(callback: (markerId: string) => void): void;
}

export interface IGooglePlacesService {

  searchPlaces(request: GooglePlaceSearchRequest): Promise<GooglePlaceResult[]>;

  autocomplete(request: GooglePlaceAutocompleteRequest): Promise<GooglePlaceResult[]>;

  getPlaceDetails(placeId: string): Promise<GooglePlaceDetails>;

  geocodeAddress(address: string): Promise<{ lat: number; lng: number }>;
  reverseGeocode(lat: number, lng: number): Promise<string>;
}

export interface HybridMapConfig {
  mapbox: {
    accessToken: string;
    style?: string;
  };
  google: {
    apiKey: string;
  };
  initialView?: {
    center: [number, number];
    zoom: number;
  };
}

export interface SearchResult extends GooglePlaceResult {

  mapboxPosition: LngLatLike;
}
