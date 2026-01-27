# Visual Diagrams - JourneyHub Architecture

## 1. STATE DIAGRAM

```
                    ┌─────────────┐
                    │   CLOSED    │
                    │  (8% = ~60) │
                    └──────┬──────┘
                           │
         drag_up(-300)      │      click_timeline
         OR                 │      
         position > 65%      │      
                           ▼
                    ┌─────────────┐
                    │    HALF     │
                    │  (40% high) │
                    └──────┬──────┘
                           │
         drag_up(-300)      │      click_insights
         OR                 │      click_gallery
         position > 65%      │      
                           ▼
                    ┌─────────────┐
                    │    FULL     │
                    │  (90% high) │
                    └──────┬──────┘
                           │
         drag_down(300)     │
         OR                 │
         position < 20%     │
                           ▼
                    (back to HALF)
```

## 2. COMPONENT HIERARCHY

```
JourneyHub (motion.div - draggable container)
│
├── Glassmorphism Layer (absolute, inset-0)
│   ├── Gradient Background
│   ├── Backdrop Blur (2xl)
│   ├── Border Accent
│   └── Rounded Corners
│
├── Grab Handle (motion.div with breathing animation)
│   └── Pill-shaped element (w-12 h-1.5)
│
├── Tab Bar
│   ├── Tab Buttons (motion.button × 3)
│   │   ├── Timeline Icon + Label
│   │   ├── Insights Icon + Label
│   │   └── Gallery Icon + Label
│   │
│   └── Underline Indicator (motion.div)
│       └── Animated position (x: activeTabIndex × 100%)
│
├── Content Area (overflow-y-auto, touchAction pan-y)
│   │
│   └── AnimatePresence (mode="wait")
│       │
│       └── motion.div (carousel container)
│           │
│           └── Active Tab Content
│               ├── TimelineTab (places, handlers)
│               ├── InsightsTab (stats, frequencies)
│               └── GalleryTab (photos, lightbox)
│
└── Safe Area Padding (h-safe)
```

## 3. DRAG GESTURE DECISION TREE

```
User drags handle
     │
     ├─ Velocity < -300 (fast UP)
     │  │
     │  ├─ Current state: CLOSED → Go to HALF
     │  ├─ Current state: HALF  → Go to FULL
     │  └─ Current state: FULL  → Stay FULL
     │
     ├─ Velocity > 300 (fast DOWN)
     │  │
     │  ├─ Current state: CLOSED → Stay CLOSED
     │  ├─ Current state: HALF   → Go to CLOSED
     │  └─ Current state: FULL   → Go to HALF
     │
     └─ Velocity between -300 and 300 (slow drag)
        │
        ├─ Height > 65% → Go to FULL
        ├─ Height 20-65% → Go to HALF
        └─ Height < 20% → Go to CLOSED
```

## 4. TAB CLICK AUTO-EXPANSION

```
User clicks a tab
     │
     ├─ Timeline Tab
     │  └─ Auto-expand to HALF (40% height)
     │     └─ Perfect for quick timeline browsing
     │
     ├─ Insights Tab
     │  └─ Auto-expand to FULL (90% height)
     │     └─ Charts need full screen space
     │
     └─ Gallery Tab
        └─ Auto-expand to FULL (90% height)
           └─ Photos need full screen display
```

## 5. SCREEN STATE COMPARISON

### CLOSED State (8% height)
```
┌─────────────────────────────────┐
│ [═] [🗺️] [📊] [📸]               │ ← Grab Handle + Tab Bar
├─────────────────────────────────┤
│                                 │
│                                 │
│      MAPBOX MAP                 │ ← 92% Visible
│      (Fully Interactive)        │
│                                 │
│                                 │
│                                 │
└─────────────────────────────────┘
```

### HALF State (40% height)
```
┌─────────────────────────────────┐
│ [═] [🗺️] [📊] [📸]               │ ← Grab Handle + Tab Bar
├─────────────────────────────────┤
│ Timeline Item 1                 │
│ Timeline Item 2                 │ ← Content Preview (Scrollable)
│ Timeline Item 3                 │
├─────────────────────────────────┤
│                                 │
│                                 │
│      MAPBOX MAP                 │ ← 60% Visible
│      (Partially Interactive)    │
│                                 │
│                                 │
└─────────────────────────────────┘
```

### FULL State (90% height)
```
┌─────────────────────────────────┐
│ [═] [🗺️] [📊] [📸]               │ ← Grab Handle + Tab Bar
├─────────────────────────────────┤
│ Full Content Display            │
│ (All data visible)              │
│                                 │
│ Timeline:                       │
│ • All items scrollable          │
│ • Full details                  │
│                                 │
│ OR                              │
│                                 │
│ Insights:                       │
│ • Full charts                   │
│ • All statistics                │
│                                 │
│ OR                              │
│                                 │
│ Gallery:                        │
│ • Full photo grid               │
│ • Lightbox enabled              │
│                                 │
├─────────────────────────────────┤
│ MAP                             │ ← 10% Visible (small corner)
└─────────────────────────────────┘
```

## 6. ANIMATION TIMELINE

```
Initial Load
     │
     ├─ Initial: y: '100%', opacity: 0
     │
     └─ Animate: y: 0, opacity: 1
        with Spring Physics
        (damping: 25, stiffness: 200)
              │
              ▼
        Sheet slides up from bottom
        with realistic bouncy feel
              │
              ▼
        Settles at CLOSED state
        (shows grab handle + tab bar)
```

