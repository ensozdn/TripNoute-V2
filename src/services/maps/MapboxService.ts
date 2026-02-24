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
  private readonly TRANSPORT_EMOJIS: Record<string, string> = {
    flight:  '✈️',
    car:     '🚗',
    train:   '🚂',
    bus:     '🚌',
    ship:    '🚢',
    bike:    '🚲',
    walk:    '🚶',
    walking: '🚶',
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
  private loadTransportIcons(): void {
    if (!this.map || this.transportIconsLoaded) return;

    const size = 64;

    Object.entries(this.TRANSPORT_EMOJIS).forEach(([mode, emoji]) => {
      const imageName = `medallion-${mode}`;
      if (this.map?.hasImage(imageName)) return;

      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // White circle background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
      ctx.fill();

      // Subtle shadow ring
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Emoji
      ctx.font = `${Math.floor(size * 0.48)}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji, size / 2, size / 2 + 1);

      try {
        this.map?.addImage(imageName, canvas as unknown as HTMLImageElement);
      } catch (e) {
        // Image might already exist — safe to ignore
      }
    });

    this.transportIconsLoaded = true;
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
      // CRITICAL FIX: Calculate proper popup offset based on marker type
      const isPhotoMarker = marker.icon?.startsWith('http');
      const popupOffset = isPhotoMarker 
        ? { 'bottom': [0, -10] as [number, number] }  // Photo marker: popup above
        : { 'bottom': [0, -30] as [number, number] }; // Pin marker: popup higher (accounting for pin height)

      const popup = new mapboxgl.Popup({ 
        offset: popupOffset,
        closeButton: false,
        className: 'custom-popup',
        maxWidth: '280px',
        anchor: 'bottom', // CRITICAL: Always anchor to bottom of popup
        closeOnClick: false, // Prevent jumping on click
      }).setHTML(`
        <div style="
          padding: 14px 16px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%);
          backdrop-filter: blur(12px);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.8);
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        ">
          <h3 style="
            margin: 0 0 6px 0;
            font-weight: 700;
            font-size: 15px;
            color: #1e293b;
            letter-spacing: -0.01em;
            line-height: 1.3;
          ">${marker.title}</h3>
          ${marker.description ? `
            <p style="
              margin: 0;
              font-size: 13px;
              color: #64748b;
              line-height: 1.5;
              font-weight: 400;
            ">${marker.description}</p>
          ` : ''}
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

  // Transport modes that use Mapbox Directions API for real road geometry.
  // All others fall back to straight-line (great-circle) rendering.
  private readonly DIRECTIONS_PROFILES: Partial<Record<TransportMode, string>> = {
    car: 'driving-traffic',
    bus: 'driving',
    bike: 'cycling',
    walk: 'walking',
    walking: 'walking',
  };

  // Fetches real road geometry from the Mapbox Directions API for a single segment.
  // Returns an ordered array of [lng, lat] coordinate pairs, or null on failure.
  private async fetchDirectionsRoute(
    from: [number, number],
    to: [number, number],
    profile: string,
  ): Promise<[number, number][] | null> {
    const token = (mapboxgl as any).accessToken as string;
    if (!token) return null;

    const url =
      `https://api.mapbox.com/directions/v5/mapbox/${profile}` +
      `/${from[0]},${from[1]};${to[0]},${to[1]}` +
      `?geometries=geojson&overview=full&access_token=${token}`;

    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const json = await res.json();
      const coords = json.routes?.[0]?.geometry?.coordinates as [number, number][] | undefined;
      return coords ?? null;
    } catch {
      return null;
    }
  }

  // Resolves geometry for every step that needs it.
  // Steps with cached routeGeometry are skipped (no API call).
  // Mutates the steps array in-place so drawJourneyRoute can use it directly.
  private async resolveRouteGeometries(steps: Trip['steps']): Promise<void> {
    const tasks = steps.slice(0, -1).map(async (step, i) => {
      const profile = this.DIRECTIONS_PROFILES[step.transportToNext as TransportMode];

      // Use Directions API only for ground/water transport without cached geometry
      if (profile && step.routeGeometry === undefined) {
        const next = steps[i + 1];
        const geometry = await this.fetchDirectionsRoute(step.coordinates, next.coordinates, profile);
        // Assign result; null means API failed → straight line will be used
        step.routeGeometry = geometry;
      }
    });

    await Promise.all(tasks);
  }

  async renderJourney(journey: Journey | Trip): Promise<void> {
    if (!this.map) return;

    // CRITICAL FIX: Ensure map style is loaded before rendering
    if (!this.map.isStyleLoaded()) {
      await new Promise<void>((resolve) => {
        this.map!.once('style.load', () => resolve());
      });
    }

    // STEP 1: Clear any existing journey layers
    this.clearJourney(journey.id);

    // STEP 2: Pre-load transport icons (CRITICAL - must happen BEFORE layers)
    this.loadTransportIcons();

    // STEP 3: Work on a deep copy of steps so React state is never mutated
    const journeyToRender: Journey | Trip = {
      ...journey,
      steps: journey.steps.map((s) => ({ ...s })),
    };

    // STEP 4: Resolve Directions API geometries for applicable segments
    await this.resolveRouteGeometries(journeyToRender.steps);

    // STEP 5: Draw route lines FIRST (bottom layer)
    this.drawJourneyRoute(journeyToRender);

    // STEP 6: Add transport medallions AFTER lines (they appear on top)
    await this.addTransportMedallions(journeyToRender);

    // STEP 7: Add stop markers LAST (topmost layer)
    this.addJourneyStopMarkers(journeyToRender);
  }

  private drawJourneyRoute(journey: Journey | Trip): void {
    if (!this.map || journey.steps.length < 2) {
      return;
    }

    const segments: any[] = [];

    for (let i = 0; i < journey.steps.length - 1; i++) {
      const current = journey.steps[i];
      const next = journey.steps[i + 1];

      // Use cached Directions geometry when available, otherwise straight line
      const coordinates: [number, number][] =
        current.routeGeometry && current.routeGeometry.length >= 2
          ? current.routeGeometry
          : [current.coordinates, next.coordinates];

      segments.push({
        type: 'Feature',
        properties: {
          transportMode: current.transportToNext,
          color: 'rgba(255,255,255,0.5)',
        },
        geometry: {
          type: 'LineString',
          coordinates,
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
        console.log(`  ⏭️  Layer ${layerId} already exists, skipping`);
        return;
      }

      const style = this.getRouteStyle(segment.properties.transportMode);

      // CRITICAL: Add line layer BEFORE medallions (so medallions appear on top)
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

      console.log(`  ✅ Added line layer: ${layerId} (${segment.properties.transportMode})`);
    });

    this.journeyLayers.set(journey.id, layerIds);
    console.log(`✅ Route drawn with ${segments.length} segment(s)`);
  }

  private getRouteStyle(_transport: TransportMode | null): any {
    // All transport modes: subtle white dashed line
    return {
      'line-color': 'rgba(255, 255, 255, 0.55)',
      'line-width': 2,
      'line-dasharray': [3, 4],
      'line-opacity': 1,
      'line-blur': 0,
    };
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
      el.style.backgroundColor = 'rgba(255, 255, 255, 0.85)';
      el.style.border = '2px solid rgba(255, 255, 255, 0.4)';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.35)';
      el.style.cursor = 'pointer';

      if (isFirst || isLast) {
        el.style.width = '32px';
        el.style.height = '32px';
        el.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
        el.style.border = '3px solid rgba(255, 255, 255, 0.5)';
      }

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat(step.coordinates)
        .addTo(this.map!);

      // CRITICAL FIX: Calculate proper offset for journey stop markers
      const markerHeight = isFirst || isLast ? 32 : 24;
      const popupOffsetValue = markerHeight / 2 + 8; // Half marker height + 8px gap

      const popup = new mapboxgl.Popup({ 
        offset: { 'bottom': [0, -popupOffsetValue] as [number, number] },
        closeButton: false,
        className: 'custom-popup',
        maxWidth: '260px',
        anchor: 'bottom', // Always anchor to bottom
        closeOnClick: false, // Prevent position jumping
      }).setHTML(`
        <div style="
          padding: 12px 14px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%);
          backdrop-filter: blur(12px);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.8);
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        ">
          <div style="
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: ${step.address?.city ? '6px' : '0'};
          ">
            <div style="
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background: rgba(255, 255, 255, 0.7);
              box-shadow: 0 0 6px rgba(255,255,255,0.3);
            "></div>
            <h3 style="
              margin: 0;
              font-size: 15px;
              font-weight: 700;
              color: #1e293b;
              letter-spacing: -0.01em;
            ">${step.name}</h3>
          </div>
          ${step.address?.city ? `
            <p style="
              margin: 0;
              font-size: 12px;
              color: #64748b;
              padding-left: 16px;
              font-weight: 500;
            ">${step.address.city}</p>
          ` : ''}
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

    console.log(`🏅 Creating premium medallions for journey: ${journey.id}, steps: ${journey.steps.length}`);

    // Pre-load icons if not already loaded
    this.loadTransportIcons();

    const features: GeoJSON.Feature<GeoJSON.Point>[] = [];

    for (let i = 0; i < journey.steps.length - 1; i++) {
      const current = journey.steps[i];
      const next = journey.steps[i + 1];

      if (!current.transportToNext) {
        console.log(`  ⏭️  Segment ${i}: No transport mode, skipping`);
        continue;
      }

      // Calculate midpoint based on transport type
      const midpoint = current.transportToNext === 'flight'
        ? this.calculateArcMidpoint(current.coordinates, next.coordinates)
        : this.calculateMidpoint(current.coordinates, next.coordinates);

      const bearing = this.calculateBearing(current.coordinates, next.coordinates);

      console.log(`  ✈️  Segment ${i}: ${current.transportToNext} | ${current.name} → ${next.name} | Bearing: ${bearing.toFixed(1)}° | Midpoint: [${midpoint[0].toFixed(2)}, ${midpoint[1].toFixed(2)}]`);

      // Verify icon exists
      const iconName = `medallion-${current.transportToNext}`;
      if (!this.map.hasImage(iconName)) {
        console.warn(`  ⚠️  Icon missing: ${iconName} - will use fallback`);
      }

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
          color: 'rgba(255,255,255,0.4)',
        },
      });
    }

    if (features.length === 0) {
      console.log('  ⚠️  No transport segments found, skipping medallions');
      return;
    }

    console.log(`  🎯 Creating ${features.length} premium medallion icons`);

    const sourceId = `medallions-${journey.id}`;
    const layerBgId = `medallions-bg-${journey.id}`;
    const layerIconId = `medallions-icon-${journey.id}`;

    // Remove existing layers/source if they exist
    if (this.map.getSource(sourceId)) {
      if (this.map.getLayer(layerIconId)) this.map.removeLayer(layerIconId);
      if (this.map.getLayer(layerBgId)) this.map.removeLayer(layerBgId);
      this.map.removeSource(sourceId);
    }

    // Add GeoJSON source
    this.map.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features,
      },
    });

    // Layer 1: White circle background (bottom)
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
        'circle-blur': 0.3, // Subtle shadow effect
      },
    });

    // Layer 2: Transport icon (on top)
    this.map.addLayer({
      id: layerIconId,
      type: 'symbol',
      source: sourceId,
      layout: {
        'icon-image': [
          'match', ['get', 'transport'],
          'flight',  'medallion-flight',
          'car',     'medallion-car',
          'train',   'medallion-train',
          'bus',     'medallion-bus',
          'ship',    'medallion-ship',
          'bike',    'medallion-bike',
          'walk',    'medallion-walk',
          'walking', 'medallion-walking',
          'medallion-car',
        ],
        'icon-size': 0.6,
        'icon-rotate': ['get', 'bearing'],
        'icon-rotation-alignment': 'map',
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
        'icon-anchor': 'center',
        'text-allow-overlap': true,
      },
      paint: {
        'icon-opacity': 1.0,
        'icon-halo-color': ['get', 'color'],
        'icon-halo-width': 2,
        'icon-halo-blur': 1,
      },
    });

    // Track layers for cleanup
    const layers = this.journeyLayers.get(journey.id) || [];
    layers.push(layerBgId, layerIconId);
    this.journeyLayers.set(journey.id, layers);
    this.journeySources.add(sourceId);

    console.log(`  ✅ Premium medallion layers created: ${layerBgId}, ${layerIconId}`);
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

    console.log(`🧹 Clearing journey: ${journeyId}`);

    // Remove line layers
    const layerIds = this.journeyLayers.get(journeyId);
    if (layerIds) {
      layerIds.forEach(layerId => {
        if (this.map!.getLayer(layerId)) {
          this.map!.removeLayer(layerId);
          console.log(`  🗑️  Removed layer: ${layerId}`);
        }
      });
      this.journeyLayers.delete(journeyId);
    }

    // Remove line source
    const sourceId = `journey-source-${journeyId}`;
    if (this.map.getSource(sourceId)) {
      this.map.removeSource(sourceId);
      this.journeySources.delete(sourceId);
      console.log(`  🗑️  Removed source: ${sourceId}`);
    }

    // Remove medallion layers
    const medallionBgLayerId = `medallions-bg-${journeyId}`;
    const medallionIconLayerId = `medallions-icon-${journeyId}`;
    if (this.map.getLayer(medallionIconLayerId)) {
      this.map.removeLayer(medallionIconLayerId);
      console.log(`  🗑️  Removed medallion icon layer`);
    }
    if (this.map.getLayer(medallionBgLayerId)) {
      this.map.removeLayer(medallionBgLayerId);
      console.log(`  🗑️  Removed medallion bg layer`);
    }

    // Remove medallion source
    const medallionSourceId = `medallions-${journeyId}`;
    if (this.map.getSource(medallionSourceId)) {
      this.map.removeSource(medallionSourceId);
      this.journeySources.delete(medallionSourceId);
      console.log(`  🗑️  Removed medallion source`);
    }

    // Remove stop markers
    const markers = this.medallionMarkers.get(journeyId);
    if (markers) {
      markers.forEach(marker => marker.remove());
      this.medallionMarkers.delete(journeyId);
      console.log(`  🗑️  Removed ${markers.length} stop marker(s)`);
    }

    console.log(`✅ Journey ${journeyId} cleared`);
  }

  hasJourney(journeyId: string): boolean {
    return this.journeyLayers.has(journeyId);
  }

  clearAllJourneys(): void {
    if (!this.map) return;

    console.log('🧹 Clearing all journeys');
    const count = this.journeyLayers.size;

    this.journeyLayers.forEach((_, journeyId) => {
      this.clearJourney(journeyId);
    });

    console.log(`✅ Cleared ${count} journey(s)`);
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
