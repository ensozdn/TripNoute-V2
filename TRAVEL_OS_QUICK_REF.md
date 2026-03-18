# ⚡ Travel OS Quick Reference

## 🚀 Component Usage

### Import Travel OS Explore Feed
```tsx
import TravelOSExplore from '@/components/explore/TravelOSExplore';

// In your component
<TravelOSExplore 
  userId={user.uid}
  userName={user.displayName || 'Anonymous'}
  userPhotoUrl={user.photoURL}
/>
```

### Individual Trip Card
```tsx
import TripCard from '@/components/explore/TripCard';

<TripCard 
  post={post}           // PostWithEngagement object
  index={0}             // For staggered animation
  isLiked={true}        // Current like state
  onLikeToggle={handleLike}
/>
```

### Category Filter
```tsx
import CategoryFilter from '@/components/explore/CategoryFilter';

<CategoryFilter 
  activeCategory="roadtrip"
  onCategoryChange={(cat) => console.log(cat)}
/>
```

### Live/Past Toggle
```tsx
import LivePastToggle from '@/components/explore/LivePastToggle';

<LivePastToggle 
  mode="live"
  onModeChange={(mode) => console.log(mode)}
  liveCount={5}
/>
```

---

## 🎨 CSS Classes (Glassmorphism)

### Dark Glass (User Info)
```tsx
className="bg-black/30 backdrop-blur-xl border border-white/10"
```

### Light Glass (Metadata)
```tsx
className="bg-white/15 backdrop-blur-2xl border border-white/20 shadow-2xl"
```

### Metadata Pills
```tsx
className="bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-lg"
```

### Card Hover Effect
```tsx
className="hover:shadow-xl hover:shadow-black/10 transition-all duration-500"
```

---

## 🗺️ Mapbox Static API Examples

### Simple Route
```
https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/
  path-5+3b82f6-0.8(2.3522,48.8566,4.8357,45.7640)/
  3.5939,47.3103,5,0/
  600x400@2x
  ?access_token=YOUR_TOKEN
```

### With Markers
```
path-5+3b82f6-0.8(...),
pin-s-a+3b82f6(2.3522,48.8566),
pin-s-b+ef4444(4.8357,45.7640)
```

### Zoom Levels
- `z=3`: Continental view
- `z=5`: Country view (default for routes)
- `z=10`: City view
- `z=15`: Street view

---

## 🎬 Animation Presets

### Card Entrance (Staggered)
```tsx
initial={{ opacity: 0, y: 20, scale: 0.98 }}
animate={{ opacity: 1, y: 0, scale: 1 }}
transition={{ 
  duration: 0.5, 
  delay: index * 0.08,
  ease: [0.23, 1, 0.32, 1]
}}
```

### Hover Zoom (Map)
```tsx
animate={{ scale: isHovered ? 1.08 : 1 }}
transition={{ duration: 0.6, ease: 'easeOut' }}
```

### Live Badge Pulse
```tsx
animate={{ scale: [1, 1.1, 1] }}
transition={{ duration: 2, repeat: Infinity }}
```

### Category Pill Active State
```tsx
<motion.div layoutId="activeCategory" />
transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
```

---

## 📊 Data Requirements

### Trip with Coordinates
```typescript
interface Trip {
  id: string;
  title: string;
  coordinates: Array<{
    lat: number;
    lng: number;
    timestamp?: Timestamp;
  }>;
  travelMode: 'roadtrip' | 'backpacking' | 'sailing' | 'flight' | 'cycling' | 'rail';
  isLive: boolean;
  startDate: Timestamp;
  endDate?: Timestamp;
  distance?: number;  // Pre-calculated in km
  duration?: number;  // Pre-calculated in days
}
```

### Post with Engagement
```typescript
interface PostWithEngagement {
  id: string;
  userId: string;
  userName: string;
  userPhotoUrl?: string;
  type: 'place' | 'trip';
  contentId: string;
  title: string;
  caption?: string;
  photoUrls: string[];
  location?: {
    city?: string;
    country: string;
    coordinates: { lat: number; lng: number };
  };
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  isLikedByCurrentUser: boolean;
  isSavedByCurrentUser: boolean;
  createdAt: Timestamp;
  
  // Optional Travel OS fields
  coordinates?: Array<{ lat: number; lng: number }>;
  travelMode?: string;
  isLive?: boolean;
  totalDistance?: number;
  duration?: number;
}
```

---

## 🔥 Firestore Query Examples

### Basic Feed
```typescript
const q = query(
  collection(db, 'posts'),
  where('isPublic', '==', true),
  orderBy('createdAt', 'desc'),
  limit(20)
);
```

### Filter by Category
```typescript
const q = query(
  collection(db, 'posts'),
  where('isPublic', '==', true),
  where('travelMode', '==', 'roadtrip'),
  orderBy('createdAt', 'desc'),
  limit(20)
);
```