## 7. SPRING PHYSICS TUNING

```
                     SPRING RESPONSE CHART
                          
        Position ▲
                 │     
            100% │        ╱╲ ← Oscillates slightly
                 │      ╱    ╲  
             50% │    ╱        ╲
                 │  ╱            ╲
              0% │╱              └ ← Settles to final position
                 └────────────────────────▶ Time
                
        Settings:
        damping: 25    ← Controls oscillation
        stiffness: 200 ← Controls responsiveness
        mass: 1        ← Affects momentum
        
        Result: Medium bouncy, quick response
```

## 8. TOUCH ACTION ZONES

```
┌─────────────────────────────────────────┐
│           Sheet Container               │
│  touchAction: 'none'                    │ ← No browser drag behavior
│  ┌─────────────────────────────────────┐│
│  │ Grab Handle (draggable area)        ││
│  │ ← Perfect for initiating drag       ││
│  └─────────────────────────────────────┘│
│  ┌─────────────────────────────────────┐│
│  │ Tab Bar (interactive buttons)       ││
│  │ ← Click to trigger auto-expand      ││
│  └─────────────────────────────────────┘│
│  ┌─────────────────────────────────────┐│
│  │ Content Area                        ││
│  │ touchAction: 'pan-y pinch-zoom'     ││
│  │ ← Vertical scrolling works          ││
│  │ ← Pinch-zoom for photos             ││
│  │ ← No horizontal drag conflicts      ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

## 9. MEMOIZATION DEPENDENCY CHAIN

```
'places' array changes
        │
        ├─ Triggers useMemo(stats, [places])
        │  └─ Recalculates countries, cities, photos, dates
        │
        ├─ Triggers useMemo(placeFrequencies, [places])
        │  └─ Recalculates country frequency counts
        │
        └─ Triggers useMemo(galleryPhotos, [places])
           └─ Recalculates flattened photo array

No change to 'places' array
        │
        └─ Memoized values preserved
           (no unnecessary calculations)
```

## 10. USER INTERACTION FLOW

```
┌──────────────────────────────────────────────────────────┐
│ USER FLOW: Complete Journey Through States              │
└──────────────────────────────────────────────────────────┘

1. Page Loads
   └─ Sheet starts at CLOSED
      (grab handle + tabs visible)
              │
              ▼
2. User Drag Scenario A: Drag Handle Up
   └─ Sheet expands with spring animation
      (smooth, bouncy feel)
              │
              ▼
3. Sheet Reaches HALF
   (40% height, timeline preview visible)
              │
              ├─ User sees first few timeline items
              ├─ Can scroll to see more
              └─ Map still 60% visible behind
              │
              ▼
4. User Click Scenario B: Click Insights Tab
   └─ Tab button highlights with scale animation
      Auto-expands to FULL state
              │
              ▼
5. Sheet Expands to FULL (90%)
   ├─ Insights content displayed
   ├─ Charts fully visible
   ├─ Can scroll for more stats
   └─ Map mostly hidden
              │
              ▼
6. User Drag Scenario C: Drag Down Slowly
   └─ Sheet snaps to nearest state
      Based on position (60% threshold)
              │
              ├─ If 60%+ moved → back to FULL
              ├─ If 20-60% moved → back to HALF
              └─ If <20% moved → collapse to CLOSED
              │
              ▼
7. User Drag Scenario D: Fast Downward Swipe
   └─ Velocity-based snapping triggered
      (velocity > 300px/s)
              │
              ├─ From FULL → goes to HALF
              ├─ From HALF → goes to CLOSED
              └─ Feels responsive to gesture
              │
              ▼
8. Sheet Back at CLOSED
   └─ Ready for next interaction
```

## 11. GLASSMORPHISM LAYERS

```
┌─ Top Layer: Content & UI ─────────────────┐
│ • Text, Buttons, Icons                     │
│ • z-index: 10                              │
└────────────────────────────────────────────┘
        ▲
        │ (visible through)
┌─ Middle Layer: Glassmorphism Effect ──────┐
│ • backdrop-blur-2xl (frosted glass)        │
│ • Gradient opacity: 40% → 30% → 20%        │
│ • Border accent: white/10                  │
│ • z-index: 0 (absolute)                    │
└────────────────────────────────────────────┘
        ▼
        │ (visible through blur)
┌─ Bottom Layer: Mapbox Map ─────────────────┐
│ • Interactive map                          │
│ • z-index: 30 (below sheet z-40)          │
│ • Visible based on sheet height            │
└────────────────────────────────────────────┘
```

## 12. PERFORMANCE OPTIMIZATION FLOW

```
Component Renders
     │
     ├─ Check 'places' prop changed?
     │  │
     │  ├─ YES → Recalculate memoized values
     │  │     (stats, frequencies, photos)
     │  │
     │  └─ NO → Use cached values
     │
     ├─ Check 'activeTabIndex' changed?
     │  │
     │  └─ YES → Re-render tab buttons & indicator
     │
     ├─ Check 'sheetState' changed?
     │  │
     │  └─ YES → Animate to new height
     │
     └─ Spring animation calculates each frame
        (60fps target, smooth transitions)
```

---

These diagrams provide visual representation of the architecture, state management, gesture handling, and user interactions in the refactored JourneyHub component.
