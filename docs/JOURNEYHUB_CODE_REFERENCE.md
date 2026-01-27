# JourneyHub Refactor - Code Reference & Implementation Details

**Date:** January 27, 2026  
**File:** `src/components/journey/JourneyHub.tsx`  
**Type:** Gesture-Based Bottom Sheet Component

---

## 📖 Quick Reference

### Type Definitions

```typescript
type SheetState = 'closed' | 'half' | 'full';

interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ReactNode;
  expandsTo: SheetState; // Which state this tab auto-expands to
}

interface JourneyHubProps {
  places: Place[];
  selectedPlaceId?: string | null;
  onPlaceSelect: (place: Place) => void;
  onPlaceDelete?: (placeId: string) => Promise<void>;
  onPlaceEdit?: (place: Place) => void;
}
```

### Constants

```typescript
const SNAP_POINTS: Record<SheetState, number> = {
  closed: 0.08,  // ~60px - handle only
  half: 0.4,     // 40% of viewport
  full: 0.9,     // 90% of viewport
};

const TABS: TabConfig[] = [
  { 
    id: 'timeline', 
    label: 'Timeline', 
    icon: <Map className="w-5 h-5" />, 
    expandsTo: 'half'  // Quick browse mode
  },
  { 
    id: 'insights', 
    label: 'Insights', 
    icon: <BarChart3 className="w-5 h-5" />, 
    expandsTo: 'full'  // Needs full screen for charts
  },
  { 
    id: 'gallery', 
    label: 'Gallery', 
    icon: <ImageIcon className="w-5 h-5" />, 
    expandsTo: 'full'  // Needs full screen for photos
  },
];
```

---

## 🔧 Component State

```typescript
// Active tab index (0-2)
const [activeTabIndex, setActiveTabIndex] = useState(0);

// Current sheet state
const [sheetState, setSheetState] = useState<SheetState>('closed');

// Reference to sheet container (for measurements if needed)
const sheetRef = useRef<HTMLDivElement>(null);
```

---

## 🎬 Gesture Handling

### Drag Handler Logic

```typescript
const handleDrag = (
  _event: MouseEvent | TouchEvent | PointerEvent,
  info: { offset: { y: number }; velocity: { y: number } }
) => {
  // Get current and new heights
  const viewportHeight = window.innerHeight;
  const currentHeight = SNAP_POINTS[sheetState] * viewportHeight;
  const newHeight = currentHeight - info.offset.y;  // Negative y = upward drag
  const newHeightRatio = newHeight / viewportHeight;

  let nextState: SheetState = sheetState;

  // VELOCITY-BASED SNAPPING (fast gestures)
  // Fast upward swipe (velocity < -300px/s) → expand
  if (info.velocity.y < -300) {
    if (sheetState === 'closed') nextState = 'half';
    else if (sheetState === 'half') nextState = 'full';
    // Already at 'full', stay at 'full'
  }
  // Fast downward swipe (velocity > 300px/s) → collapse
  else if (info.velocity.y > 300) {
    if (sheetState === 'full') nextState = 'half';
    else if (sheetState === 'half') nextState = 'closed';
    // Already at 'closed', stay at 'closed'
  }
  // POSITION-BASED SNAPPING (slow drags)
  // Snap to nearest state based on current position
  else {
    if (newHeightRatio > 0.65) {
      nextState = 'full';  // Over 65% → full
    } else if (newHeightRatio > 0.2) {
      nextState = 'half';  // Between 20-65% → half
    } else {
      nextState = 'closed';  // Under 20% → closed
    }
  }

  setSheetState(nextState);
};
```

### Tab Click Handler

```typescript
const handleTabClick = (tabIndex: number) => {
  // Update active tab
  setActiveTabIndex(tabIndex);
  
  // Get the preferred expansion height for this tab
  const expandsTo = TABS[tabIndex].expandsTo;
  
  // Auto-expand to that height
  setSheetState(expandsTo);
};
```

---

## 🎨 Render Structure

### Main Sheet Container

```tsx
<motion.div
  ref={sheetRef}
  initial={{ y: '100%', opacity: 0 }}
  animate={{
    y: 0,
    opacity: 1,
    height: `${sheetHeightPercent * 100}vh`,  // Dynamic based on state
    transition: {
      type: 'spring',
      damping: 25,      // Moderate bounce
      stiffness: 200,   // Quick response
      mass: 1,
    },
  }}
  drag="y"  // Only vertical dragging
  dragElastic={0.1}
  dragConstraints={{ top: 0, bottom: 0 }}
  onDrag={handleDrag}
  className="fixed bottom-0 left-0 right-0 z-40 flex flex-col rounded-t-3xl"
  style={{
    touchAction: 'none',  // Prevent browser default touch behavior
  }}
>
  {/* Content goes here */}
</motion.div>
```

### Glassmorphism Background Layer

```tsx
<div className="absolute inset-0 
  bg-gradient-to-b from-black/40 via-black/30 to-black/20 
  backdrop-blur-2xl 
  border-t border-white/10 
  rounded-t-3xl" 
/>
```

