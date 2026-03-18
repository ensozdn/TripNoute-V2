# 🗺️ Travel OS Component Architecture

## Component Hierarchy

```
JourneyHub.tsx
├── [Activity Tab]
├── [Explore Tab] ──────────────────────┐
│   └── TravelOSExplore.tsx              │  🎯 NEW TRAVEL OS
│       ├── Hero Header                  │
│       │   ├── Sparkles Icon            │
│       │   ├── Title + Subtitle         │
│       │   └── LivePastToggle.tsx       │
│       │       ├── Live Button          │
│       │       │   └── Live Counter     │
│       │       └── Past Button          │
│       ├── CategoryFilter.tsx           │
│       │   ├── All Journeys             │
│       │   ├── Road Trip (Car)          │
│       │   ├── Backpacking (Backpack)   │
│       │   ├── Sailing (Sailboat)       │
│       │   ├── Flight (Plane)           │
│       │   ├── Cycling (Bike)           │
│       │   └── Rail (Train)             │
│       └── Feed Grid (2 cols)           │
│           └── TripCard.tsx (mapped)    │
│               ├── Mapbox Preview       │
│               │   └── Route Path       │
│               ├── Top Overlay (Glass)  │
│               │   ├── User Avatar      │
│               │   ├── User Name        │
│               │   └── Live Badge       │
│               ├── Bottom Overlay       │
│               │   ├── Trip Title       │
│               │   └── Metadata Pills   │
│               │       ├── Distance     │
│               │       ├── Duration     │
│               │       └── Location     │
│               └── Content Section      │
│                   ├── Action Bar       │
│                   │   ├── Heart        │
│                   │   ├── Comment      │
│                   │   └── Bookmark     │
│                   ├── Likes Count      │
│                   ├── Caption          │
│                   └── Timestamp        │
└── [Notifications Tab]
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    TravelOSExplore                          │
│  State: posts[], loading, activeCategory, feedMode          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ useEffect(category, feedMode)
                     ▼
           ┌──────────────────────┐
           │  ExploreService      │
           │  .getExploreFeed()   │
           └──────────┬───────────┘
                      │
                      │ Firestore Query
                      ▼
           ┌──────────────────────┐
           │   posts collection   │
           │  + likes + saves     │
           └──────────┬───────────┘
                      │
                      │ PostWithEngagement[]
                      ▼
           ┌──────────────────────┐
           │    posts.map()       │
           └──────────┬───────────┘
                      │
                      ▼
           ┌──────────────────────┐
           │      TripCard        │
           │  + Mapbox Static URL │
           └──────────────────────┘
```

---

## Animation Choreography

```
⏱️ Timeline (per card):

0ms:    initial state { opacity: 0, y: 20, scale: 0.98 }
        │
        ├─ Card appears below viewport
        │
80ms:   animate start (index * 0.08s delay)
        │
        ├─ opacity: 0 → 1
        ├─ y: 20px → 0
        └─ scale: 0.98 → 1
        │
580ms:  animation complete
        │
        └─ Card fully visible and interactive

On Hover:
        │
        ├─ Map image: scale 1 → 1.08 (600ms)
        ├─ Card shadow: lg → xl
        └─ Smooth easeOut transition
```

---

## Glassmorphism Effect Breakdown

### **Dark Overlay (Top - User Info)**
```css
background: rgba(0, 0, 0, 0.3)       /* 30% black */
backdrop-filter: blur(40px)          /* Strong blur */
border: 1px solid rgba(255,255,255,0.1) /* Subtle border */
```

### **Light Overlay (Bottom - Metadata)**
```css
background: rgba(255, 255, 255, 0.15)  /* 15% white */
backdrop-filter: blur(64px)            /* Extra strong blur */
border: 1px solid rgba(255,255,255,0.2) /* Visible border */
box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5) /* Deep shadow */
```

### **Metadata Pills**
```css
background: rgba(255, 255, 255, 0.2)  /* 20% white */
backdrop-filter: blur(32px)           /* Medium blur */
padding: 4px 10px
border-radius: 8px
```

---

## Mapbox Static API URL Structure

```
https://api.mapbox.com/styles/v1/
  mapbox/dark-v11/                    # Dark theme style
  static/
    path-5+3b82f6-0.8(lng1,lat1,...), # Route path (5px width, blue, 80% opacity)
    pin-s-a+3b82f6(lng1,lat1),        # Start marker (small, label 'a', blue)
    pin-s-b+ef4444(lng2,lat2)         # End marker (small, label 'b', red)
  /centerLng,centerLat,zoom,bearing/  # Camera position (z=5, bearing=0)
  600x400@2x                          # Size + retina
  ?access_token=pk.ey...
```

**Parameters Explained:**
- `path-5`: 5px line width
- `+3b82f6`: Hex color (blue #3b82f6)
- `-0.8`: 80% opacity
- `pin-s`: Small marker size
- `@2x`: Retina resolution (1200x800 actual pixels)

---

## Responsive Behavior

### **Desktop (≥768px)**
```
┌─────────────────────────────────────────────┐
│  Travel OS Header (Sticky)                  │
│  ├── Logo + Title                           │
│  ├── Live/Past Toggle (centered)            │
│  └── Category Pills (scroll)                │
├─────────────────────────────────────────────┤
│  Feed Grid (2 columns)                      │
│  ┌──────────────┐  ┌──────────────┐        │
│  │  TripCard 1  │  │  TripCard 2  │        │
│  │  [Map+Glass] │  │  [Map+Glass] │        │
│  └──────────────┘  └──────────────┘        │
│  ┌──────────────┐  ┌──────────────┐        │
│  │  TripCard 3  │  │  TripCard 4  │        │
│  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────┘
```

### **Mobile (<768px)**
```
┌─────────────────────┐
│  Travel OS Header   │
│  ├── Title          │
│  ├── Toggle         │
│  └── Categories     │
├─────────────────────┤
│  Feed (1 column)    │
│  ┌─────────────────┐│
│  │   TripCard 1    ││
│  │   [Map+Glass]   ││
│  └─────────────────┘│
│  ┌─────────────────┐│
│  │   TripCard 2    ││
│  └─────────────────┘│
│  ┌─────────────────┐│
│  │   TripCard 3    ││
│  └─────────────────┘│
└─────────────────────┘
```

---

## State Management Flow

```typescript
// Filter changes trigger reload
useEffect(() => {
  loadPosts(); // Fetch filtered data
}, [activeCategory, feedMode]);

// Like toggle uses optimistic updates
const handleLikeToggle = async (postId) => {
  // 1. Update UI immediately
  setLikedPosts(...)
  setPosts(...)
  
  // 2. Call backend
  try {
    await exploreService.likePost(...)
  } catch {
    // 3. Rollback on error
    setLikedPosts(revert)
    setPosts(revert)
  }
};
```

---

## Browser Compatibility

### **Glassmorphism (backdrop-filter)**
✅ Chrome 76+
✅ Safari 9+
✅ Firefox 103+
✅ Edge 79+

### **Framer Motion Animations**
✅ All modern browsers with hardware acceleration
✅ Graceful degradation on older devices

### **Mapbox Static API**
✅ Works everywhere (simple image URLs)
✅ No JavaScript required on client
✅ Fast loading with CDN

---

**Implementation Date**: March 18, 2026
**Framework**: Next.js 16.1.1 (App Router + Turbopack)
**Design System**: Tailwind CSS v4 + Framer Motion
**Status**: ✅ Core implementation complete, awaiting data integration
