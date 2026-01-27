# JourneyHub.tsx - Core Implementation Snippets

## Complete Drag Handler Implementation

```typescript
/**
 * Handle vertical drag and snap to nearest state
 * - Drag up: expand to next state
 * - Drag down: collapse to previous state
 * - Velocity-based snapping
 */
const handleDrag = (
  _event: MouseEvent | TouchEvent | PointerEvent,
  info: { offset: { y: number }; velocity: { y: number } }
) => {
  const viewportHeight = window.innerHeight;
  const currentHeight = SNAP_POINTS[sheetState] * viewportHeight;
  const newHeight = currentHeight - info.offset.y;
  const newHeightRatio = newHeight / viewportHeight;

  // Determine next state based on position and velocity
  let nextState: SheetState = sheetState;

  // Fast upward swipe (velocity < -300px/s) → expand one level
  if (info.velocity.y < -300) {
    if (sheetState === 'closed') nextState = 'half';
    else if (sheetState === 'half') nextState = 'full';
  }
  // Fast downward swipe → collapse one level
  else if (info.velocity.y > 300) {
    if (sheetState === 'full') nextState = 'half';
    else if (sheetState === 'half') nextState = 'closed';
  }
  // Position-based snapping (user drags slowly)
  else {
    // Snap to nearest state
    if (newHeightRatio > 0.65) {
      nextState = 'full';
    } else if (newHeightRatio > 0.2) {
      nextState = 'half';
    } else {
      nextState = 'closed';
    }
  }

  setSheetState(nextState);
};
```

## Tab Click Handler

```typescript
/**
 * Handle tab click - expand to appropriate state for that tab
 */
const handleTabClick = (tabIndex: number) => {
  setActiveTabIndex(tabIndex);
  const expandsTo = TABS[tabIndex].expandsTo;
  setSheetState(expandsTo);
};
```

## Motion Container Setup

```tsx
<motion.div
  ref={sheetRef}
  initial={{ y: '100%', opacity: 0 }}
  animate={{
    y: 0,
    opacity: 1,
    height: `${sheetHeightPercent * 100}vh`,
    transition: {
      type: 'spring',
      damping: 25,      // Medium bouncy
      stiffness: 200,   // Responsive
      mass: 1,
    },
  }}
  drag="y"  // Only vertical dragging
  dragElastic={0.1}
  dragConstraints={{ top: 0, bottom: 0 }}
  onDrag={handleDrag}
  className="fixed bottom-0 left-0 right-0 z-40 flex flex-col rounded-t-3xl"
  style={{
    touchAction: 'none',  // Prevent browser default drag
  }}
>
  {/* Content here */}
</motion.div>
```

## Glassmorphism Background

```tsx
<div className="absolute inset-0 
  bg-gradient-to-b from-black/40 via-black/30 to-black/20 
  backdrop-blur-2xl 
  border-t border-white/10 
  rounded-t-3xl" 
/>
```

## Grab Handle with Breathing Animation

```tsx
<motion.div
  className="relative z-10 flex justify-center py-2"
  animate={{ opacity: [0.5, 0.7, 0.5] }}
  transition={{ duration: 2, repeat: Infinity }}
>
  <div className="w-12 h-1.5 rounded-full bg-white/40 cursor-grab active:cursor-grabbing" />
</motion.div>
```

## Tab Bar with Synchronized Underline

```tsx
<div className="relative z-10 flex items-center border-b border-white/5 px-4 pb-0">
  {/* Tab Buttons */}
  <div className="flex items-center w-full">
    {TABS.map((tab, index) => (
      <motion.button
        key={tab.id}
        animate={{
          opacity: index === activeTabIndex ? 1 : 0.5,
          scale: index === activeTabIndex ? 1.05 : 1,
        }}
        transition={{
          type: 'spring',
          damping: 25,
          stiffness: 200,
        }}
        onClick={() => handleTabClick(index)}
        className={`flex-1 flex items-center justify-center gap-2 py-4 px-3 text-sm font-medium transition-colors duration-200 ${
          index === activeTabIndex
            ? 'text-white'
            : 'text-slate-400 hover:text-slate-300'
        }`}
      >
        {tab.icon}
        <span className="hidden sm:inline">{tab.label}</span>
      </motion.button>
    ))}
  </div>

  {/* Animated Underline Indicator */}
  <motion.div
    animate={{
      x: `${activeTabIndex * 100}%`,
    }}
    transition={{
      type: 'spring',
      damping: 25,
      stiffness: 200,
    }}
    className="absolute bottom-0 h-0.5 w-1/3 bg-gradient-to-r from-cyan-400 to-blue-500"
  />
</div>
```

