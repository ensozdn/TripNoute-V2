# 🏅 Premium Medallion Icons - Visual Diagrams

ASCII diagrams and visual explanations for the medallion system.

---

## 🗺️ Map Overview

```
┌─────────────────────────────────────────────────────────────┐
│                  TRIPNOUTE MAP VIEW                         │
│                                                             │
│                                                             │
│         London ●━━━━━━━━━ ✈️ ━━━━━━━━━● Paris           │
│                      (Flight)                               │
│                                                             │
│                                                             │
│                    Paris ●═══ 🚂 ═══● Amsterdam           │
│                          (Train)                            │
│                                                             │
│                                                             │
│              Amsterdam ●─── 🚴 ───● Rotterdam              │
│                           (Bike)                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Legend:
● = Journey stop marker (colored circle)
━ = Flight route (dashed, cyan)
═ = Train route (dashed, blue)
─ = Bike route (solid, green)
✈️🚂🚴 = Transport medallions (white bg + colored icon)
```

---

## 🎯 Medallion Anatomy

```
┌────────────────────────────────────────┐
│   MEDALLION STRUCTURE (EXPLODED VIEW)  │
└────────────────────────────────────────┘

Layer Stack (bottom to top):
┌─────────────────────────┐
│                         │  ← 4. Halo Effect (journey color)
│     ┌─────────────┐     │     - Width: 2px
│     │             │     │     - Blur: 1px
│     │  ┌───────┐  │     │     - Color: journey.color
│     │  │       │  │     │
│     │  │  ✈️   │  │     │  ← 3. Icon (colored, rotated)
│     │  │       │  │     │     - Size: 0.6 scale
│     │  └───────┘  │     │     - Rotation: bearing angle
│     │             │     │
│     └─────────────┘     │  ← 2. White Background Circle
│                         │     - Radius: 18px
│                         │     - Color: #ffffff
└─────────────────────────┘     - Opacity: 0.98
                                 - Border: 2px #e5e7eb

                            ← 1. Map (base layer)
```

---

## 📐 Midpoint Calculation Comparison

```
FLIGHT PATH (Arc Midpoint - Great Circle)
═════════════════════════════════════════

New York                                   London
   ●                                          ●
   │                                          │
   │        ╭─────────────╮                  │
   │    ╭───╯             ╰───╮              │
   └────╯        ✈️           ╰──────────────┘
           (Arc midpoint)

↑ Follows Earth's curvature
↑ More accurate for long distances (> 1000km)
↑ Uses Haversine formula


GROUND TRANSPORT (Straight Midpoint)
═════════════════════════════════════

Paris                          Amsterdam
  ●                                ●
  │                                │
  └────────── 🚂 ────────────────┘
         (Straight midpoint)

↑ Linear interpolation
↑ Sufficient for short/medium distances
↑ Simple calculation
```

---

## 🧭 Bearing & Rotation

```
COMPASS BEARINGS
════════════════

         N (0°)
          ↑
          │
    NW    │    NE
      ╲   │   ╱
       ╲  │  ╱
   W ────●──── E
  270°   │   90°
       ╱  │  ╲
      ╱   │   ╲
    SW    │    SE
          │
          ↓
        S (180°)


ICON ROTATION EXAMPLES
══════════════════════

London → Paris (SE direction, bearing: 146°)
   ●
    ╲
     ╲  ✈️ (rotated 146°)
      ╲
       ●

NYC → Boston (NE direction, bearing: 54°)
       ●
      ╱
  ✈️ (rotated 54°)
    ╱
   ●

Tokyo → LA (E direction, bearing: 90°)
   ● ────── ✈️ ────── ●
       (rotated 90°)
```

---

## 🎨 Transport Icon Gallery

```
┌──────────────────────────────────────────────────────────┐
│           TRANSPORT MEDALLION SHOWCASE                   │
└──────────────────────────────────────────────────────────┘

Flight (#4ECDC4 - Cyan)
╭─────────╮
│  ⚪️      │  Material airplane icon
│  ✈️      │  Rotates to follow path
│         │  Dashed route line
╰─────────╯

Car (#FF6B6B - Red)
╭─────────╮
│  ⚪️      │  Material car icon
│  🚗      │  Solid route line
│         │  Road trips
╰─────────╯

Bus (#FFA07A - Orange)
╭─────────╮
│  ⚪️      │  Material bus icon
│  🚌      │  Solid route line
│         │  Public transport
╰─────────╯

Train (#45B7D1 - Blue)
╭─────────╮
│  ⚪️      │  Material train icon
│  🚂      │  Dashed route line
│         │  Rail travel
╰─────────╯

Ship (#85C1E2 - Light Blue)
╭─────────╮
│  ⚪️      │  Material ship icon
│  ⛴️      │  Dashed route line
│         │  Sea voyage
╰─────────╯

Walk (#95E1D3 - Mint)
╭─────────╮
│  ⚪️      │  Material walking icon
│  🚶      │  Dotted route line
│         │  Walking paths
╰─────────╯

Bike (#A8E6CF - Light Green)
╭─────────╮
│  ⚪️      │  Material bicycle icon
│  🚴      │  Solid route line
│         │  Cycling routes
╰─────────╯
```

