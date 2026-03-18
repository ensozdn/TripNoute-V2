# 🎨 Travel OS Visual Design Guide

## 🗺️ Trip Card Anatomy

```
┌─────────────────────────────────────────┐
│  ╔═══════════════════════════════════╗  │  ← Map Preview (h-80)
│  ║ ┌─────────────────────┐ ┌──────┐ ║  │     Mapbox Static API
│  ║ │ 👤 John Smith       │ │🔴Live│ ║  │     Dark theme with route path
│  ║ └─────────────────────┘ └──────┘ ║  │
│  ║                                   ║  │  ← Top Glass Overlay
│  ║      [Map with Route Path]       ║  │     bg-black/30 + blur-xl
│  ║                                   ║  │
│  ║ ┌─────────────────────────────┐  ║  │
│  ║ │ 🌍 Epic Road Trip           │  ║  │  ← Bottom Glass Overlay
│  ║ │ 🧭 2,450 km  📅 12 days     │  ║  │     bg-white/15 + blur-2xl
│  ║ │ 📍 Paris → Istanbul         │  ║  │     Metadata pills
│  ║ └─────────────────────────────┘  ║  │
│  ╚═══════════════════════════════════╝  │
├─────────────────────────────────────────┤
│  ❤️ 45   💬 12   🔖                    │  ← Action Bar
│                                         │
│  john_smith: Amazing adventure across   │  ← Caption
│  Europe! Visited 8 countries...         │
│                                         │
│  Mar 15, 2026                          │  ← Timestamp
└─────────────────────────────────────────┘
```

---

## 🎨 Glassmorphism Layers

### **Layer 1: Map Background (Opaque)**
```
████████████████████████████████████
████████████████████████████████████
████████  [Mapbox Dark Map]  ███████
████████████████████████████████████
████████████████████████████████████
```

### **Layer 2: Top Overlay (30% Black + Blur)**
```
┌─────────────────────────────┐
│ 👤 Username    🔴 Live       │  ← Glass effect
│ rgba(0,0,0,0.3) + blur(40px)│
└─────────────────────────────┘
```

### **Layer 3: Bottom Overlay (15% White + Blur)**
```
┌─────────────────────────────┐
│ 🌍 Title                    │
│ 🧭 2,450 km  📅 12 days     │  ← Glass effect
│ 📍 Location                 │  rgba(255,255,255,0.15)
└─────────────────────────────┘     + blur(64px)
```

### **Layer 4: Content Section (Solid White)**
```
┌─────────────────────────────┐
│ ❤️ 45   💬 12   🔖          │
│ Caption and metadata...     │  ← Solid bg-white
└─────────────────────────────┘
```

---

## 🎬 Animation Timeline

### **Card Entrance (500ms)**
```
Frame 0ms:   opacity: 0, y: 20px, scale: 0.98
             │
             │ Ease: [0.23, 1, 0.32, 1]
             ▼
Frame 500ms: opacity: 1, y: 0, scale: 1
             
Stagger:     Card N starts at (N * 80ms)
```

### **Hover Interaction (600ms)**
```
Mouse Enter:
  Map: scale 1.0 → 1.08 (600ms easeOut)
  Card: shadow-lg → shadow-xl

Mouse Leave:
  Map: scale 1.08 → 1.0 (600ms easeOut)
  Card: shadow-xl → shadow-lg
```

### **Like Animation (300ms)**
```
Click Heart:
  Icon: scale [1, 1.3, 1] (pop effect)
  Color: slate-400 → red-500
  Fill: transparent → red-500
  Count: +1 with fade transition
```

### **Category Switch (600ms)**
```
Click New Category:
  Old Pill: gradient fades out
  Background: slides to new position (spring)
  New Pill: gradient fades in
  Text: color transitions
```

---

## 🎨 Color Palette

### **Primary Colors**
```
Blue:    #3B82F6  (rgb(59, 130, 246))   → Mapbox path
Purple:  #9333EA  (rgb(147, 51, 234))   → Gradient accent
Red:     #EF4444  (rgb(239, 68, 68))    → Live indicator
```

### **Glass Effects**
```
Dark Glass:   rgba(0, 0, 0, 0.3)         → Top overlay
Light Glass:  rgba(255, 255, 255, 0.15)  → Bottom overlay
Pills:        rgba(255, 255, 255, 0.2)   → Metadata badges
```

### **Gradients**
```css
/* Primary Gradient (buttons, active states) */
background: linear-gradient(135deg, #3B82F6 0%, #9333EA 100%);

/* Background Gradient (page) */
background: linear-gradient(135deg, 
  rgb(248, 250, 252) 0%,     /* slate-50 */
  rgba(239, 246, 255, 0.3) 50%,  /* blue-50/30 */
  rgba(250, 245, 255, 0.3) 100%  /* purple-50/30 */
);

/* Card Gradient */
background: linear-gradient(135deg, 
  rgb(248, 250, 252) 0%,     /* slate-50 */
  rgb(255, 255, 255) 100%    /* white */
);
```

---

