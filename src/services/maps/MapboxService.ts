/**
 * Mapbox Service
 * Sadece harita görselleştirme ve marker yönetimi yapar
 * UI/Görsellik için Mapbox GL JS kullanır
 */

import mapboxgl from 'mapbox-gl';
import type {
  IMapboxService,
  MapboxConfig,
  MapMarker,
  MapViewport,
} from '@/types/maps';

class MapboxService implements IMapboxService {
  private map: mapboxgl.Map | null = null;
  private markers: Map<string, mapboxgl.Marker> = new Map();
  private clickCallback: ((lat: number, lng: number) => void) | null = null;
  private markerClickCallback: ((markerId: string) => void) | null = null;
  private routeLayerId: string = 'route-line';
  private routeSourceId: string = 'route-source';
  
  // Cinematic Globe Rotation
  private rotationAnimationId: number | null = null;
  private isRotating: boolean = false;
  private lastFrameTime: number = 0;
  private rotationSpeed: number = 0.05; // degrees per frame at 60fps

  /**
   * Haritayı başlat
   * Enhanced: Mobile-optimized globe projection with dynamic zoom/padding
   */
  async initializeMap(config: MapboxConfig): Promise<mapboxgl.Map> {
    if (this.map) {
      return this.map;
    }

    mapboxgl.accessToken = config.accessToken;

    try {
      // Detect mobile device
      const isMobile = window.innerWidth < 768;

      // Mobile-optimized settings: wider globe view, less cramped
      const mobileZoom = 1.2;  // Slightly zoomed out for wider cinematic view
      const desktopZoom = config.zoom || 1.5;

      this.map = new mapboxgl.Map({
        container: config.container,
        style: config.style || 'mapbox://styles/mapbox/dark-v11',
        center: config.center || [0, 20],  // Center at 20° N for better world view
        zoom: isMobile ? mobileZoom : desktopZoom,
        pitch: config.pitch || 0,
        bearing: config.bearing || 0,
        projection: 'globe' as any,  // Enable globe projection
        // Mobile-optimized padding for better screen utilization
        maxPitch: 85,
        antialias: true,
      });

      // Apply mobile-specific padding for safer clickable areas
      if (isMobile) {
        // Reduce padding on mobile to maximize map visibility
        this.map.setPadding({ top: 0, bottom: 0, left: 0, right: 0 });
      }

      // Removed Mapbox controls (NavigationControl, FullscreenControl) 
      // to prevent UI blocking on mobile
      // User location button is handled separately as custom button

      // Setup interrupt listeners for rotation
      this.setupRotationInterrupts();

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Map load timeout after 10 seconds'));
        }, 10000);

        this.map!.on('load', () => {
          clearTimeout(timeout);
          resolve();
        });

