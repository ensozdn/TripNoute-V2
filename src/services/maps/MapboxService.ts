import mapboxgl from 'mapbox-gl';
import type {
  IMapboxService,
  MapboxConfig,
  MapMarker,
  MapViewport,
} from '@/types/maps';
import { Journey } from '@/types/journeyData';
import { Trip, TransportMode } from '@/types/trip';

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
  private transportIconsLoaded: boolean = false;
  private readonly TRANSPORT_ICONS: Record<TransportMode, { path: string; color: string }> = {
    flight: {
      path: 'M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z',
      color: '#4ECDC4',
    },
    car: {
      path: 'M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z',
      color: '#FF6B6B',
    },
    bus: {
      path: 'M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z',
      color: '#FFA07A',
    },
    train: {
      path: 'M4 15.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h12v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V5c0-3.5-3.58-4-8-4s-8 .5-8 4v10.5zm8 1.5c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm-6-7h12v3H6V10zM6 5h12v3H6V5z',
      color: '#45B7D1',
    },
    ship: {
      path: 'M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v-2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l1.89-6.68c.08-.26.06-.54-.06-.78s-.34-.42-.6-.5L20 10.62V6c0-1.1-.9-2-2-2h-3V1H9v3H6c-1.1 0-2 .9-2 2v4.62l-1.29.42c-.26.08-.48.26-.6.5s-.15.52-.06.78L3.95 19zM6 6h12v3.97L12 8 6 9.97V6z',
      color: '#85C1E2',
    },
    walk: {
      path: 'M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7z',
      color: '#95E1D3',
    },
    walking: {
      path: 'M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7z',
      color: '#95E1D3',
    },
    bike: {
      path: 'M15.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM5 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5zm5.8-10l2.4-2.4.8.8c1.3 1.3 3 2.1 5.1 2.1V9c-1.5 0-2.7-.6-3.6-1.5l-1.9-1.9c-.5-.4-1-.6-1.6-.6s-1.1.2-1.4.6L7.8 8.4c-.4.4-.6.9-.6 1.4 0 .6.2 1.1.6 1.4L11 14v5h2v-6.2l-2.2-2.3zM19 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5z',
      color: '#A8E6CF',
    },
  };
  async initializeMap(config: MapboxConfig): Promise<mapboxgl.Map> {
    if (this.map) {
      return this.map;
    }

    mapboxgl.accessToken = config.accessToken;

    try {

      const isMobile = window.innerWidth < 768;

      const mobileZoom = 1.2;
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

      if (isMobile) {

        this.map.setPadding({ top: 0, bottom: 0, left: 0, right: 0 });
      }

      this.setupRotationInterrupts();

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Map load timeout after 30 seconds'));
        }, 30000);

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
  private async loadTransportIcons(): Promise<void> {
    if (!this.map || this.transportIconsLoaded) return;

    console.log(' Loading premium transport medallion icons...');

    const loadPromises = Object.entries(this.TRANSPORT_ICONS).map(([mode, config]) => {
      return new Promise<void>((resolve, reject) => {

        const svg = `
          <svg width="48" height="48" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="${config.path}" fill="${config.color}"/>
          </svg>
        `;

        const img = new Image(48, 48);

        img.onload = () => {
          try {
            if (!this.map?.hasImage(`medallion-${mode}`)) {
              this.map?.addImage(`medallion-${mode}`, img, { 
                sdf: false,
                pixelRatio: 2,
              });
              console.log(`   Loaded icon: medallion-${mode} (${config.color})`);
            } else {
              console.log(`  ️  Icon already exists: medallion-${mode}`);
            }
            resolve();
          } catch (error) {
            console.error(`   Failed to add image medallion-${mode}:`, error);
            reject(error);
          }
        };

        img.onerror = (error) => {
          console.error(`   Failed to load image data for ${mode}:`, error);
          reject(new Error(`Failed to load ${mode} icon`));
        };

        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      });
    });

    try {
      await Promise.all(loadPromises);
      this.transportIconsLoaded = true;
      console.log(' All transport icons loaded successfully!');
    } catch (error) {
      console.error('️ Some transport icons failed to load:', error);

      this.transportIconsLoaded = true;
    }
  }
  private calculateBearing(from: [number, number], to: [number, number]): number {
    const [lon1, lat1] = from;
    const [lon2, lat2] = to;

    const dLon = (lon2 - lon1) * Math.PI / 180;
    const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180);
    const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
              Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon);

    const bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
  }
  destroyMap(): void {
    this.stopRotation();
    if (this.map) {
      this.clearMarkers();
      this.map.remove();
      this.map = null;

    }
  }
  private setupRotationInterrupts(): void {
    if (!this.map) return;

    this.map.on('dragstart', () => this.stopRotation());
    this.map.on('zoomstart', () => this.stopRotation());
    this.map.on('pitchstart', () => this.stopRotation());
    this.map.on('rotatestart', () => this.stopRotation());
    this.map.on('touchstart', () => this.stopRotation());
  }
  startSlowRotation(): void {
    if (!this.map || this.isRotating) return;

    this.isRotating = true;
    this.lastFrameTime = performance.now();

    const rotate = (currentTime: number): void => {
      if (!this.map || !this.isRotating) return;

      const deltaTime = currentTime - this.lastFrameTime;
      const targetFrameTime = 1000 / 60;
      const speedMultiplier = deltaTime / targetFrameTime;

      const center = this.map.getCenter();
      const newLng = center.lng + (this.rotationSpeed * speedMultiplier);

      this.map.setCenter([newLng, center.lat]);

      this.lastFrameTime = currentTime;
      this.rotationAnimationId = requestAnimationFrame(rotate);
    };

    this.rotationAnimationId = requestAnimationFrame(rotate);
  }
  stopRotation(): void {
    this.isRotating = false;
    if (this.rotationAnimationId !== null) {
      cancelAnimationFrame(this.rotationAnimationId);
      this.rotationAnimationId = null;
    }
  }
  isGlobeRotating(): boolean {
    return this.isRotating;
  }
  getMap(): mapboxgl.Map | null {
    return this.map;
  }
  addMarker(marker: MapMarker): mapboxgl.Marker {
    if (!this.map) {
      throw new Error('Map not initialized');
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'marker-wrapper';
    wrapper.style.cursor = 'pointer';

    const inner = document.createElement('div');
    inner.className = 'marker-inner';
    inner.style.transition = 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

    if (marker.icon && (marker.icon.startsWith('http') || marker.icon.startsWith('/'))) {

      wrapper.style.width = '56px';
      wrapper.style.height = '56px';

      inner.style.width = '100%';
      inner.style.height = '100%';
      inner.style.backgroundImage = `url(${marker.icon})`;
      inner.style.backgroundSize = 'cover';
      inner.style.backgroundPosition = 'center';
      inner.style.borderRadius = '50%';
      inner.style.border = '4px solid white';
      inner.style.boxShadow = '0 6px 16px -4px rgba(0, 0, 0, 0.4), 0 4px 8px -2px rgba(0, 0, 0, 0.24)';
    } else {

      wrapper.style.width = '40px';
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

    wrapper.appendChild(inner);

    wrapper.onmouseenter = () => inner.style.transform = 'scale(1.2)';
    wrapper.onmouseleave = () => inner.style.transform = 'scale(1)';

    const offset: [number, number] = marker.icon?.startsWith('http') ? [0, 0] : [0, -20];

    const mapboxMarker = new mapboxgl.Marker({ element: wrapper, offset })
      .setLngLat([marker.position.lng, marker.position.lat]);

    if (marker.title) {
      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(`
        <div style="padding: 8px 4px;">
          <h3 style="margin: 0; font-weight: 600; font-size: 14px; font-family: ui-sans-serif, system-ui, sans-serif;">${marker.title}</h3>
          ${marker.description ? `<p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.7;">${marker.description}</p>` : ''}
        </div>
      `);
      mapboxMarker.setPopup(popup);

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

    wrapper.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.markerClickCallback) {
        this.markerClickCallback(marker.id);
      }
    });

    mapboxMarker.addTo(this.map);

    this.markers.set(marker.id, mapboxMarker);

    return mapboxMarker;
  }
  removeMarker(markerId: string): void {
    const marker = this.markers.get(markerId);
    if (marker) {
      marker.remove();
      this.markers.delete(markerId);
    }
  }
  updateMarker(updatedMarker: MapMarker): void {

    this.removeMarker(updatedMarker.id);

    this.addMarker(updatedMarker);
  }
  clearMarkers(): void {
    this.markers.forEach((marker) => marker.remove());
    this.markers.clear();
  }
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
  jumpTo(lat: number, lng: number, zoom: number = 14): void {
    if (!this.map) {
      throw new Error('Map not initialized');
    }

    this.map.jumpTo({
      center: [lng, lat],
      zoom,
    });
  }
  fitBounds(markers: MapMarker[]): void {
    if (!this.map || markers.length === 0) return;

    if (markers.length === 1) {

      this.flyTo(markers[0].position.lat, markers[0].position.lng, 12);
      return;
    }

    const bounds = new mapboxgl.LngLatBounds();
    markers.forEach((marker) => {
      bounds.extend([marker.position.lng, marker.position.lat]);
    });

    this.map.fitBounds(bounds, {
      padding: { top: 50, bottom: 50, left: 50, right: 50 },
      maxZoom: 15,
      duration: 1000,
    });
  }
  onClick(callback: (lat: number, lng: number) => void): void {
    this.clickCallback = callback;
  }
  onMarkerClick(callback: (markerId: string) => void): void {
    this.markerClickCallback = callback;
  }
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
  enableUserLocation(): void {
    if (!this.map) {
      throw new Error('Map not initialized');
    }

    if (!('geolocation' in navigator)) {
      console.warn('Geolocation not supported in this browser');
      return;
    }

    const geolocateControl = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
        timeout: 10000,
      },
      trackUserLocation: false,
      showUserHeading: true,
      showUserLocation: true,
    });

    this.map.addControl(geolocateControl, 'top-right');

    geolocateControl.on('error', () => {

    });

    geolocateControl.on('geolocate', () => {

    });

  }
  async getUserLocation(): Promise<{ lat: number; lng: number } | null> {
    return new Promise((resolve) => {

      if (!('geolocation' in navigator)) {
        console.error(' Geolocation not supported in this browser');
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          resolve({ lat, lng });
        },
        (error) => {
          console.warn('️ Geolocation error:', error.message);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }
  async flyToUserLocation(zoom: number = 12): Promise<{ lat: number; lng: number } | null> {

    if (this.map) {
      this.map.stop();
      this.stopRotation();
    }

    const location = await this.getUserLocation();

    if (!location) return null;

    const { lat, lng } = location;

    if (!this.map) {
      console.warn('️ Map not initialized, returning location only');
      return { lat, lng };
    }

    this.showUserLocationMarker(lat, lng);

    this.map.flyTo({
      center: [lng, lat],
      zoom,
      duration: 2000,
      essential: true,
      pitch: 0,
      bearing: 0,
    });

    return { lat, lng };
  }
  showUserLocationMarker(lat: number, lng: number): void {
    if (!this.map) {
      throw new Error('Map not initialized');
    }

    if (this.userLocationMarker) {
      this.userLocationMarker.remove();
    }

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

    this.userLocationMarker = new mapboxgl.Marker(el)
      .setLngLat([lng, lat])
      .addTo(this.map);

    console.log(' User location marker added to map');
  }
  removeUserLocationMarker(): void {
    if (this.userLocationMarker) {
      this.userLocationMarker.remove();
      this.userLocationMarker = null;
    }
  }
  setStyle(styleUrl: string): void {
    if (!this.map) {
      throw new Error('Map not initialized');
    }
    this.map.setStyle(styleUrl);
  }
  setPitch(pitch: number): void {
    if (!this.map) {
      throw new Error('Map not initialized');
    }
    this.map.setPitch(pitch);
  }
  setBearing(bearing: number): void {
    if (!this.map) {
      throw new Error('Map not initialized');
    }
    this.map.setBearing(bearing);
  }
  clearRouteLines(): void {

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

    this.stopRotation();

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

    const zoom = options?.zoom ?? 15;
    const pitch = options?.pitch ?? 60;
    const bearing = options?.bearing ?? 0;
    const duration = options?.duration ?? 3500;

    this.map.flyTo({
      center: [place.location.lng, place.location.lat],
      zoom,
      pitch,
      bearing,
      duration,
      essential: true,
      curve: 1.42,
      easing: (t) => t * (2 - t),
    });

  }
  focusOnRoute(places: Array<{ location: { lat: number; lng: number } }>): void {
    if (!this.map || places.length === 0) return;

    this.stopRotation();

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

  async renderJourney(journey: Journey | Trip): Promise<void> {
    if (!this.map) return;

    this.clearJourney(journey.id);
    this.drawJourneyRoute(journey);
    this.addJourneyStopMarkers(journey);
    await this.addTransportMedallions(journey);
  }

  private drawJourneyRoute(journey: Journey | Trip): void {
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

  private addJourneyStopMarkers(journey: Journey | Trip): void {
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
  private async addTransportMedallions(journey: Journey | Trip): Promise<void> {
    if (!this.map) return;

    await this.loadTransportIcons();

    const features: GeoJSON.Feature<GeoJSON.Point>[] = [];

    console.log(` Creating premium medallions for journey: ${journey.id}, steps: ${journey.steps.length}`);

    for (let i = 0; i < journey.steps.length - 1; i++) {
      const current = journey.steps[i];
      const next = journey.steps[i + 1];

      if (!current.transportToNext) continue;

      const midpoint = current.transportToNext === 'flight'
        ? this.calculateArcMidpoint(current.coordinates, next.coordinates)
        : this.calculateMidpoint(current.coordinates, next.coordinates);

      const bearing = this.calculateBearing(current.coordinates, next.coordinates);

      console.log(`   Segment ${i}: ${current.transportToNext} from ${current.name} → ${next.name}, bearing: ${bearing.toFixed(1)}°`);

      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: midpoint,
        },
        properties: {
          transport: current.transportToNext,
          bearing,
          segmentId: `${journey.id}-seg-${i}`,
          color: journey.color,
        },
      });
    }

    if (features.length === 0) {
      console.log('️ No transport segments found, skipping medallions');
      return;
    }

    console.log(` Creating ${features.length} premium medallion icons`);

    const sourceId = `medallions-${journey.id}`;
    const layerBgId = `medallions-bg-${journey.id}`;
    const layerIconId = `medallions-icon-${journey.id}`;

    if (this.map.getSource(sourceId)) {
      if (this.map.getLayer(layerIconId)) this.map.removeLayer(layerIconId);
      if (this.map.getLayer(layerBgId)) this.map.removeLayer(layerBgId);
      this.map.removeSource(sourceId);
    }

    this.map.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features,
      },
    });

    this.map.addLayer({
      id: layerBgId,
      type: 'circle',
      source: sourceId,
      paint: {
        'circle-radius': 18,
        'circle-color': '#ffffff',
        'circle-opacity': 0.98,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#e5e7eb',
        'circle-stroke-opacity': 0.8,
      },
    });

    this.map.addLayer({
      id: layerIconId,
      type: 'symbol',
      source: sourceId,
      layout: {
        'icon-image': ['concat', 'medallion-', ['get', 'transport']],
        'icon-size': 0.6,
        'icon-rotate': ['get', 'bearing'],
        'icon-rotation-alignment': 'map',
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
        'icon-anchor': 'center',
      },
      paint: {
        'icon-opacity': 1.0,
      },
    });

    const layers = this.journeyLayers.get(journey.id) || [];
    layers.push(layerBgId, layerIconId);
    this.journeyLayers.set(journey.id, layers);
    this.journeySources.add(sourceId);

    console.log(` Premium medallion layers created: ${layerBgId}, ${layerIconId}`);
  }
  private calculateArcMidpoint(from: [number, number], to: [number, number]): [number, number] {

    const lon1 = from[0] * Math.PI / 180;
    const lat1 = from[1] * Math.PI / 180;
    const lon2 = to[0] * Math.PI / 180;
    const lat2 = to[1] * Math.PI / 180;

    const dLon = lon2 - lon1;

    const bX = Math.cos(lat2) * Math.cos(dLon);
    const bY = Math.cos(lat2) * Math.sin(dLon);

    const lat3 = Math.atan2(
      Math.sin(lat1) + Math.sin(lat2),
      Math.sqrt((Math.cos(lat1) + bX) * (Math.cos(lat1) + bX) + bY * bY)
    );

    const lon3 = lon1 + Math.atan2(bY, Math.cos(lat1) + bX);

    return [
      lon3 * 180 / Math.PI,
      lat3 * 180 / Math.PI
    ];
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

    const medallionSourceId = `medallions-${journeyId}`;
    if (this.map.getSource(medallionSourceId)) {
      this.map.removeSource(medallionSourceId);
      this.journeySources.delete(medallionSourceId);
    }

    const markers = this.medallionMarkers.get(journeyId);
    if (markers) {
      markers.forEach(marker => marker.remove());
      this.medallionMarkers.delete(journeyId);
    }
  }

  async renderAllJourneys(journeys: (Journey | Trip)[]): Promise<void> {
    if (!this.map) return;

    for (const journey of journeys) {
      await this.renderJourney(journey);
    }
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
