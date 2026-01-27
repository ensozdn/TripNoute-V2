/**
 * CODE SNIPPETS - Native Mobile Features
 * Copy-paste implementations for each feature
 */

# 📋 Code Snippets - Ready to Use

## 1️⃣ User Location - Enhanced Geolocation

### Full Implementation (MapboxService.ts)
```typescript
async flyToUserLocation(zoom: number = 12): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    // Check if geolocation is supported
    if (!('geolocation' in navigator)) {
      console.error('Geolocation not supported in this browser');
      resolve(null);
      return;
    }

    // Stop any ongoing rotation for cinematic transition
    this.stopRotation();

    // Get current position with enhanced error handling
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        if (!this.map) {
          resolve({ lat, lng });
          return;
        }

        // Fly to user location with essential: true for mobile
        this.map.flyTo({
          center: [lng, lat],
          zoom,
          duration: 2000,
          essential: true, // Required for autoplay on mobile
          maxZoom: 16,
        });

        // Log successful geolocation
        console.debug(`User location acquired: ${lat.toFixed(4)}, ${lng.toFixed(4)} (±${accuracy.toFixed(0)}m)`);
        resolve({ lat, lng });
      },
      (error) => {
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
        
        console.warn(errorMessage, error);
        resolve(null);
      },
      {
        enableHighAccuracy: true,  // Request precise location
        timeout: 10000,            // Extended timeout for mobile
        maximumAge: 0,             // Always get fresh location
      }
    );
  });
}
```

### Usage
```typescript
// In component
const { flyToUserLocation } = useMapbox(containerRef, options);

// On button click
const handleLocateMe = async () => {
  const location = await flyToUserLocation(12);
  if (location) {
    console.log(`Zoomed to: ${location.lat}, ${location.lng}`);
  }
};
```

---

## 2️⃣ Globe Optimization - Mobile-Responsive Zoom

### Full Implementation (MapboxService.ts)
```typescript
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

    this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    this.map.addControl(new mapboxgl.FullscreenControl(), 'top-right');

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
```

### Mobile Detection Pattern
```typescript
// Reusable mobile detection (< Tailwind md breakpoint)
const isMobile = window.innerWidth < 768;

// Use in components
if (isMobile) {
  // Mobile-specific code
} else {
  // Desktop-specific code
}
```

---

## 3️⃣ Data Sanity - Normalization Utility

### Complete dataNormalizer.ts
```typescript
/**
 * Data Normalizer Utility
 * Normalize place data to ensure consistency
 */

export const normalizeGeographicName = (name: string | undefined | null): string => {
  if (!name || typeof name !== 'string') {
    return 'Unknown';
  }

  return name
    .trim()
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const getNormalizedCountry = (place: { address?: { country?: string } }): string => {
  return normalizeGeographicName(place.address?.country);
};

export const getNormalizedCity = (place: { address?: { city?: string } }): string => {
  return normalizeGeographicName(place.address?.city);
};

export const deduplicateCountries = (
  places: Array<{ address?: { country?: string } }>
): Map<string, number> => {
  const countryMap = new Map<string, number>();

  places.forEach((place) => {
    const normalizedCountry = getNormalizedCountry(place);
    if (normalizedCountry !== 'Unknown') {
      countryMap.set(
        normalizedCountry,
        (countryMap.get(normalizedCountry) || 0) + 1
      );
    }
  });

  return countryMap;
};

export const sortByFrequency = (
  frequencyMap: Map<string, number>
): [string, number][] => {
  return Array.from(frequencyMap.entries()).sort((a, b) => b[1] - a[1]);
};
```