**Explanation:**
- `absolute inset-0`: Covers entire container
- `bg-gradient-to-b`: Vertical gradient for depth
- `from-black/40 via-black/30 to-black/20`: Opacity gradient (40% → 30% → 20%)
- `backdrop-blur-2xl`: Frosted glass effect on background
- `border-t border-white/10`: Subtle white line at top edge
- `rounded-t-3xl`: Rounded top corners (native iOS style)

### Grab Handle

```tsx
<motion.div
  className="relative z-10 flex justify-center py-2"
  animate={{ opacity: [0.5, 0.7, 0.5] }}
  transition={{ duration: 2, repeat: Infinity }}
>
  <div className="w-12 h-1.5 rounded-full bg-white/40 cursor-grab active:cursor-grabbing" />
</motion.div>
```

**Details:**
- `opacity: [0.5, 0.7, 0.5]`: Breathing animation
- `duration: 2, repeat: Infinity`: 2-second cycle, continuous
- `w-12 h-1.5`: 12px × 1.5px (subtle pill shape)
- `cursor-grab`: Shows hand cursor on hover
- `cursor-grabbing`: Shows closed fist when dragging

### Tab Bar Section

```tsx
<div className="relative z-10 flex items-center border-b border-white/5 px-4 pb-0">
  {/* Tab Buttons with Click Handlers */}
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
        onClick={() => handleTabClick(index)}  // ← Auto-expands!
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
      x: `${activeTabIndex * 100}%`,  // Moves 0%, 100%, 200%
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

### Content Area (Scrollable)

```tsx
<div
  className="relative z-10 flex-1 min-h-0 overflow-hidden"
  onWheel={handleContentScroll}
  style={{
    touchAction: 'pan-y pinch-zoom',  // Allow vertical scroll, not horizontal drag
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

---

## 📊 Data Memoization

All expensive calculations are memoized to prevent unnecessary re-renders:

```typescript
// Journey statistics (countries, cities, photos, dates)
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
}, [places]);  // Only recalculate when 'places' changes

// Country frequency for charts
const placeFrequencies: PlaceFrequency[] = useMemo(() => {
  const countryMap: Record<string, number> = {};
  places.forEach((place) => {
    const country = place.address?.country || 'Unknown';
    countryMap[country] = (countryMap[country] || 0) + 1;
  });

  return Object.entries(countryMap)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count);
}, [places]);

// Flattened photo array from all places
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

---

## 🎯 Key Improvements Over Previous Version

| Aspect | Before | After |
|--------|--------|-------|
| **States** | 2 (peek, expanded) | 3 (closed, half, full) |
| **Default Visibility** | 40% height | 8% height (closed) |
| **Tab Behavior** | Manual swiping | Click auto-expands |
| **Timeline Access** | Full screen only | Quick 40% preview |
| **Dragging** | Full drag + swipe | Vertical drag only |
| **Map Visibility** | Limited in peek | Full in closed/half |
| **Blur Effect** | backdrop-blur-xl | backdrop-blur-2xl |
| **Handle Style** | w-10 h-1 | w-12 h-1.5 (larger) |

---

## 🚀 Performance Considerations

1. **Memoization:** Stats, frequencies, and photos only recalculate when `places` array changes
2. **AnimatePresence:** `mode="wait"` prevents overlapping animations
3. **Touch Actions:** CSS prevents browser calculating unnecessary scroll metrics
4. **Spring Physics:** Damping/stiffness tuned for smooth 60fps animations
5. **Ref Usage:** `sheetRef` doesn't trigger re-renders

---

## 🧪 Testing the Component

### Test Case 1: Three States

```typescript
// Initial load → closed
expect(sheetState).toBe('closed');

// Drag handle up → half
user.drag(handle, { y: -100 });
expect(sheetState).toBe('half');

// Click Insights → full
user.click(insightsButton);
expect(sheetState).toBe('full');
```

### Test Case 2: Velocity-Based Snapping

```typescript
// Fast upward swipe → expand
user.drag(handle, { y: -200, velocity: -400 });
expect(sheetState).toBe('half');

// Fast downward swipe → collapse
user.drag(handle, { y: 200, velocity: 400 });
expect(sheetState).toBe('closed');
```

### Test Case 3: Tab Auto-Expansion

```typescript
// Click Timeline → half
user.click(timelineTab);
expect(sheetState).toBe('half');

// Click Gallery → full
user.click(galleryTab);
expect(sheetState).toBe('full');
```

---

## 🎓 Learning Resources

### Key Framer Motion Concepts Used

1. **`drag="y"`** - Only vertical dragging (not horizontal)
2. **`onDrag` callback** - Receives offset and velocity info
3. **Spring animation** - `damping` and `stiffness` for physics
4. **AnimatePresence** - Manages enter/exit animations
5. **`mode="wait"`** - Waits for exit before entering

### CSS Concepts

1. **`touchAction`** - Controls browser's touch behavior
2. **`backdrop-filter`** - Applies blur to background
3. **Viewport units** - `vh` for height as % of screen
4. **CSS gradients** - Multi-stop gradients for depth

---

**Status:** ✅ Complete and documented  
**Ready for:** Production deployment
