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
import { Journey, TransportMode } from '@/types/journeyData';

class MapboxService implements IMapboxService {
  private map: mapboxgl.Map | null = null;
  private markers: Map<string, mapboxgl.Marker> = new Map();
  private clickCallback: ((lat: number, lng: number) => void) | null = null;
  private markerClickCallback: ((markerId: string) => void) | null = null;
  private routeSourceId: string = 'route-source';

  private rotationAnimationId: number | null = null;
  private isRotating: boolean = false;
  private lastFrameTime: number = 0;
  private rotationSpeed: number = 0.05;

  private userLocationMarker: mapboxgl.Marker | null = null;
  private transportMarkers: mapboxgl.Marker[] = [];
  private journeyLayers: Map<string, string[]> = new Map();
  private journeySources: Set<string> = new Set();
  private medallionMarkers: Map<string, mapboxgl.Marker[]> = new Map();

  /**
   * Helper to get RAW SVG string for inline injection
   */
  private getRawTransportIcon(type: string): string {
    const icons: Record<string, string> = {
      flight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h20"/><path d="M13 5v7"/><path d="M6 8l4-3"/><path d="M4 21a2 2 0 0 1-2-2"/></svg>`,
      car: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M5 17h2"/><path d="M15 17h2"/></svg>`,
      bus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4-.2-.8-.6-.8h-2.4c-.4 0-.8.4-.9.8L18 18z"/><path d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7c0-1.1.9-2 2-2z"/><path d="M8 21v-2"/><path d="M16 21v-2"/></svg>`,
      train: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="16" rx="2" /><path d="M4 11h16" /><path d="M12 3v8" /><path d="m8 19-2 3" /><path d="m18 22-2-3" /><circle cx="8" cy="15" r="1" /><circle cx="16" cy="15" r="1" /></svg>`,
      ship: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.9 5.8 2.38 6"/><path d="M12 4v6"/><path d="M17 14l-4-5 1-6"/><path d="M6 14l4-5-1-6"/></svg>`,
      walking: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16v-2.38C4 11.5 5.9 10.1 7.43 10a2 2 0 0 1 1.62.9l.61.9a2 2 0 0 0 2.9.7l3.78-1.9a2 2 0 1 1 1.12 3.84l-2.07 1a2 2 0 0 0-.91 1.07L13 21"/><path d="M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/><path d="M12 5.5l.3-.6a2 2 0 0 1 2.4-1.1l3 .9a2 2 0 0 1 1.4 1.9V10"/><path d="M8 21v-3.5"/></svg>`,
    };

    const iconSvg = icons[type.toLowerCase()] || icons['flight'];
    // Replace currentColor with white inside the SVG string
    return iconSvg.replace(/stroke="currentColor"/g, 'stroke="white"');
  }

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
        center: config.center || [0, 20],
        zoom: isMobile ? mobileZoom : desktopZoom,
        pitch: config.pitch || 0,
        bearing: config.bearing || 0,
        projection: 'globe' as any,
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

    // Özel marker wrapper oluştur (Mapbox pozisyonlama için bunu kullanır)
    const wrapper = document.createElement('div');
    wrapper.className = 'marker-wrapper';
    wrapper.style.cursor = 'pointer';

    // İç element (Görsel ve animasyon için)
    const inner = document.createElement('div');
    inner.className = 'marker-inner';
    inner.style.transition = 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'; // Bouncy hover

    // Icon varsa (Photo URL) kullan
    if (marker.icon && (marker.icon.startsWith('http') || marker.icon.startsWith('/'))) {
      // POLARSTEPS-STYLE: Bigger photo bubbles
      wrapper.style.width = '56px'; // Increased from 48px
      wrapper.style.height = '56px';

      // Premium Photo Bubble Style
      inner.style.width = '100%';
      inner.style.height = '100%';
      inner.style.backgroundImage = `url(${marker.icon})`;
      inner.style.backgroundSize = 'cover';
      inner.style.backgroundPosition = 'center';
      inner.style.borderRadius = '50%';
      inner.style.border = '4px solid white'; // Thicker border
      inner.style.boxShadow = '0 6px 16px -4px rgba(0, 0, 0, 0.4), 0 4px 8px -2px rgba(0, 0, 0, 0.24)'; // Deeper shadow
    } else {
      // Default Pin Style (if no photo)
      wrapper.style.width = '40px'; // Slightly bigger
      wrapper.style.height = '40px';

      inner.style.width = '100%';
      inner.style.height = '100%';
      inner.innerHTML = `
        <div style="
          background-color: ${marker.color || '#3b82f6'};
          width: 100%;
          height: 100%;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 12px rgba(0,0,0,0.3);
          border: 3px solid white;
        ">
          <div style="
            width: 10px;
            height: 10px;
            background: white;
            border-radius: 50%;
            transform: rotate(45deg);
          "></div>
        </div>
      `;
    }

    // Append inner to wrapper
    wrapper.appendChild(inner);

    // POLARSTEPS-STYLE HOVER: More dramatic scale
    wrapper.onmouseenter = () => inner.style.transform = 'scale(1.2)';
    wrapper.onmouseleave = () => inner.style.transform = 'scale(1)';

    // Mapbox marker oluştur - Offset calculations
    const offset: [number, number] = marker.icon?.startsWith('http') ? [0, 0] : [0, -20]; // Adjusted for bigger pins

    const mapboxMarker = new mapboxgl.Marker({ element: wrapper, offset })
      .setLngLat([marker.position.lng, marker.position.lat]);

    // Popup varsa ekle
    if (marker.title) {
      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(`
        <div style="padding: 8px 4px;">
          <h3 style="margin: 0; font-weight: 600; font-size: 14px; font-family: ui-sans-serif, system-ui, sans-serif;">${marker.title}</h3>
          ${marker.description ? `<p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.7;">${marker.description}</p>` : ''}
        </div>
      `);
      mapboxMarker.setPopup(popup);

      // Show popup on hover
      wrapper.addEventListener('mouseenter', () => {
        const popupInstance = mapboxMarker.getPopup();
        if (popupInstance && this.map) {
          popupInstance.addTo(this.map);
        }
      });
      wrapper.addEventListener('mouseleave', () => {
        const popupInstance = mapboxMarker.getPopup();
        if (popupInstance) {
          popupInstance.remove();
        }
      });
    }

    // Click event
    wrapper.addEventListener('click', (e) => {
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

          // Show user location marker on the map
          this.showUserLocationMarker(lat, lng);

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
   * Kullanıcı konumunu haritada göster (mavi pulsing marker)
   * Premium blue pulsing dot for user location
   */
  showUserLocationMarker(lat: number, lng: number): void {
    if (!this.map) {
      throw new Error('Map not initialized');
    }

    // Remove existing user location marker if any
    if (this.userLocationMarker) {
      this.userLocationMarker.remove();
    }

    // Create premium pulsing blue dot element
    const el = document.createElement('div');
    el.className = 'user-location-marker';
    el.style.width = '20px';
    el.style.height = '20px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = '#3b82f6';
    el.style.border = '3px solid #ffffff';
    el.style.boxShadow = '0 0 0 0 rgba(59, 130, 246, 1)';
    el.style.animation = 'pulse-blue 2s infinite';
    el.style.cursor = 'pointer';

    // Add pulsing animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse-blue {
        0% {
          box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
        }
        50% {
          box-shadow: 0 0 0 15px rgba(59, 130, 246, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
        }
      }
    `;
    if (!document.getElementById('user-location-marker-style')) {
      style.id = 'user-location-marker-style';
      document.head.appendChild(style);
    }

    // Create marker
    this.userLocationMarker = new mapboxgl.Marker(el)
      .setLngLat([lng, lat])
      .addTo(this.map);

    console.log('✅ User location marker added to map');
  }

  /**
   * Kullanıcı konum marker'ını kaldır
   */
  removeUserLocationMarker(): void {
    if (this.userLocationMarker) {
      this.userLocationMarker.remove();
      this.userLocationMarker = null;
    }
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
  /**
   * Polarsteps-style: Multi-mode route drawing
   * Connects places with transport-specific line styles
   */
  drawRouteLines(places: Array<{
    id: string;
    location: { lat: number; lng: number };
    visitDate: { seconds: number; nanoseconds: number } | Date;
    transportType?: 'walking' | 'bus' | 'car' | 'flight' | 'ship' | 'train';
  }>): void {
    console.log('DrawRouteLines called with', places.length, 'places');
    
    if (!this.map || places.length < 2) {
      console.warn('Not enough places for routes:', { 
        hasMap: !!this.map, 
        placeCount: places.length 
      });
      return;
    }

    // FIXED: Force draw with timeout to prevent infinite wait
    const attemptDraw = () => {
      if (!this.map) return;
      
      console.log('Map ready, drawing routes...');

      // Clear existing transport markers
      this.transportMarkers.forEach(m => m.remove());
      this.transportMarkers = [];

      const getTimestamp = (visitDate: { seconds: number; nanoseconds: number } | Date): number => {
        if (visitDate instanceof Date) return visitDate.getTime();
        return visitDate.seconds * 1000;
      };

      const sortedPlaces = [...places].sort((a, b) => {
        const dateA = getTimestamp(a.visitDate);
        const dateB = getTimestamp(b.visitDate);
        return dateA - dateB;
      });

      console.log('Sorted places by date:', sortedPlaces.map(p => ({
        id: p.id.substring(0, 8),
        date: getTimestamp(p.visitDate),
        transport: p.transportType || 'NONE',
        lat: p.location.lat.toFixed(2),
        lng: p.location.lng.toFixed(2)
      })));

      const routeFeatures: GeoJSON.Feature[] = [];

      // Create segments between consecutive places
      for (let i = 0; i < sortedPlaces.length - 1; i++) {
        const start = sortedPlaces[i];
        const end = sortedPlaces[i + 1];

        // Use the transport type of the END destination (how we got there)
        // DEFAULT to 'flight' if missing for backward compatibility
        const type = end.transportType || 'flight';
        
        console.log(`Creating segment ${i + 1}/${sortedPlaces.length - 1}: ${type}`);

        const coordinates: [number, number][] = [
          [start.location.lng, start.location.lat],
          [end.location.lng, end.location.lat]
        ];

        // Apply interpolation only for flights/ships (curved lines)
        const geometryCoords = (type === 'flight' || type === 'ship')
          ? this.interpolateGeodesicLine(coordinates)
          : coordinates;

        routeFeatures.push({
          type: 'Feature',
          properties: {
            transportType: type,
            segmentIndex: i
          },
          geometry: {
            type: 'LineString',
            coordinates: geometryCoords
          }
        });

        // ---------------------------------------------------------
        // POLARSTEPS-STYLE TRANSPORT ICON AT MIDPOINT
        // Premium small circular badge with crisp icon
        // ---------------------------------------------------------
        let midLat, midLng;

        // Calculate naive midpoint
        if (geometryCoords.length > 2) {
          const midIndex = Math.floor(geometryCoords.length / 2);
          midLng = geometryCoords[midIndex][0];
          midLat = geometryCoords[midIndex][1];
        } else {
          midLng = (start.location.lng + end.location.lng) / 2;
          midLat = (start.location.lat + end.location.lat) / 2;
        }

        // POLARSTEPS-STYLE: Compact premium badge
        const iconWrapper = document.createElement('div');
        iconWrapper.className = 'transport-icon-wrapper';
        iconWrapper.style.width = '32px';
        iconWrapper.style.height = '32px';
        iconWrapper.style.backgroundColor = '#1e293b';
        iconWrapper.style.border = '3px solid white';
        iconWrapper.style.borderRadius = '50%';
        iconWrapper.style.display = 'flex';
        iconWrapper.style.alignItems = 'center';
        iconWrapper.style.justifyContent = 'center';
        iconWrapper.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2)';
        iconWrapper.style.zIndex = '10';
        iconWrapper.style.cursor = 'default';

        // Get raw SVG (without data URI wrapper)
        const rawSvg = this.getRawTransportIcon(type);

        // Inject inline SVG
        iconWrapper.innerHTML = rawSvg;

        // Style the injected SVG directly
        const svgEl = iconWrapper.querySelector('svg');
        if (svgEl) {
          svgEl.style.width = '18px';
          svgEl.style.height = '18px';
          svgEl.style.color = 'white';
        }

        const marker = new mapboxgl.Marker({ element: iconWrapper })
          .setLngLat([midLng, midLat])
          .addTo(this.map!);

        this.transportMarkers.push(marker);
        
        console.log(`Segment ${i}: ${type} from [${start.location.lat.toFixed(2)}, ${start.location.lng.toFixed(2)}] to [${end.location.lat.toFixed(2)}, ${end.location.lng.toFixed(2)}]`);
      }

      console.log(`Created ${routeFeatures.length} route segments with ${this.transportMarkers.length} icons`);

      const geojson: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: routeFeatures
      };

      // Remove existing layers/sources
      const layers = ['route-shadow', 'route-flight', 'route-road', 'route-path'];
      layers.forEach(layer => {
        if (this.map!.getLayer(layer)) this.map!.removeLayer(layer);
      });
      if (this.map!.getSource(this.routeSourceId)) {
        this.map!.removeSource(this.routeSourceId);
      }

      // Add unified Source
      this.map!.addSource(this.routeSourceId, {
        type: 'geojson',
        data: geojson,
        lineMetrics: true,
      });

      // POLARSTEPS-STYLE PREMIUM ROUTE LAYERS
      // Layer Order: Shadow → Main Line (bottom to top)

      // 1. SHADOW LAYER (All routes) - Gives depth like Polarsteps
      this.map!.addLayer({
        id: 'route-shadow',
        type: 'line',
        source: this.routeSourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#000000',
          'line-width': 7,
          'line-opacity': 0.25,
          'line-blur': 4,
        },
      });

      // 2. FLIGHT LAYER (Curved, Dashed, Thick White)
      this.map!.addLayer({
        id: 'route-flight',
        type: 'line',
        source: this.routeSourceId,
        filter: ['in', 'transportType', 'flight', 'ship'],
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#ffffff',
          'line-width': 5,
          'line-opacity': 0.95,
          'line-dasharray': [3, 2],
        },
      });

