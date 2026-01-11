/**
 * TripNoute v2 - Google Maps Service
 * 
 * Centralized service for Google Maps API operations.
 * Handles map initialization, markers, and geocoding.
 */

import { Loader } from '@googlemaps/js-api-loader';

// Types
export interface MapConfig {
  center: google.maps.LatLngLiteral;
  zoom: number;
  mapId?: string;
}

export interface MarkerData {
  id: string;
  position: google.maps.LatLngLiteral;
  title: string;
  description?: string;
}

export interface GeocodingResult {
  lat: number;
  lng: number;
  formattedAddress: string;
}

class GoogleMapsService {
  private loader: Loader | null = null;
  private isLoaded: boolean = false;

  /**
   * Initialize Google Maps API
   */
  private async initLoader(): Promise<void> {
    if (this.isLoaded) return;

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      throw new Error('Google Maps API key is not configured');
    }

    this.loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places', 'geocoding'],
    });

    // Load the Google Maps JavaScript API
    await (this.loader as any).load();
    this.isLoaded = true;
  }

  /**
   * Create a new map instance
   */
  async createMap(
    element: HTMLElement,
    config: MapConfig
  ): Promise<google.maps.Map> {
    await this.initLoader();

    const { center, zoom, mapId } = config;

    const map = new google.maps.Map(element, {
      center,
      zoom,
      mapId,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      scaleControl: true,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: true,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
      ],
    });

    return map;
  }

  /**
   * Add a marker to the map
   */
  async addMarker(
    map: google.maps.Map,
    data: MarkerData
  ): Promise<google.maps.Marker> {
    await this.initLoader();

    const marker = new google.maps.Marker({
      position: data.position,
      map,
      title: data.title,
      animation: google.maps.Animation.DROP,
    });

    // Add info window if description exists
    if (data.description) {
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold;">${data.title}</h3>
            <p style="margin: 0; color: #666;">${data.description}</p>
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });
    }

    return marker;
  }

  /**
   * Add multiple markers to the map
   */
  async addMarkers(
    map: google.maps.Map,
    markers: MarkerData[]
  ): Promise<google.maps.Marker[]> {
    const markerInstances = await Promise.all(
      markers.map((data) => this.addMarker(map, data))
    );

    return markerInstances;
  }

  /**
   * Fit map bounds to show all markers
   */
  fitBoundsToMarkers(
    map: google.maps.Map,
    positions: google.maps.LatLngLiteral[]
  ): void {
    if (positions.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    positions.forEach((pos) => bounds.extend(pos));
    map.fitBounds(bounds);

    // Add padding
    const padding = { top: 50, right: 50, bottom: 50, left: 50 };
    map.fitBounds(bounds, padding);
  }

  /**
   * Geocode an address to coordinates
   */
  async geocodeAddress(address: string): Promise<GeocodingResult> {
    await this.initLoader();

    const geocoder = new google.maps.Geocoder();

    return new Promise((resolve, reject) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          resolve({
            lat: location.lat(),
            lng: location.lng(),
            formattedAddress: results[0].formatted_address,
          });
        } else {
          reject(new Error(`Geocoding failed: ${status}`));
        }
      });
    });
  }

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocode(
    lat: number,
    lng: number
  ): Promise<string> {
    await this.initLoader();

    const geocoder = new google.maps.Geocoder();
    const latlng = { lat, lng };

    return new Promise((resolve, reject) => {
      geocoder.geocode({ location: latlng }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          resolve(results[0].formatted_address);
        } else {
          reject(new Error(`Reverse geocoding failed: ${status}`));
        }
      });
    });
  }

  /**
   * Get default center (world view)
   */
  getDefaultCenter(): google.maps.LatLngLiteral {
    return { lat: 20, lng: 0 };
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  }
}

// Singleton instance
export const googleMapsService = new GoogleMapsService();
