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

  /**
   * Haritayı başlat
   */
  async initializeMap(config: MapboxConfig): Promise<mapboxgl.Map> {
    if (this.map) {
      return this.map;
    }

    mapboxgl.accessToken = config.accessToken;

    try {
      this.map = new mapboxgl.Map({
        container: config.container,
        style: config.style || 'mapbox://styles/mapbox/streets-v12',
        center: config.center || [0, 0],
        zoom: config.zoom || 2,
        pitch: config.pitch || 0,
        bearing: config.bearing || 0,
      });

      this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      this.map.addControl(new mapboxgl.FullscreenControl(), 'top-right');

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
    if (this.map) {
      this.clearMarkers();
      this.map.remove();
      this.map = null;
      console.log('Mapbox map destroyed');
    }
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
   */
  enableUserLocation(): void {
    if (!this.map) {
      throw new Error('Map not initialized');
    }

    const geolocateControl = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
      },
      trackUserLocation: true,
      showUserHeading: true,
      showUserLocation: true,
    });

    this.map.addControl(geolocateControl, 'top-right');

    this.map.on('load', () => {
      geolocateControl.trigger();
    });
  }

  /**
   * Kullanıcının konumuna git
   */
  async flyToUserLocation(zoom: number = 14): Promise<{ lat: number; lng: number } | null> {
    return new Promise((resolve) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            if (this.map) {
              this.flyTo(lat, lng, zoom);
            }

            resolve({ lat, lng });
          },
          (error) => {
            console.warn('Geolocation error:', error);
            resolve(null);
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
          }
        );
      } else {
        console.warn('Geolocation not supported');
        resolve(null);
      }
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
  drawRouteLines(places: Array<{ id: string; location: { lat: number; lng: number }; visitDate: any }>): void {
    if (!this.map || places.length < 2) {
      console.warn('Cannot draw routes: Map not initialized or insufficient places');
      return;
    }

    // Tarihe göre sırala (eskiden yeniye)
    const sortedPlaces = [...places].sort((a, b) => {
      const dateA = a.visitDate?.seconds ? a.visitDate.seconds * 1000 : new Date(a.visitDate).getTime();
      const dateB = b.visitDate?.seconds ? b.visitDate.seconds * 1000 : new Date(b.visitDate).getTime();
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

    console.log(`✅ Route drawn with ${sortedPlaces.length} places`);
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

    console.log('✅ Route lines cleared');
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

    const place = places.find(p => p.id === placeId);
    if (!place) {
      console.warn(`Place with ID ${placeId} not found`);
      return;
    }

    // Varsayılan değerler - Polarsteps tarzı sinematik görünüm
    const zoom = options?.zoom ?? 15;
    const pitch = options?.pitch ?? 45; // 3D açı
    const bearing = options?.bearing ?? 0;
    const duration = options?.duration ?? 2000;

    this.map.flyTo({
      center: [place.location.lng, place.location.lat],
      zoom,
      pitch,
      bearing,
      duration,
      essential: true,
      easing: (t) => t * (2 - t), // Smooth easing function
    });

    console.log(`✅ Focused on place: ${placeId}`);
  }

  /**
   * Tüm route'u gösterecek şekilde kamera ayarla
   */
  focusOnRoute(places: Array<{ location: { lat: number; lng: number } }>): void {
    if (!this.map || places.length === 0) return;

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