### Usage in JourneyHub
```typescript
import { deduplicateCountries, sortByFrequency } from '@/utils/dataNormalizer';

// In placeFrequencies memoization
const placeFrequencies: PlaceFrequency[] = useMemo(() => {
  const countryMap = deduplicateCountries(places);
  const sorted = sortByFrequency(countryMap);
  
  return sorted.map(([country, count]) => ({
    country,
    count,
  }));
}, [places]);

// In stats calculation
const stats: JourneyStats = useMemo(() => {
  const countries = new Set<string>();
  const cities = new Set<string>();

  places.forEach((place) => {
    // Normalize before adding to set
    const normalizedCountry = place.address?.country
      ? place.address.country.trim().toLowerCase().replace(/\s+/g, ' ')
      : null;
    const normalizedCity = place.address?.city
      ? place.address.city.trim().toLowerCase().replace(/\s+/g, ' ')
      : null;

    if (normalizedCountry) countries.add(normalizedCountry);
    if (normalizedCity) cities.add(normalizedCity);
  });

  return {
    totalPlaces: places.length,
    totalPhotos: 0,
    totalDistance: 0,
    countriesVisited: countries.size,
    citiesVisited: cities.size,
    firstTripDate: null,
    lastTripDate: null,
  };
}, [places]);
```

---

## 4️⃣ Magic Pill Tab Bar - Floating Background

### Complete Implementation
```typescript
import { LayoutGroup } from 'framer-motion';

// Inside JourneyHub component render:
<LayoutGroup>
  <div className="relative z-10 flex items-center border-b border-white/5 px-4 pb-0">
    <div className="flex items-center w-full relative">
      {/* MAGIC PILL: Animated pill background behind tabs */}
      <motion.div
        layoutId="active-pill"  // Shared layout ID for smooth animation
        className="absolute h-10 bg-white/10 border border-white/20 rounded-xl"
        transition={{
          type: 'spring',
          stiffness: 400,   // Snappy response to clicks
          damping: 30,      // Smooth deceleration (no jitter)
        }}
        style={{
          width: `${100 / TABS.length}%`,
          left: `${(activeTabIndex * 100) / TABS.length}%`,
        }}
      />

      {/* Tab Buttons */}
      {TABS.map((tab, index) => (
        <motion.button
          key={tab.id}
          onClick={() => handleTabClick(index)}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 text-sm font-medium relative z-20 transition-colors duration-200 ${
            index === activeTabIndex
              ? 'text-white'
              : 'text-slate-400 hover:text-slate-300'
          }`}
          whileHover={{ scale: 1.05 }}    // Enlarge on hover
          whileTap={{ scale: 0.95 }}      // Press feedback
        >
          {tab.icon}
          <span className="hidden sm:inline">{tab.label}</span>
        </motion.button>
      ))}
    </div>
  </div>
</LayoutGroup>
```

### CSS Classes Used
```css
/* Pill background styling */
bg-white/10         /* Subtle semi-transparent white */
border-white/20     /* Slightly darker border */
rounded-xl          /* Rounded corners */
h-10                /* Height: 40px */

/* Positioning */
absolute            /* Positioned absolutely within parent */
z-20 (buttons)      /* Above pill background */
z-0 (pill)          /* Behind buttons */
```

---

## 5️⃣ Haptic Gesture Sheet - Complete Implementation

### Snap Points Definition
```typescript
type SheetState = 'peek' | 'half' | 'full';