      // 3. ROAD LAYER (Car/Bus/Train - Solid, Thick White)
      this.map!.addLayer({
        id: 'route-road',
        type: 'line',
        source: this.routeSourceId,
        filter: ['in', 'transportType', 'car', 'bus', 'train'],
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#ffffff',
          'line-width': 5,
          'line-opacity': 0.95,
        },
      });

      // 4. WALKING LAYER (Dotted, Premium Green)
      this.map!.addLayer({
        id: 'route-path',
        type: 'line',
        source: this.routeSourceId,
        filter: ['==', 'transportType', 'walking'],
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#10b981',
          'line-width': 4,
          'line-dasharray': [0.5, 2.5],
          'line-opacity': 0.9,
        },
      });

      console.log('Route layers added successfully!');
    };

    // Try to draw immediately, or wait max 2 seconds
    if (this.map.isStyleLoaded()) {
      attemptDraw();
    } else {
      console.log('Waiting for map style to load...');
      
      // Set timeout fallback to prevent infinite wait
      const timeout = setTimeout(() => {
        console.warn('Style load timeout, forcing draw anyway');
        attemptDraw();
      }, 2000);
      
      this.map.once('style.load', () => {
        clearTimeout(timeout);
        attemptDraw();
      });
    }
  }

  /**
   * POLARSTEPS-STYLE GEODESIC CURVE
   * Creates beautiful curved lines for long-distance routes (flights/ships)
   * Uses Great Circle path approximation with bezier-like smoothing
   */
  private interpolateGeodesicLine(coordinates: [number, number][]): [number, number][] {
    const result: [number, number][] = [];

    for (let i = 0; i < coordinates.length - 1; i++) {
      const start = coordinates[i];
      const end = coordinates[i + 1];

      result.push(start);

      // Calculate distance (in degrees for rough estimate)
      const dx = end[0] - start[0];
      const dy = end[1] - start[1];
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Only interpolate for long distances (> 3 degrees ~ 330km)
      if (distance > 3) {
        // Calculate midpoint elevation for great circle effect
        const midLng = (start[0] + end[0]) / 2;
        const midLat = (start[1] + end[1]) / 2;
        
        // Add curvature based on distance (the farther, the more curve)
        const curvatureOffset = distance * 0.08; // 8% elevation
        const curvedMidLat = midLat + curvatureOffset;

        // Create smooth bezier-like curve with multiple steps
        const steps = Math.max(Math.ceil(distance * 3), 20); // More steps = smoother

        for (let j = 1; j < steps; j++) {
          const t = j / steps;
          
          // Quadratic Bezier formula: B(t) = (1-t)²P₀ + 2(1-t)tP₁ + t²P₂
          const oneMinusT = 1 - t;
          const lng = oneMinusT * oneMinusT * start[0] + 
                      2 * oneMinusT * t * midLng + 
                      t * t * end[0];
          
          const lat = oneMinusT * oneMinusT * start[1] + 
                      2 * oneMinusT * t * curvedMidLat + 
                      t * t * end[1];

          result.push([lng, lat]);
        }
      } else {
        // Short distances: simple linear interpolation
        const steps = Math.max(Math.ceil(distance * 5), 3);
        for (let j = 1; j < steps; j++) {
          const ratio = j / steps;
          result.push([
            start[0] + dx * ratio,
            start[1] + dy * ratio,
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
    // Clear icons
    this.transportMarkers.forEach(m => m.remove());
    this.transportMarkers = [];

    if (!this.map) return;

    const layers = ['route-shadow', 'route-flight', 'route-road', 'route-path'];
    layers.forEach(layer => {
      if (this.map!.getLayer(layer)) {
        this.map!.removeLayer(layer);
      }
    });

    if (this.map.getSource(this.routeSourceId)) {
      this.map.removeSource(this.routeSourceId);
    }
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

  renderJourney(journey: Journey): void {
    if (!this.map) return;

    this.clearJourney(journey.id);
    this.drawJourneyRoute(journey);
    this.addJourneyStopMarkers(journey);
    this.addTransportMedallions(journey);
  }

  private drawJourneyRoute(journey: Journey): void {
    if (!this.map || journey.steps.length < 2) return;

    const segments: any[] = [];

    for (let i = 0; i < journey.steps.length - 1; i++) {
      const current = journey.steps[i];
      const next = journey.steps[i + 1];

      segments.push({
        type: 'Feature',
        properties: {
          transportMode: current.transportToNext,
          color: journey.color,
        },
        geometry: {
          type: 'LineString',
          coordinates: [current.coordinates, next.coordinates],
        },
      });
    }

    const sourceId = `journey-source-${journey.id}`;
    this.journeySources.add(sourceId);

    if (this.map.getSource(sourceId)) {
      (this.map.getSource(sourceId) as mapboxgl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: segments,
      });
    } else {
      this.map.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: segments,
        },
      });
    }

    const layerIds: string[] = [];

    segments.forEach((segment, index) => {
      const layerId = `journey-layer-${journey.id}-${index}`;
      layerIds.push(layerId);

      if (this.map!.getLayer(layerId)) {
        return;
      }

      const style = this.getRouteStyle(segment.properties.transportMode);

      this.map!.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        filter: ['==', ['get', 'transportMode'], segment.properties.transportMode],
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: style,
      });
    });

    this.journeyLayers.set(journey.id, layerIds);
  }

  private getRouteStyle(transport: TransportMode | null): any {
    const styles: Record<string, any> = {
      flight: {
        'line-color': '#4ECDC4',
        'line-width': 2,
        'line-dasharray': [2, 2],
        'line-blur': 2,
        'line-opacity': 0.9,
      },
      car: {
        'line-color': '#FF6B6B',
        'line-width': 4,
        'line-opacity': 0.9,
      },
      bus: {
        'line-color': '#FFA07A',
        'line-width': 4,
        'line-opacity': 0.9,
      },
      train: {
        'line-color': '#45B7D1',
        'line-width': 3,
        'line-dasharray': [4, 2],
        'line-opacity': 0.9,
      },
      ship: {
        'line-color': '#85C1E2',
        'line-width': 3,
        'line-dasharray': [6, 3],
        'line-opacity': 0.9,
      },
      walk: {
        'line-color': '#95E1D3',
        'line-width': 1.5,
        'line-dasharray': [1, 3],
        'line-opacity': 0.8,
      },
    };

    return styles[transport || 'car'] || styles.car;
  }

  private addJourneyStopMarkers(journey: Journey): void {
    if (!this.map) return;

    journey.steps.forEach((step, index) => {
      const isFirst = index === 0;
      const isLast = index === journey.steps.length - 1;

      const el = document.createElement('div');
      el.className = 'journey-stop-marker';
      el.style.width = '24px';
      el.style.height = '24px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = journey.color;
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      el.style.cursor = 'pointer';

      if (isFirst || isLast) {
        el.style.width = '32px';
        el.style.height = '32px';
        el.style.border = '4px solid white';
      }

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat(step.coordinates)
        .addTo(this.map!);

      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
        .setHTML(`
          <div style="padding: 8px;">
            <h3 style="margin: 0; font-size: 14px; font-weight: 600;">${step.name}</h3>
            ${step.address?.city ? `<p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.7;">${step.address.city}</p>` : ''}
          </div>
        `);

      marker.setPopup(popup);

      if (!this.medallionMarkers.has(journey.id)) {
        this.medallionMarkers.set(journey.id, []);
      }
      this.medallionMarkers.get(journey.id)!.push(marker);
    });
  }

  private addTransportMedallions(journey: Journey): void {
    if (!this.map) return;

    for (let i = 0; i < journey.steps.length - 1; i++) {
      const current = journey.steps[i];
      const next = journey.steps[i + 1];

      if (!current.transportToNext) continue;

      const midpoint = this.calculateMidpoint(current.coordinates, next.coordinates);

      const el = document.createElement('div');
      el.style.width = '32px';
      el.style.height = '32px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = 'white';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      el.style.backdropFilter = 'blur(8px)';

      const iconSvg = this.getRawTransportIcon(current.transportToNext);
      el.innerHTML = iconSvg;

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat(midpoint)
        .addTo(this.map!);

      if (!this.medallionMarkers.has(journey.id)) {
        this.medallionMarkers.set(journey.id, []);
      }
      this.medallionMarkers.get(journey.id)!.push(marker);
    }
  }

  private calculateMidpoint(from: [number, number], to: [number, number]): [number, number] {
    return [
      (from[0] + to[0]) / 2,
      (from[1] + to[1]) / 2,
    ];
  }

  clearJourney(journeyId: string): void {
    if (!this.map) return;

    const layerIds = this.journeyLayers.get(journeyId);
    if (layerIds) {
      layerIds.forEach(layerId => {
        if (this.map!.getLayer(layerId)) {
          this.map!.removeLayer(layerId);
        }
      });
      this.journeyLayers.delete(journeyId);
    }

    const sourceId = `journey-source-${journeyId}`;
    if (this.map.getSource(sourceId)) {
      this.map.removeSource(sourceId);
      this.journeySources.delete(sourceId);
    }

    const markers = this.medallionMarkers.get(journeyId);
    if (markers) {
      markers.forEach(marker => marker.remove());
      this.medallionMarkers.delete(journeyId);
    }
  }

  renderAllJourneys(journeys: Journey[]): void {
    if (!this.map) return;

    journeys.forEach(journey => {
      this.renderJourney(journey);
    });
  }

  clearAllJourneys(): void {
    if (!this.map) return;

    this.journeyLayers.forEach((_, journeyId) => {
      this.clearJourney(journeyId);
    });
  }
}

let mapboxServiceInstance: MapboxService | null = null;

export const getMapboxService = (): MapboxService => {
  if (!mapboxServiceInstance) {
    mapboxServiceInstance = new MapboxService();
  }
  return mapboxServiceInstance;
};

export default MapboxService;