### Filter by Live Status
```typescript
const q = query(
  collection(db, 'posts'),
  where('isPublic', '==', true),
  where('isLive', '==', true),
  orderBy('createdAt', 'desc'),
  limit(20)
);
```

---

## 🎯 Common Tasks

### Add New Category
1. Update `TripCategory` type in `CategoryFilter.tsx`
2. Add icon from Lucide React
3. Add to `categories` array
4. Update Trip type in backend

### Customize Map Style
Replace `mapbox/dark-v11` with:
- `mapbox/streets-v12` (light, detailed)
- `mapbox/satellite-v9` (satellite view)
- `mapbox/outdoors-v12` (topographic)
- Custom style URL from Mapbox Studio

### Change Animation Speed
```tsx
// Slower entrance
transition={{ duration: 0.8, delay: index * 0.12 }}

// Faster hover
transition={{ duration: 0.3, ease: 'easeOut' }}
```

### Adjust Glass Opacity
```tsx
// More opaque
className="bg-black/50 backdrop-blur-xl"

// More transparent
className="bg-black/20 backdrop-blur-lg"
```

---

## 🐛 Troubleshooting

### Map Not Loading
- ✅ Check `NEXT_PUBLIC_MAPBOX_TOKEN` in `.env.local`
- ✅ Verify coordinates array is not empty
- ✅ Check browser console for API errors
- ✅ Fallback to `post.photoUrls[0]` if map fails

### Glassmorphism Not Working
- ✅ Ensure browser supports `backdrop-filter`
- ✅ Check parent has actual background (not transparent)
- ✅ Verify border is visible (adjust opacity if needed)

### Animations Stuttering
- ✅ Reduce number of simultaneous animations
- ✅ Use `will-change` for critical properties
- ✅ Check for layout recalculations (avoid height changes)
- ✅ Disable animations on low-end devices

### Category Filter Not Filtering
- ✅ Verify trip has `travelMode` field
- ✅ Check Firestore indexes exist
- ✅ Ensure query includes category where clause
- ✅ Check backend service implementation

---

## 📱 Mobile Optimizations

### Touch Interactions
```tsx
// Increase tap target size
className="active:scale-95 transition-transform p-4"

// Prevent long-press context menu
onContextMenu={(e) => e.preventDefault()}
```

### Performance
```tsx
// Reduce animation complexity on mobile
const isMobile = window.innerWidth < 768;
transition={{ duration: isMobile ? 0.3 : 0.6 }}
```

### Responsive Grid
```tsx
// 1 col mobile, 2 cols desktop
className="grid grid-cols-1 md:grid-cols-2 gap-6"
```

---

## 🎨 Color System

### Gradients
```tsx
// Primary (buttons, pills)
from-blue-600 to-purple-600

// Background
from-slate-50 via-blue-50/30 to-purple-50/30

// Card backgrounds
from-slate-50 to-white
```

### Text Colors
```tsx
text-slate-900  // Headings (dark)
text-slate-700  // Body text
text-slate-500  // Secondary text
text-slate-400  // Tertiary/timestamps
text-white      // Overlay text
```

### Interactive States
```tsx
hover:text-red-500      // Like button
hover:text-blue-500     // Comment button
hover:text-amber-500    // Bookmark button
```

---

## 🔑 Environment Setup

### Required Tokens
```env
# .env.local
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNsZjM...
```

### Get Mapbox Token
1. Go to https://account.mapbox.com/
2. Create account or login
3. Navigate to "Tokens"
4. Create new public token with Static API scope
5. Copy token to `.env.local`

---

## 📦 Dependencies

### Already Installed
```json
{
  "framer-motion": "^11.x",
  "lucide-react": "^0.x",
  "next": "^16.1.1",
  "react": "^19.x",
  "tailwindcss": "^4.x"
}
```

### No Additional Packages Required
The implementation uses only existing dependencies.

---

## 🎓 Best Practices

### Performance
- ✅ Use Static API (not interactive maps) for feed
- ✅ Lazy load images with native `loading="lazy"`
- ✅ Limit simultaneous Mapbox requests
- ✅ Cache generated URLs in component state

### UX
- ✅ Show loading skeleton during map generation
- ✅ Fallback to regular photo if map fails
- ✅ Optimistic UI for instant feedback
- ✅ Clear empty states with actionable text

### Code Quality
- ✅ TypeScript strict mode enabled
- ✅ Component composition over large files
- ✅ Reusable animation variants
- ✅ Centralized color system (Tailwind)

---

**Quick Start**: Import `TravelOSExplore` → Pass user props → Done! ✨
**Documentation**: See TRAVEL_OS_IMPLEMENTATION.md for full details
**Support**: Check TRAVEL_OS_ARCHITECTURE.md for system design