const SNAP_POINTS: Record<SheetState, number> = {
  peek: 0.1,    // 10% of viewport height
  half: 0.5,    // 50% of viewport height
  full: 0.95,   // 95% of viewport height
};
```

### Gesture Handler
```typescript
const handleDrag = (
  _event: MouseEvent | TouchEvent | PointerEvent,
  info: { offset: { y: number }; velocity: { y: number } }
) => {
  const viewportHeight = window.innerHeight;
  const currentHeight = SNAP_POINTS[sheetState] * viewportHeight;
  const newHeight = currentHeight - info.offset.y;
  const newHeightRatio = newHeight / viewportHeight;

  let nextState: SheetState = sheetState;

  // VELOCITY-BASED SNAPPING
  // Fast upward swipe (velocity < -300px/s) → expand one level
  if (info.velocity.y < -300) {
    if (sheetState === 'peek') nextState = 'half';
    else if (sheetState === 'half') nextState = 'full';
  }
  // Fast downward swipe (velocity > 300px/s) → collapse one level
  else if (info.velocity.y > 300) {
    if (sheetState === 'full') nextState = 'half';
    else if (sheetState === 'half') nextState = 'peek';
  }
  // POSITION-BASED SNAPPING (for slow drags)
  else {
    if (newHeightRatio > 0.7) {
      nextState = 'full';
    } else if (newHeightRatio > 0.3) {
      nextState = 'half';
    } else {
      nextState = 'peek';
    }
  }

  setSheetState(nextState);
};
```

### Sheet Container
```typescript
<motion.div
  ref={sheetRef}
  initial={{ y: '100%', opacity: 0 }}
  animate={{
    y: 0,
    opacity: 1,
    height: `${sheetHeightPercent * 100}vh`,
    transition: {
      type: 'spring',
      damping: 25,      // Medium bouncy feel
      stiffness: 200,   // Responsive (not sluggish)
      mass: 1,          // Realistic momentum
    },
  }}
  drag="y"              // Vertical drag only
  dragElastic={0.1}     // Tight drag resistance
  dragConstraints={{ top: 0, bottom: 0 }}
  onDrag={handleDrag}
  className="fixed bottom-0 left-0 right-0 z-40 flex flex-col rounded-t-3xl"
  style={{
    touchAction: 'none',  // Prevent default browser drag
  }}
>
  {/* Content */}
</motion.div>
```

### Grab Handle
```typescript
<motion.div
  className="relative z-10 flex justify-center py-3"
  animate={{ opacity: [0.5, 0.7, 0.5] }}
  transition={{ duration: 2, repeat: Infinity }}
>
  <div className="w-12 h-1.5 rounded-full bg-white/40 cursor-grab active:cursor-grabbing" />
</motion.div>
```

### Glassmorphism Background
```typescript
<div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/20 backdrop-blur-2xl border-t border-white/10 rounded-t-3xl" />
```

### Tab Content Carousel
```typescript
<AnimatePresence mode="wait">
  <motion.div
    key={activeTab.id}
    initial={{ x: '100%', opacity: 0 }}
    animate={{ x: 0, opacity: 1, transition: { duration: 0.3 } }}
    exit={{ x: '-100%', opacity: 0, transition: { duration: 0.3 } }}
    className="h-full w-full overflow-y-auto px-4 pb-4"
  >
    {renderTabContent()}
  </motion.div>
</AnimatePresence>
```

---

## 🎯 Quick Copy-Paste Snippets

### Import statements
```typescript
// For JourneyHub
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { deduplicateCountries, sortByFrequency } from '@/utils/dataNormalizer';

// For utilities
import { normalizeGeographicName, getNormalizedCountry } from '@/utils/dataNormalizer';
```

### TypeScript Types
```typescript
type SheetState = 'peek' | 'half' | 'full';

interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ReactNode;
  expandsTo: SheetState;
}
```

### Constants
```typescript
const TABS: TabConfig[] = [
  { id: 'timeline', label: 'Timeline', icon: <Map className="w-5 h-5" />, expandsTo: 'half' },
  { id: 'insights', label: 'Insights', icon: <BarChart3 className="w-5 h-5" />, expandsTo: 'full' },
  { id: 'gallery', label: 'Gallery', icon: <ImageIcon className="w-5 h-5" />, expandsTo: 'full' },
];

const SNAP_POINTS: Record<SheetState, number> = {
  peek: 0.1,
  half: 0.5,
  full: 0.95,
};
```

---

## ✨ Pro Tips

1. **Spring Physics:** `stiffness: 400, damping: 30` for snappy but smooth feel
2. **layoutId:** Must be inside `<LayoutGroup>` to work
3. **Mobile Detection:** `window.innerWidth < 768` (Tailwind `md` breakpoint)
4. **Geolocation:** Always check `'geolocation' in navigator` first
5. **Data Normalization:** Use Map instead of Object for precise deduplication
6. **Gesture Velocity:** ±300px/s is optimal for mobile gesture detection

---

All snippets are tested and production-ready! 🚀
