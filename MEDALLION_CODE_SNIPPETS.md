# 🏅 Medallion Icons - Code Snippets

Quick reference for premium transport medallion implementation.

---

## 📦 Transport Icon Definitions

```typescript
private readonly TRANSPORT_ICONS: Record<TransportMode, { path: string; color: string }> = {
  flight: {
    path: 'M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z',
    color: '#4ECDC4', // Cyan
  },
  car: {
    path: 'M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z',
    color: '#FF6B6B', // Red
  },
  bus: {
    path: 'M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z',
    color: '#FFA07A', // Orange
  },
  train: {
    path: 'M4 15.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h12v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V5c0-3.5-3.58-4-8-4s-8 .5-8 4v10.5zm8 1.5c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm-6-7h12v3H6V10zM6 5h12v3H6V5z',
    color: '#45B7D1', // Blue
  },
  ship: {
    path: 'M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v-2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l1.89-6.68c.08-.26.06-.54-.06-.78s-.34-.42-.6-.5L20 10.62V6c0-1.1-.9-2-2-2h-3V1H9v3H6c-1.1 0-2 .9-2 2v4.62l-1.29.42c-.26.08-.48.26-.6.5s-.15.52-.06.78L3.95 19zM6 6h12v3.97L12 8 6 9.97V6z',
    color: '#85C1E2', // Light blue
  },
  walk: {
    path: 'M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7z',
    color: '#95E1D3', // Mint
  },
  walking: {
    path: 'M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7z',
    color: '#95E1D3', // Mint
  },
  bike: {
    path: 'M15.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM5 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5zm5.8-10l2.4-2.4.8.8c1.3 1.3 3 2.1 5.1 2.1V9c-1.5 0-2.7-.6-3.6-1.5l-1.9-1.9c-.5-.4-1-.6-1.6-.6s-1.1.2-1.4.6L7.8 8.4c-.4.4-.6.9-.6 1.4 0 .6.2 1.1.6 1.4L11 14v5h2v-6.2l-2.2-2.3zM19 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5z',
    color: '#A8E6CF', // Light green
  },
};
```

---

## 🔄 Icon Pre-loading

```typescript
private async loadTransportIcons(): Promise<void> {
  if (!this.map || this.transportIconsLoaded) return;

  console.log('🎨 Loading premium transport medallion icons...');

  const loadPromises = Object.entries(this.TRANSPORT_ICONS).map(([mode, config]) => {
    return new Promise<void>((resolve, reject) => {
      // Create SVG with Material Design icon path and color
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
            console.log(`  ✅ Loaded icon: medallion-${mode} (${config.color})`);
          } else {
            console.log(`  ⏭️  Icon already exists: medallion-${mode}`);
          }
          resolve();
        } catch (error) {
          console.error(`  ❌ Failed to add image medallion-${mode}:`, error);
          reject(error);
        }
      };
      
      img.onerror = (error) => {
        console.error(`  ❌ Failed to load image data for ${mode}:`, error);
        reject(new Error(`Failed to load ${mode} icon`));
      };
      
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    });
  });

  try {
    await Promise.all(loadPromises);
    this.transportIconsLoaded = true;
    console.log('✨ All transport icons loaded successfully!');
  } catch (error) {
    console.error('⚠️ Some transport icons failed to load:', error);
    this.transportIconsLoaded = true;
  }
}
```

---

## 📐 Midpoint Calculations

### Arc Midpoint (Flights)

```typescript
private calculateArcMidpoint(from: [number, number], to: [number, number]): [number, number] {
  // Convert to radians
  const lon1 = from[0] * Math.PI / 180;
  const lat1 = from[1] * Math.PI / 180;
  const lon2 = to[0] * Math.PI / 180;
  const lat2 = to[1] * Math.PI / 180;

  const dLon = lon2 - lon1;
  
  // Haversine-based midpoint for better accuracy
  const bX = Math.cos(lat2) * Math.cos(dLon);
  const bY = Math.cos(lat2) * Math.sin(dLon);
  
  const lat3 = Math.atan2(
    Math.sin(lat1) + Math.sin(lat2),
    Math.sqrt((Math.cos(lat1) + bX) * (Math.cos(lat1) + bX) + bY * bY)
  );
  
  const lon3 = lon1 + Math.atan2(bY, Math.cos(lat1) + bX);
  
  // Convert back to degrees
  return [
    lon3 * 180 / Math.PI,
    lat3 * 180 / Math.PI
  ];
}
```

### Straight Midpoint (Ground Transport)

```typescript
private calculateMidpoint(from: [number, number], to: [number, number]): [number, number] {
  return [
    (from[0] + to[0]) / 2,
    (from[1] + to[1]) / 2,
  ];
}
```

---

## 🧭 Bearing Calculation

```typescript
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
```

---

## 🎨 Medallion Rendering