---

## 🔄 Icon Loading Flow

```
┌─────────────────────────────────────────────────────┐
│            ICON PRE-LOADING SEQUENCE                │
└─────────────────────────────────────────────────────┘

START
  │
  ├─ Check if already loaded
  │     │
  │     ├─ YES → Skip
  │     └─ NO  → Continue
  │
  ├─ For each transport mode:
  │     │
  │     ├─ Create SVG with path + color
  │     │    <svg>
  │     │      <path d="..." fill="color"/>
  │     │    </svg>
  │     │
  │     ├─ Convert to Image object
  │     │    new Image(48, 48)
  │     │
  │     ├─ Encode as data URL
  │     │    data:image/svg+xml;charset=utf-8,...
  │     │
  │     ├─ Load image
  │     │    img.onload → success
  │     │    img.onerror → fail
  │     │
  │     └─ Add to Mapbox
  │          map.addImage('medallion-{mode}', img)
  │
  ├─ Wait for all icons (Promise.all)
  │
  ├─ Mark as loaded
  │     transportIconsLoaded = true
  │
END (Icons ready for rendering)


ERROR HANDLING
══════════════

Icon fails to load
  │
  ├─ Log error to console
  │     console.error('Failed to load...')
  │
  ├─ Continue with other icons
  │     (don't crash the map)
  │
  └─ Set loaded = true anyway
        (graceful degradation)
```

---

## 🎯 Medallion Rendering Pipeline

```
┌─────────────────────────────────────────────────────┐
│         MEDALLION RENDERING PIPELINE                │
└─────────────────────────────────────────────────────┘

INPUT: Journey with steps
  │
  ├─ Step 1: Preload icons
  │     await loadTransportIcons()
  │     ✅ All 8 icons ready
  │
  ├─ Step 2: Process segments
  │     For each step pair (i, i+1):
  │       │
  │       ├─ Check transportToNext
  │       │     null? → Skip
  │       │
  │       ├─ Calculate midpoint
  │       │     flight? → arc midpoint
  │       │     ground? → straight midpoint
  │       │
  │       ├─ Calculate bearing
  │       │     0-360° rotation angle
  │       │
  │       └─ Create GeoJSON feature
  │             { type: 'Point', coords, props }
  │
  ├─ Step 3: Create GeoJSON source
  │     {
  │       type: 'FeatureCollection',
  │       features: [...]
  │     }
  │
  ├─ Step 4: Add background layer (Circle)
  │     {
  │       type: 'circle',
  │       radius: 18,
  │       color: '#ffffff',
  │       ...
  │     }
  │
  ├─ Step 5: Add icon layer (Symbol)
  │     {
  │       type: 'symbol',
  │       icon-image: 'medallion-{mode}',
  │       icon-rotate: bearing,
  │       ...
  │     }
  │
  └─ Step 6: Register for cleanup
        layers → journeyLayers map
        source → journeySources set

OUTPUT: Medallions visible on map
```

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│              DATA FLOW ARCHITECTURE                 │
└─────────────────────────────────────────────────────┘

User Journey Data
  │
  ├─ Trip Object
  │    {
  │      id: 'trip-123',
  │      steps: [
  │        { coords: [lng1, lat1], transportToNext: 'flight' },
  │        { coords: [lng2, lat2], transportToNext: 'car' },
  │        ...
  │      ],
  │      color: '#3b82f6'
  │    }
  │
  ↓
MapboxService.renderJourney()
  │
  ├─ drawJourneyRoute()
  │    └─ Renders route lines
  │
  ├─ addJourneyStopMarkers()
  │    └─ Adds stop circles
  │
  └─ addTransportMedallions()
       │
       ├─ loadTransportIcons()
       │    └─ SVG → Image → map.addImage()
       │
       ├─ For each segment:
       │    │
       │    ├─ calculateMidpoint()
       │    │    └─ [lng, lat]
       │    │
       │    ├─ calculateBearing()
       │    │    └─ 0-360°
       │    │
       │    └─ Create feature
       │         └─ { Point, props }
       │
       ├─ Create GeoJSON source
       │    └─ medallions-{id}
       │
       ├─ Add background layer
       │    └─ medallions-bg-{id}
       │
       └─ Add icon layer
            └─ medallions-icon-{id}

  ↓
Mapbox GL JS Map
  │
  ├─ Renders layers
  ├─ Applies styling
  ├─ Handles rotation
  └─ Displays medallions

  ↓
User sees:
  ● Route lines
  ● Stop markers
  ● Transport medallions with icons
```

---

## 🎬 Animation & Interaction

```
ZOOM BEHAVIOR
═════════════

Zoom Level 1-3 (World view)
  ├─ Medallions: Small (0.6 scale)
  └─ Icons: Clearly visible

