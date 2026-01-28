/**
 * Google Places Service
 * Sadece Google Places API ile veri işlemleri yapar
 * Arama, otomatik tamamlama, yer detayları, geocoding
 */

import type {
  IGooglePlacesService,
  GooglePlaceSearchRequest,
  GooglePlaceAutocompleteRequest,
  GooglePlaceResult,
  GooglePlaceDetails,
} from '@/types/maps';

class GooglePlacesService implements IGooglePlacesService {
  private apiKey: string;
  private autocompleteService: google.maps.places.AutocompleteService | null = null;
  private placesService: google.maps.places.PlacesService | null = null;
  private geocoder: google.maps.Geocoder | null = null;
  private isLoaded = false;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Google Maps API'yi yükle
   */
  private async loadGoogleMapsAPI(): Promise<void> {
    if (this.isLoaded) return;

    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Window is not defined'));
        return;
      }

      if (window.google?.maps) {
        this.initializeServices();
        this.isLoaded = true;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        this.initializeServices();
        this.isLoaded = true;
        resolve();
      };

      script.onerror = () => reject(new Error('Failed to load Google Maps API'));

      document.head.appendChild(script);
    });
  }

  /**
   * Google servisleri başlat
   */
  private initializeServices(): void {
    if (!window.google?.maps) return;

    this.autocompleteService = new google.maps.places.AutocompleteService();
    this.geocoder = new google.maps.Geocoder();

    // PlacesService için bir dummy div gerekli
    const dummyDiv = document.createElement('div');
    this.placesService = new google.maps.places.PlacesService(dummyDiv);
  }

  /**
   * Yer arama
   */
  async searchPlaces(request: GooglePlaceSearchRequest): Promise<GooglePlaceResult[]> {
    await this.loadGoogleMapsAPI();

    return new Promise((resolve, reject) => {
      if (!this.placesService) {
        reject(new Error('Places service not initialized'));
        return;
      }

      const searchRequest: google.maps.places.TextSearchRequest = {
        query: request.query,
        ...(request.location && { location: request.location }),
        ...(request.radius && { radius: request.radius }),
      };

      this.placesService.textSearch(searchRequest, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          const places: GooglePlaceResult[] = results.map((place) => ({
            placeId: place.place_id || '',
            name: place.name || '',
            formattedAddress: place.formatted_address || '',
            location: {
              lat: place.geometry?.location?.lat() || 0,
              lng: place.geometry?.location?.lng() || 0,
            },
            types: place.types,
            photoReference: place.photos?.[0]?.getUrl(),
          }));
          resolve(places);
        } else {
          console.warn('Google Places search failed:', status);
          resolve([]);
        }
      });
    });
  }

  /**
   * Otomatik tamamlama
   */
  async autocomplete(request: GooglePlaceAutocompleteRequest): Promise<GooglePlaceResult[]> {
    await this.loadGoogleMapsAPI();

    return new Promise((resolve, reject) => {
      if (!this.autocompleteService) {
        reject(new Error('Autocomplete service not initialized'));
        return;
      }

      const autocompleteRequest: google.maps.places.AutocompletionRequest = {
        input: request.input,
        ...(request.types && { types: request.types }),
      };

      this.autocompleteService.getPlacePredictions(autocompleteRequest, async (predictions, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          // Her prediction için detayları al (lat/lng gerekli)
          const placesPromises = predictions.map(async (prediction) => {
            try {
              const details = await this.getPlaceDetails(prediction.place_id);
              return {
                placeId: prediction.place_id,
                name: prediction.structured_formatting.main_text,
                formattedAddress: prediction.description,
                location: details.location,
                types: prediction.types || [],
              };
            } catch (error) {
              console.warn('Failed to get place details:', error);
              return null;
            }
          });

          const places = await Promise.all(placesPromises);
          resolve(places.filter((place) => place !== null) as GooglePlaceResult[]);
        } else {
          console.warn('Google Autocomplete failed:', status);
          resolve([]);
        }
      });
    });
  }

  /**
   * Yer detayları getir
   */
  async getPlaceDetails(placeId: string): Promise<GooglePlaceDetails> {
    await this.loadGoogleMapsAPI();

    return new Promise((resolve, reject) => {
      if (!this.placesService) {
        reject(new Error('Places service not initialized'));
        return;
      }

      const request: google.maps.places.PlaceDetailsRequest = {
        placeId,
        fields: [
          'place_id',
          'name',
          'formatted_address',
          'geometry',
          'types',
          'formatted_phone_number',
          'website',
          'rating',
          'opening_hours',
          'reviews',
          'photos',
        ],
      };

      this.placesService.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          const details: GooglePlaceDetails = {
            placeId: place.place_id || '',
            name: place.name || '',
            formattedAddress: place.formatted_address || '',
            location: {
              lat: place.geometry?.location?.lat() || 0,
              lng: place.geometry?.location?.lng() || 0,
            },
            types: place.types,
            photoReference: place.photos?.[0]?.getUrl(),
            phoneNumber: place.formatted_phone_number,
            website: place.website,
            rating: place.rating,
            openingHours: place.opening_hours?.weekday_text,
            reviews: place.reviews?.map((review) => ({
              author: review.author_name,
              rating: review.rating || 0,
              text: review.text,
            })),
          };
          resolve(details);
        } else {
          reject(new Error(`Failed to get place details: ${status}`));
        }
      });
    });
  }

  /**
   * Adres → Koordinat
   */
  async geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
    await this.loadGoogleMapsAPI();

    return new Promise((resolve, reject) => {
      if (!this.geocoder) {
        reject(new Error('Geocoder not initialized'));
        return;
      }

      this.geocoder.geocode({ address }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results?.[0]) {
          const location = results[0].geometry.location;
          resolve({
            lat: location.lat(),
            lng: location.lng(),
          });
        } else {
          reject(new Error(`Geocoding failed: ${status}`));
        }
      });
    });
  }

  /**
   * Koordinat → Adres
   */
  async reverseGeocode(lat: number, lng: number): Promise<string> {
    await this.loadGoogleMapsAPI();

    return new Promise((resolve, reject) => {
      if (!this.geocoder) {
        reject(new Error('Geocoder not initialized'));
        return;
      }

      this.geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results?.[0]) {
          resolve(results[0].formatted_address);
        } else if (status === google.maps.GeocoderStatus.ZERO_RESULTS) {
          // Handle cases with no address (ocean, desert, etc.)
          resolve('Unknown Location');
        } else {
          reject(new Error(`Reverse geocoding failed: ${status}`));
        }
      });
    });
  }
}

// Singleton instance
let googlePlacesServiceInstance: GooglePlacesService | null = null;

export const getGooglePlacesService = (): GooglePlacesService => {
  if (!googlePlacesServiceInstance) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('Google Maps API key not found');
    }
    googlePlacesServiceInstance = new GooglePlacesService(apiKey);
  }
  return googlePlacesServiceInstance;
};

export default GooglePlacesService;
