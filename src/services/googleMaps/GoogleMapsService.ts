/**
 * TripNoute v2 - Google Maps Service
 * 
 * Centralized service for Google Maps API operations.
 * Handles map initialization, markers, and geocoding.
 */

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
  private isLoaded: boolean = false;
  private loadPromise: Promise<void> | null = null;

  /**
   * Initialize Google Maps API
   */
  private async initLoader(): Promise<void> {
    if (this.isLoaded) return;
    
    if (this.loadPromise) {
      return this.loadPromise;
    }

    // For client-side, Next.js injects env vars into process.env at build time
    // But we need to ensure it's available in browser
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.error('Google Maps API key not found!');
      console.log('Available env:', Object.keys(process.env).filter(k => k.includes('GOOGLE')));
      throw new Error('Google Maps API key is not configured. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local');
    }

    console.log('🔑 Using Google Maps API Key:', apiKey.substring(0, 10) + '...');

    this.loadPromise = new Promise((resolve, reject) => {
      // Check if already loaded
      if (typeof google !== 'undefined' && google.maps) {
        this.isLoaded = true;
        resolve();
        return;
      }

      // Create script element
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geocoding&v=weekly`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        this.isLoaded = true;
        resolve();
      };

      script.onerror = () => {
        reject(new Error('Failed to load Google Maps API'));
      };

      document.head.appendChild(script);
    });

    return this.loadPromise;
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