        this.map!.on('error', (e) => {
          clearTimeout(timeout);
          reject(new Error(`Map error: ${e.error?.message || 'Unknown error'}`));
        });
      });

      this.map.on('click', (e) => {
        if (this.clickCallback) {
          this.clickCallback(e.lngLat.lat, e.lngLat.lng);
        }
      });

      return this.map;
    } catch (error) {
      console.error('MapboxService initialization failed:', error);
      throw error;
    }
  }

  /**
   * Haritayı yok et
   */
  destroyMap(): void {
    this.stopRotation();
    if (this.map) {
      this.clearMarkers();
      this.map.remove();
      this.map = null;
      // Map destroyed successfully - no logging needed in production
    }
  }

  /**
   * Setup rotation interrupt listeners
   */
  private setupRotationInterrupts(): void {
    if (!this.map) return;

    // Stop rotation on any user interaction
    this.map.on('dragstart', () => this.stopRotation());
    this.map.on('zoomstart', () => this.stopRotation());
    this.map.on('pitchstart', () => this.stopRotation());
    this.map.on('rotatestart', () => this.stopRotation());
    this.map.on('touchstart', () => this.stopRotation());
  }

  /**
   * Start cinematic globe rotation
   */
  startSlowRotation(): void {
    if (!this.map || this.isRotating) return;

    this.isRotating = true;
    this.lastFrameTime = performance.now();

    const rotate = (currentTime: number): void => {
      if (!this.map || !this.isRotating) return;

      // Frame rate independent rotation
      const deltaTime = currentTime - this.lastFrameTime;
      const targetFrameTime = 1000 / 60; // 60fps
      const speedMultiplier = deltaTime / targetFrameTime;

      const center = this.map.getCenter();
      const newLng = center.lng + (this.rotationSpeed * speedMultiplier);

      this.map.setCenter([newLng, center.lat]);

      this.lastFrameTime = currentTime;
      this.rotationAnimationId = requestAnimationFrame(rotate);
    };

    this.rotationAnimationId = requestAnimationFrame(rotate);
  }

  /**
   * Stop globe rotation
   */
  stopRotation(): void {
    this.isRotating = false;
    if (this.rotationAnimationId !== null) {
      cancelAnimationFrame(this.rotationAnimationId);
      this.rotationAnimationId = null;
    }
  }

  /**
   * Check if globe is currently rotating
   */
  isGlobeRotating(): boolean {
    return this.isRotating;
  }

  /**
   * Harita instance'ını getir
   */
  getMap(): mapboxgl.Map | null {
    return this.map;
  }

  /**
   * Marker ekle
   */
  addMarker(marker: MapMarker): mapboxgl.Marker {
    if (!this.map) {
      throw new Error('Map not initialized');
    }

    // Özel marker elementi oluştur
    const el = document.createElement('div');
    el.className = 'custom-marker';
    el.style.width = '32px';
    el.style.height = '32px';
    el.style.cursor = 'pointer';
    
    // Icon varsa kullan, yoksa default
    if (marker.icon) {
      el.style.backgroundImage = `url(${marker.icon})`;
      el.style.backgroundSize = 'cover';
      el.style.borderRadius = '50%';
    } else {
      // Default marker (pin şeklinde)
      el.innerHTML = `
        <svg width="32" height="32" viewBox="0 0 24 24" fill="${marker.color || '#3b82f6'}">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      `;
    }

    // Mapbox marker oluştur
    const mapboxMarker = new mapboxgl.Marker(el)
      .setLngLat([marker.position.lng, marker.position.lat]);

    // Popup varsa ekle
    if (marker.title || marker.description) {
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 8px;">
          ${marker.title ? `<h3 style="margin: 0 0 4px 0; font-weight: 600;">${marker.title}</h3>` : ''}
          ${marker.description ? `<p style="margin: 0; font-size: 14px;">${marker.description}</p>` : ''}
        </div>
      `);
      mapboxMarker.setPopup(popup);
    }

    // Click event
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.markerClickCallback) {
        this.markerClickCallback(marker.id);
      }
    });

    // Haritaya ekle
    mapboxMarker.addTo(this.map);

    // Kaydet
    this.markers.set(marker.id, mapboxMarker);

    return mapboxMarker;
  }

  /**
   * Marker kaldır
   */
  removeMarker(markerId: string): void {
    const marker = this.markers.get(markerId);
    if (marker) {
      marker.remove();
      this.markers.delete(markerId);
    }
  }

  /**
   * Marker güncelle (pozisyon veya popup değiştiğinde)
   */
  updateMarker(updatedMarker: MapMarker): void {
    // Önce eski marker'ı kaldır
    this.removeMarker(updatedMarker.id);
    
    // Yeni marker'ı ekle
    this.addMarker(updatedMarker);
  }

  /**
   * Tüm marker'ları temizle
   */
  clearMarkers(): void {
    this.markers.forEach((marker) => marker.remove());
    this.markers.clear();
  }

  /**
   * Konuma uç (animasyonlu)
   */
  flyTo(lat: number, lng: number, zoom: number = 14): void {
    if (!this.map) {
      throw new Error('Map not initialized');
    }

    this.map.flyTo({
      center: [lng, lat],
      zoom,
      duration: 2000,
      essential: true,
    });
  }

  /**
   * Konuma zıpla (anında)
   */
  jumpTo(lat: number, lng: number, zoom: number = 14): void {
    if (!this.map) {
      throw new Error('Map not initialized');
    }

    this.map.jumpTo({
      center: [lng, lat],
      zoom,
    });
  }

  /**
   * Marker'ları içine alacak şekilde haritayı ayarla
   */
  fitBounds(markers: MapMarker[]): void {
    if (!this.map || markers.length === 0) return;

    if (markers.length === 1) {
      // Tek marker varsa ona uç
      this.flyTo(markers[0].position.lat, markers[0].position.lng, 12);
      return;
    }

    // Bounds hesapla
    const bounds = new mapboxgl.LngLatBounds();
    markers.forEach((marker) => {
      bounds.extend([marker.position.lng, marker.position.lat]);
    });

    // Fit bounds
    this.map.fitBounds(bounds, {
      padding: { top: 50, bottom: 50, left: 50, right: 50 },
      maxZoom: 15,
      duration: 1000,
    });
  }

  /**
   * Harita click event'i
   */
  onClick(callback: (lat: number, lng: number) => void): void {
    this.clickCallback = callback;
  }

  /**
   * Marker click event'i
   */
  onMarkerClick(callback: (markerId: string) => void): void {
    this.markerClickCallback = callback;
  }

  /**
   * Mevcut viewport bilgisini getir
   */
  getViewport(): MapViewport | null {
    if (!this.map) return null;

    const center = this.map.getCenter();
    const zoom = this.map.getZoom();
    const bounds = this.map.getBounds();

    return {
      center: {
        lat: center.lat,
        lng: center.lng,
      },
      zoom,
      bounds: bounds ? {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      } : undefined,
    };
  }

  /**
   * Kullanıcı konumunu aktif et (mavi nokta)
   * NOT: Globe rotation için otomatik trigger KAPALI
   * Enhanced: Better error handling and permission feedback
   */
  enableUserLocation(): void {
    if (!this.map) {
      throw new Error('Map not initialized');
    }

    // Check geolocation support first
    if (!('geolocation' in navigator)) {
      console.warn('Geolocation not supported in this browser');
      return;
    }

    const geolocateControl = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
        timeout: 10000, // Extend timeout for mobile
      },
      trackUserLocation: false, // We handle location manually
      showUserHeading: true,
      showUserLocation: true,
    });

    this.map.addControl(geolocateControl, 'top-right');

    // Better error handling for geolocation
    geolocateControl.on('error', () => {
      // Silent fail - permission denied or geolocation unavailable
      // User will see X icon but this is expected behavior
      // They can try custom location button instead
    });

    geolocateControl.on('geolocate', () => {
      // Geolocation successful - optional logging only
    });

    // REMOVED: Automatic trigger that was forcing map to user location
    // User can manually click the geolocate button if they want to see their location
    // this.map.on('load', () => {
    //   geolocateControl.trigger();
    // });
  }

  /**
   * Kullanıcının konumuna git
   * Enhanced: Robust geolocation with permission handling and mobile optimization
   */
  async flyToUserLocation(zoom: number = 12): Promise<{ lat: number; lng: number } | null> {
    return new Promise((resolve) => {
      // Check if geolocation is supported
      if (!('geolocation' in navigator)) {
        console.error('❌ Geolocation not supported in this browser');
        resolve(null);
        return;
      }

      console.log('🔍 Geolocation request starting...');

      // Stop any ongoing rotation for cinematic transition
      this.stopRotation();

      // Get current position with enhanced error handling
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('✅ getCurrentPosition SUCCESS callback triggered');
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const accuracy = position.coords.accuracy;

          console.log(`📍 Location: ${lat}, ${lng} (±${accuracy}m)`);

          if (!this.map) {
            console.warn('⚠️ Map not initialized, returning location only');
            resolve({ lat, lng });
            return;
          }

          // Fly to user location with essential: true for mobile
          console.log('🚀 Flying to location with zoom:', zoom);
          this.map.flyTo({
            center: [lng, lat],
            zoom,
            duration: 2000,
            essential: true, // Required for autoplay on mobile
            maxZoom: 16,
          });

          resolve({ lat, lng });
        },
        (error) => {
          console.log('❌ getCurrentPosition ERROR callback triggered:', error.code);
          // Handle different geolocation errors
          let errorMessage = 'Geolocation error';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Enable GPS in settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location unavailable. Please try again.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Please try again.';
              break;
          }
          
          console.warn('⚠️ ' + errorMessage);
          resolve(null);
        },
        {
          enableHighAccuracy: true,  // Request precise location
          timeout: 10000,             // Extended timeout for mobile
          maximumAge: 0,              // Always get fresh location
        }
      );
    });
  }

  /**
   * Harita stilini değiştir
   */
  setStyle(styleUrl: string): void {
    if (!this.map) {
      throw new Error('Map not initialized');
    }
    this.map.setStyle(styleUrl);
  }

  /**
   * 3D perspective açısını ayarla
   */
  setPitch(pitch: number): void {
    if (!this.map) {
      throw new Error('Map not initialized');
    }
    this.map.setPitch(pitch);
  }

  /**
   * Harita rotasyonunu ayarla
   */
  setBearing(bearing: number): void {
    if (!this.map) {
      throw new Error('Map not initialized');
    }
    this.map.setBearing(bearing);
  }

  /**
   * Polarsteps-style: Kavisli rota çizgileri çiz (Geodesic lines)
   * Zaman sırasına göre sıralanmış Place dizisi alır ve aralarında bağlantı çizer
   */
  drawRouteLines(places: Array<{ 
    id: string; 
    location: { lat: number; lng: number }; 
    visitDate: { seconds: number; nanoseconds: number } | Date;
  }>): void {
    if (!this.map || places.length < 2) {
      // Intentionally silent - not an error condition, just insufficient data
      return;
    }

    // Style yüklenene kadar bekle
    if (!this.map.isStyleLoaded()) {
      // Wait for style to load before drawing routes
      this.map.once('style.load', () => {
        this.drawRouteLines(places);
      });
      return;
    }

    // Helper function to extract timestamp from visitDate
    const getTimestamp = (visitDate: { seconds: number; nanoseconds: number } | Date): number => {
      if (visitDate instanceof Date) {
        return visitDate.getTime();
      }
      // Firebase Timestamp
      return visitDate.seconds * 1000;
    };

    // Tarihe göre sırala (eskiden yeniye)
    const sortedPlaces = [...places].sort((a, b) => {
      const dateA = getTimestamp(a.visitDate);
      const dateB = getTimestamp(b.visitDate);
      return dateA - dateB;
    });

    // GeoJSON LineString oluştur
    const coordinates: [number, number][] = sortedPlaces.map(place => [
      place.location.lng,
      place.location.lat
    ]);

    // Kavisli çizgi için ara noktalar ekle (geodesic interpolation)
    const smoothCoordinates = this.interpolateGeodesicLine(coordinates);

    const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: smoothCoordinates,
      },
    };

    // Eski route layer/source varsa kaldır
    if (this.map.getLayer(this.routeLayerId)) {
      this.map.removeLayer(this.routeLayerId);
    }
    if (this.map.getSource(this.routeSourceId)) {
      this.map.removeSource(this.routeSourceId);
    }

    // Source ekle
    this.map.addSource(this.routeSourceId, {
      type: 'geojson',
      data: geojson,
    });

    // Layer ekle (kesikli beyaz hat - Polarsteps style)
    this.map.addLayer({
      id: this.routeLayerId,
      type: 'line',
      source: this.routeSourceId,
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#ffffff',
        'line-width': 3,
        'line-opacity': 0.8,
        'line-dasharray': [2, 2], // Kesikli çizgi
      },
    });

    // Route successfully drawn with all places
  }

  /**
   * Geodesic line interpolation (kavisli çizgi için ara noktalar)
   * Basit linear interpolation - production'da Turf.js kullanılabilir
   */
  private interpolateGeodesicLine(coordinates: [number, number][]): [number, number][] {
    const result: [number, number][] = [];
    
    for (let i = 0; i < coordinates.length - 1; i++) {
      const start = coordinates[i];
      const end = coordinates[i + 1];
      
      result.push(start);
      
      // İki nokta arası mesafe hesapla (basit)
      const distance = Math.sqrt(
        Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2)
      );
      
      // Uzak noktalar arasına ara noktalar ekle
      if (distance > 5) {
        const steps = Math.ceil(distance / 5);
        for (let j = 1; j < steps; j++) {
          const ratio = j / steps;
          result.push([
            start[0] + (end[0] - start[0]) * ratio,
            start[1] + (end[1] - start[1]) * ratio,
          ]);
        }
      }
    }
    
    result.push(coordinates[coordinates.length - 1]);
    return result;
  }

  /**
   * Rota çizgilerini temizle
   */
  clearRouteLines(): void {
    if (!this.map) return;

    if (this.map.getLayer(this.routeLayerId)) {
      this.map.removeLayer(this.routeLayerId);
    }
    if (this.map.getSource(this.routeSourceId)) {
      this.map.removeSource(this.routeSourceId);
    }

    // Route lines cleared successfully
  }

  /**
   * Belirli bir Place'e odaklan (Polarsteps-style smooth transition)
   * ID ile place bulur ve animasyonlu geçiş yapar
   */
  focusOnPlace(
    placeId: string, 
    places: Array<{ id: string; location: { lat: number; lng: number } }>,
    options?: {
      zoom?: number;
      pitch?: number;
      bearing?: number;
      duration?: number;
    }
  ): void {
    if (!this.map) {
      throw new Error('Map not initialized');
    }

    // Stop rotation for cinematic transition
    this.stopRotation();

    // Style yüklenene kadar bekle
    if (!this.map.isStyleLoaded()) {
      console.warn('Map style not loaded yet, waiting for focusOnPlace...');
      this.map.once('style.load', () => {
        this.focusOnPlace(placeId, places, options);
      });
      return;
    }

    const place = places.find(p => p.id === placeId);
    if (!place) {
      console.warn(`Place with ID ${placeId} not found`);
      return;
    }

    // Cinematic descent parameters - like falling from space
    const zoom = options?.zoom ?? 15;
    const pitch = options?.pitch ?? 60; // Higher pitch for dramatic angle
    const bearing = options?.bearing ?? 0;
    const duration = options?.duration ?? 3500; // Slower for cinematic feel

    this.map.flyTo({
      center: [place.location.lng, place.location.lat],
      zoom,
      pitch,
      bearing,
      duration,
      essential: true,
      curve: 1.42, // Natural earth curvature descent
      easing: (t) => t * (2 - t), // Smooth easeInOut
    });

    // Successfully focused on place with cinematic transition
  }

  /**
   * Tüm route'u gösterecek şekilde kamera ayarla
   */
  focusOnRoute(places: Array<{ location: { lat: number; lng: number } }>): void {
    if (!this.map || places.length === 0) return;

    // Stop rotation for cinematic transition
    this.stopRotation();

    // Style yüklenene kadar bekle
    if (!this.map.isStyleLoaded()) {
      console.warn('Map style not loaded yet, waiting for focusOnRoute...');
      this.map.once('style.load', () => {
        this.focusOnRoute(places);
      });
      return;
    }

    if (places.length === 1) {
      this.flyTo(places[0].location.lat, places[0].location.lng, 12);
      return;
    }

    const bounds = new mapboxgl.LngLatBounds();
    places.forEach((place) => {
      bounds.extend([place.location.lng, place.location.lat]);
    });

    this.map.fitBounds(bounds, {
      padding: { top: 100, bottom: 100, left: 100, right: 100 },
      maxZoom: 12,
      duration: 1500,
    });
  }
}

// Singleton instance
let mapboxServiceInstance: MapboxService | null = null;

export const getMapboxService = (): MapboxService => {
  if (!mapboxServiceInstance) {
    mapboxServiceInstance = new MapboxService();
  }
  return mapboxServiceInstance;
};

export default MapboxService;