## 📐 Layout Specifications

### **Desktop (≥768px)**
```
Container:      max-w-5xl (80rem = 1280px)
Grid:           2 columns
Gap:            24px
Card Width:     ~600px
Card Height:    ~560px (320px map + 240px content)
```

### **Mobile (<768px)**
```
Container:      full width - 16px padding
Grid:           1 column
Gap:            24px
Card Width:     100%
Card Height:    Dynamic (aspect-ratio: 1/1 for map)
```

### **Map Preview**
```
Width:          600px (desktop) / 100% (mobile)
Height:         320px (h-80)
Aspect:         16:10
Resolution:     @2x (retina) = 1200x640 actual
```

### **Glassmorphism Overlays**
```
Top Overlay:
  Position:     absolute top-4 left-4 right-4
  Padding:      px-3 py-2
  Border:       rounded-2xl

Bottom Overlay:
  Position:     absolute bottom-4 left-4 right-4
  Padding:      p-4
  Border:       rounded-2xl
```

---

## 🎭 Interactive States

### **Card States**
```
Default:    shadow-lg, scale: 1
Hover:      shadow-xl, map scale: 1.08
Active:     scale: 0.98 (on click)
Disabled:   opacity: 0.6, pointer-events: none
```

### **Button States**
```
Default:    bg-white, text-slate-700
Hover:      bg-slate-50, border-slate-300
Active:     scale: 0.95
Liked:      fill-red-500, text-red-500
```

### **Filter Pills**
```
Inactive:   bg-white, text-slate-700, border-slate-200
Active:     gradient bg, text-white, shadow-lg
Hover:      bg-slate-50, border-slate-300
```

---

## 🎬 Framer Motion Variants

### **Pre-built Variants** (for consistency)
```tsx
const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      delay: i * 0.08,
      ease: [0.23, 1, 0.32, 1]
    }
  })
};

const mapVariants = {
  idle: { scale: 1 },
  hover: { 
    scale: 1.08,
    transition: { duration: 0.6, ease: 'easeOut' }
  }
};

const likeVariants = {
  liked: { 
    scale: [1, 1.3, 1],
    transition: { duration: 0.3 }
  }
};
```

---

## 📱 Mobile Adaptations

### **Touch Optimizations**
```tsx
// Larger tap targets
className="p-4 active:scale-95"

// Prevent long-press menu
onContextMenu={(e) => e.preventDefault()}

// Fast tap feedback
className="active:scale-90 transition-transform"
```

### **Scroll Behavior**
```tsx
// Smooth category scroll
className="overflow-x-auto scrollbar-hide"

// Snap points (optional)
className="snap-x snap-mandatory"
```

### **Reduced Motion**
```tsx
// Respect user preferences
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 🖼️ Image Optimization

### **Mapbox Static API Best Practices**
```typescript
// Use appropriate size
Desktop: 600x400@2x  (1200x800 actual)
Mobile:  400x300@2x  (800x600 actual)

// Cache in component state
const [mapUrl, setMapUrl] = useState('');
useEffect(() => {
  setMapUrl(generateMapboxStaticUrl(...));
}, [coordinates]);

// Lazy loading
<img loading="lazy" src={mapUrl} alt={title} />
```

### **Fallback Strategy**
```tsx
{mapUrl || post.photoUrls[0] ? (
  <img src={mapUrl || post.photoUrls[0]} alt={title} />
) : (
  <div className="bg-gradient-to-br from-blue-900 to-indigo-900">
    <MapPin className="w-16 h-16 text-white/30" />
  </div>
)}
```

---

## 🎯 Accessibility

### **ARIA Labels**
```tsx
<button aria-label="Like post">
  <Heart />
</button>

<button aria-label={`Filter by ${category.label}`}>
  <Icon /> {category.label}
</button>
```

### **Keyboard Navigation**
```tsx
// Tab order
tabIndex={0}

// Focus styles
focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
```

### **Screen Readers**
```tsx
<span className="sr-only">
  Trip from {startLocation} to {endLocation}, 
  {distance} kilometers, {duration} days
</span>
```

---

## 🔧 Customization Guide

### Change Map Style
```tsx
// In generateMapboxStaticUrl()
const style = 'mapbox/satellite-v9'; // or 'mapbox/outdoors-v12'
return `https://api.mapbox.com/styles/v1/${style}/static/...`;
```

### Adjust Glass Blur
```tsx
// More blur
className="backdrop-blur-3xl" // 96px blur

// Less blur
className="backdrop-blur-md"  // 12px blur
```

### Modify Route Path Color
```tsx
// In generateMapboxStaticUrl()
const pathColor = 'ef4444'; // Red
const pathOverlay = `path-5+${pathColor}-0.8(${coordinates})`;
```

### Change Grid Layout
```tsx
// 3 columns on large screens
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"

// Pinterest-style masonry (requires plugin)
className="columns-1 md:columns-2 lg:columns-3 gap-6"
```

---

**Last Updated**: March 18, 2026
**Component Version**: 1.0.0
**Design Status**: ✅ Production-ready