Zoom Level 4-8 (Country view)
  ├─ Medallions: Medium (0.6 scale)
  └─ Icons: Full detail

Zoom Level 9+ (City view)
  ├─ Medallions: Large (0.6 scale)
  └─ Icons: Maximum clarity


ROTATION BEHAVIOR
═════════════════

Map rotates clockwise
  │
  ├─ Medallion position: Fixed on map
  │    (stays at midpoint)
  │
  └─ Icon rotation: Follows bearing
       (always points in route direction)


HOVER INTERACTION
═════════════════

┌─────────╮
│  ⚪️      │  ← Normal state
│  ✈️      │
└─────────┘

(No hover effect yet)
(Future: pulse animation)
```

---

## 🏗️ Layer Stack Visualization

```
┌─────────────────────────────────────────────────────┐
│              MAPBOX LAYER STACK                     │
└─────────────────────────────────────────────────────┘

TOP LAYERS (Highest z-index)
  │
  ├─ medallions-icon-trip-1      (Symbol - icons)
  ├─ medallions-bg-trip-1        (Circle - backgrounds)
  ├─ journey-layer-trip-1-0      (Line - routes)
  ├─ journey-layer-trip-1-1
  │
  ├─ medallions-icon-trip-2
  ├─ medallions-bg-trip-2
  ├─ journey-layer-trip-2-0
  │
  ├─ (User location marker)
  ├─ (Place markers)
  │
BASE LAYERS (Lowest z-index)
  └─ Mapbox dark-v11 style

SOURCES
═══════
  ├─ medallions-trip-1 (GeoJSON)
  ├─ medallions-trip-2 (GeoJSON)
  ├─ journey-source-trip-1 (GeoJSON)
  └─ journey-source-trip-2 (GeoJSON)
```

---

## 🔍 Debug Console Output

```
SUCCESSFUL MEDALLION RENDER
═══════════════════════════

🎨 Loading premium transport medallion icons...
  ✅ Loaded icon: medallion-flight (#4ECDC4)
  ✅ Loaded icon: medallion-car (#FF6B6B)
  ✅ Loaded icon: medallion-bus (#FFA07A)
  ✅ Loaded icon: medallion-train (#45B7D1)
  ✅ Loaded icon: medallion-ship (#85C1E2)
  ✅ Loaded icon: medallion-walk (#95E1D3)
  ✅ Loaded icon: medallion-walking (#95E1D3)
  ✅ Loaded icon: medallion-bike (#A8E6CF)
✨ All transport icons loaded successfully!

🎯 Creating premium medallions for journey: europe-tour-2026, steps: 4
  📍 Segment 0: flight from London → Paris, bearing: 146.8°
  📍 Segment 1: train from Paris → Amsterdam, bearing: 27.3°
  📍 Segment 2: bike from Amsterdam → Rotterdam, bearing: 185.6°
✨ Creating 3 premium medallion icons
✅ Premium medallion layers created: medallions-bg-europe-tour-2026, medallions-icon-europe-tour-2026


ERROR HANDLING EXAMPLE
══════════════════════

🎨 Loading premium transport medallion icons...
  ✅ Loaded icon: medallion-flight (#4ECDC4)
  ❌ Failed to load image data for car: Error: ...
  ✅ Loaded icon: medallion-bus (#FFA07A)
  ...
⚠️ Some transport icons failed to load: Error: ...
(Map continues to work with loaded icons)
```

---

## 📏 Size & Scale Reference

```
PIXEL DIMENSIONS
════════════════

Icon SVG: 48 x 48 px
  ↓
Scale: 0.6
  ↓
Rendered: ~29 x 29 px

Background Circle:
  Radius: 18px
  Diameter: 36px
  Border: 2px
  Total: 40px


RELATIVE SIZES
══════════════

┌───────────────────────────┐
│                           │  ← Stop marker (24-32px)
│    ●                      │
│                           │
│                           │
│          ╭─────╮          │  ← Medallion (36px bg + icon)
│          │ ✈️  │          │
│          ╰─────╯          │
│                           │
│                           │
│    ●                      │
│                           │
└───────────────────────────┘
```

---

## 🎯 Zoom Level Visualization

```
ZOOM 2 (World View)
═══════════════════
┌─────────────────────────────────┐
│         🌍                      │
│    ●─ ✈️ ─●                     │
│   tiny                          │
└─────────────────────────────────┘


ZOOM 6 (Country View)
═════════════════════
┌─────────────────────────────────┐
│                                 │
│    ●────── ✈️ ──────●          │
│   readable                      │
│                                 │
└─────────────────────────────────┘


ZOOM 12 (City View)
═══════════════════
┌─────────────────────────────────┐
│                                 │
│   ●━━━━━━━ ✈️ ━━━━━━━●        │
│        crystal clear            │
│                                 │
└─────────────────────────────────┘
```

---

**Visual Reference Complete!** 🎨

All diagrams show the medallion system architecture, data flow, and rendering pipeline in ASCII format for easy documentation and debugging.