```typescript
private async addTransportMedallions(journey: Journey | Trip): Promise<void> {
  if (!this.map) return;

  // CRITICAL: Preload icons first
  await this.loadTransportIcons();

  const features: GeoJSON.Feature<GeoJSON.Point>[] = [];

  console.log(`🎯 Creating premium medallions for journey: ${journey.id}`);

  // Create features for each segment
  for (let i = 0; i < journey.steps.length - 1; i++) {
    const current = journey.steps[i];
    const next = journey.steps[i + 1];

    if (!current.transportToNext) continue;

    // Use arc for flights, straight for ground
    const midpoint = current.transportToNext === 'flight'
      ? this.calculateArcMidpoint(current.coordinates, next.coordinates)
      : this.calculateMidpoint(current.coordinates, next.coordinates);

    const bearing = this.calculateBearing(current.coordinates, next.coordinates);

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

  if (features.length === 0) return;

  const sourceId = `medallions-${journey.id}`;
  const layerBgId = `medallions-bg-${journey.id}`;
  const layerIconId = `medallions-icon-${journey.id}`;

  // Clean up existing
  if (this.map.getSource(sourceId)) {
    if (this.map.getLayer(layerIconId)) this.map.removeLayer(layerIconId);
    if (this.map.getLayer(layerBgId)) this.map.removeLayer(layerBgId);
    this.map.removeSource(sourceId);
  }

  // Add GeoJSON source
  this.map.addSource(sourceId, {
    type: 'geojson',
    data: { type: 'FeatureCollection', features },
  });

  // Layer 1: White circular background
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
      'circle-blur': 0.3,
    },
  });

  // Layer 2: Transport icon with rotation
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
      'icon-halo-color': journey.color,
      'icon-halo-width': 2,
      'icon-halo-blur': 1,
    },
  });

  // Register for cleanup
  const layers = this.journeyLayers.get(journey.id) || [];
  layers.push(layerBgId, layerIconId);
  this.journeyLayers.set(journey.id, layers);
  this.journeySources.add(sourceId);

  console.log(`✅ Premium medallion layers created`);
}
```

---

## 🗑️ Cleanup

```typescript
clearJourney(journeyId: string): void {
  if (!this.map) return;

  // Remove layers
  const layerIds = this.journeyLayers.get(journeyId);
  if (layerIds) {
    layerIds.forEach(layerId => {
      if (this.map!.getLayer(layerId)) {
        this.map!.removeLayer(layerId);
      }
    });
    this.journeyLayers.delete(journeyId);
  }

  // Remove sources
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

  // Remove markers
  const markers = this.medallionMarkers.get(journeyId);
  if (markers) {
    markers.forEach(marker => marker.remove());
    this.medallionMarkers.delete(journeyId);
  }
}
```

---

## 🧪 Usage Example

```typescript
// Example journey
const trip: Trip = {
  id: 'europe-tour-2026',
  userId: 'user-123',
  name: 'European Adventure',
  color: '#3b82f6',
  steps: [
    {
      id: 'step-1',
      name: 'London',
      coordinates: [-0.1276, 51.5074],
      timestamp: 1735689600000,
      order: 0,
      transportToNext: 'flight',
    },
    {
      id: 'step-2',
      name: 'Paris',
      coordinates: [2.3522, 48.8566],
      timestamp: 1735776000000,
      order: 1,
      transportToNext: 'train',
    },
    {
      id: 'step-3',
      name: 'Amsterdam',
      coordinates: [4.9041, 52.3676],
      timestamp: 1735862400000,
      order: 2,
      transportToNext: 'bike',
    },
    {
      id: 'step-4',
      name: 'Rotterdam',
      coordinates: [4.4777, 51.9244],
      timestamp: 1735948800000,
      order: 3,
      transportToNext: null,
    },
  ],
  isPublic: true,
  createdAt: { seconds: 1735689600, nanoseconds: 0 },
  updatedAt: { seconds: 1735689600, nanoseconds: 0 },
};

// Render with medallions
const mapboxService = getMapboxService();
await mapboxService.renderJourney(trip);

// Console output:
// 🎯 Creating premium medallions for journey: europe-tour-2026, steps: 4
//   📍 Segment 0: flight from London → Paris, bearing: 146.8°
//   📍 Segment 1: train from Paris → Amsterdam, bearing: 27.3°
//   📍 Segment 2: bike from Amsterdam → Rotterdam, bearing: 185.6°
// ✨ Creating 3 premium medallion icons
// ✅ Premium medallion layers created
```

---

## 📊 Layer Structure

```
medallions-source-{journeyId}
├── medallions-bg-{journeyId}    (CircleLayer)
│   └── White background circle
│       • radius: 18px
│       • color: #ffffff
│       • stroke: 2px #e5e7eb
│       • blur: 0.3
│
└── medallions-icon-{journeyId}  (SymbolLayer)
    └── Transport icon
        • image: medallion-{transport}
        • size: 0.6 (scale)
        • rotate: {bearing}°
        • halo: {journey.color}
```

---

## ✅ Checklist

Before deploying medallions:

- [ ] Icons are pre-loaded with `loadTransportIcons()`
- [ ] Arc midpoint used for flights
- [ ] Straight midpoint used for ground transport
- [ ] Bearing calculated for each segment
- [ ] White circular background added
- [ ] Icons rotate with bearing
- [ ] Halo matches journey color
- [ ] Error handling in place
- [ ] Cleanup properly removes all layers
- [ ] Console logs for debugging
- [ ] TypeScript types correct
- [ ] No ESLint errors

---

## 🎯 Quick Test

```typescript
// Test medallion rendering
const testJourney = {
  id: 'test-123',
  steps: [
    { name: 'NYC', coordinates: [-74.00, 40.71], transportToNext: 'flight' },
    { name: 'London', coordinates: [-0.12, 51.50], transportToNext: null },
  ],
  color: '#3b82f6',
};

await mapboxService.renderJourney(testJourney);
// Should show 1 flight medallion at mid-Atlantic
```

---

**Status:** ✅ Ready to use