## Content Carousel Area

```tsx
<div
  className="relative z-10 flex-1 min-h-0 overflow-hidden"
  onWheel={handleContentScroll}
  style={{
    touchAction: 'pan-y pinch-zoom',
  }}
>
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
</div>
```

## Constants and Types

```typescript
type SheetState = 'closed' | 'half' | 'full';
type TabType = 'timeline' | 'insights' | 'gallery';

interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ReactNode;
  expandsTo: SheetState;
}

const SNAP_POINTS: Record<SheetState, number> = {
  closed: 0.08,  // ~60px - handle only
  half: 0.4,     // 40% - timeline preview
  full: 0.9,     // 90% - full content
};

const TABS: TabConfig[] = [
  { 
    id: 'timeline', 
    label: 'Timeline', 
    icon: <Map className="w-5 h-5" />, 
    expandsTo: 'half' 
  },
  { 
    id: 'insights', 
    label: 'Insights', 
    icon: <BarChart3 className="w-5 h-5" />, 
    expandsTo: 'full' 
  },
  { 
    id: 'gallery', 
    label: 'Gallery', 
    icon: <ImageIcon className="w-5 h-5" />, 
    expandsTo: 'full' 
  },
];
```

## Component State

```typescript
const [activeTabIndex, setActiveTabIndex] = useState(0);
const [sheetState, setSheetState] = useState<SheetState>('closed');
const sheetRef = useRef<HTMLDivElement>(null);
```

## Memoized Data Calculations

```typescript
const stats: JourneyStats = useMemo(() => {
  const countries = new Set<string>();
  const cities = new Set<string>();
  let totalPhotos = 0;
  let firstDate: Date | null = null;
  let lastDate: Date | null = null;

  places.forEach((place) => {
    if (place.address?.country) countries.add(place.address.country);
    if (place.address?.city) cities.add(place.address.city);
    totalPhotos += place.photos?.length || 0;

    if (place.visitDate?.seconds) {
      const date = new Date(place.visitDate.seconds * 1000);
      if (!firstDate || date < firstDate) firstDate = date;
      if (!lastDate || date > lastDate) lastDate = date;
    }
  });

  return {
    totalPlaces: places.length,
    totalPhotos,
    totalDistance: 0,
    countriesVisited: countries.size,
    citiesVisited: cities.size,
    firstTripDate: firstDate,
    lastTripDate: lastDate,
  };
}, [places]);

const placeFrequencies: PlaceFrequency[] = useMemo(() => {
  const countryMap: Record<string, number> = {};
  places.forEach((place) => {
    const country = place.address?.country || 'Unknown';
    countryMap[country] = (countryMap[country] || 0) + 1;
  });

  return Object.entries(countryMap)
    .map(([country, count]) => ({
      country,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}, [places]);

const galleryPhotos: GalleryPhoto[] = useMemo(() => {
  const photos: GalleryPhoto[] = [];
  places.forEach((place) => {
    place.photos?.forEach((photo) => {
      photos.push({
        id: photo.id,
        url: photo.url,
        thumbnailUrl: photo.thumbnailUrl || photo.url,
        placeId: place.id,
        placeTitle: place.title,
        width: photo.width || 400,
        height: photo.height || 400,
      });
    });
  });
  return photos;
}, [places]);
```

## Content Renderer

```typescript
const renderTabContent = () => {
  switch (activeTab.id) {
    case 'timeline':
      return (
        <TimelineTab
          places={places}
          selectedPlaceId={selectedPlaceId}
          onPlaceSelect={onPlaceSelect}
          onPlaceDelete={onPlaceDelete}
          onPlaceEdit={onPlaceEdit}
        />
      );
    case 'insights':
      return (
        <InsightsTab
          stats={stats}
          placeFrequencies={placeFrequencies}
        />
      );
    case 'gallery':
      return (
        <GalleryTab
          photos={galleryPhotos}
        />
      );
    default:
      return null;
  }
};
```

---

## File Structure Overview

```
JourneyHub.tsx (353 lines)
├── Imports & Types (35 lines)
├── Constants (15 lines)
├── Component Function (303 lines)
│   ├── State Management (5 lines)
│   ├── Memoized Data (70 lines)
│   ├── Gesture Handlers (50 lines)
│   ├── Render Logic (40 lines)
│   └── JSX Structure (138 lines)
│       ├── Motion Container
│       ├── Glassmorphism Background
│       ├── Grab Handle
│       ├── Tab Bar
│       ├── Content Carousel
│       └── Safe Area Padding
└── Export (1 line)
```

---

This file contains all the core snippets you need to understand the complete JourneyHub implementation. Copy and paste any section into your project as needed!
