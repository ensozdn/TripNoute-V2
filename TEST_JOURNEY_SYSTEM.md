# Journey System Test Guide

## ✅ Build & Compile Status
- **TypeScript Compile**: ✅ PASS
- **Next.js Build**: ✅ PASS (0 errors)
- **Dev Server**: ✅ RUNNING on http://localhost:3000
- **Dashboard Render**: ✅ SUCCESS (200 in 1533ms)

## 🎯 Test Scenarios

### 1. Dashboard Journey Load Test
**Location**: http://localhost:3000/dashboard
**Expected Behavior**:
- Dashboard loads successfully
- If user has journeys in Firestore → journeys rendered on map
- Each journey shows:
  - Colored route lines (6 transport styles)
  - Circular markers at each stop
  - White medallion bubbles at segment midpoints with transport icons

**Test Steps**:
1. Login with test account
2. Open dashboard
3. Check browser console for errors
4. Verify map loads with globe projection
5. Look for journey routes on map

### 2. Journey Database Service Test
**Service**: `JourneyDatabaseService`
**Methods to Test**:
```typescript
// Create
const journey = await journeyDatabaseService.createJourney(input);

// Read
const journey = await journeyDatabaseService.getJourneyById(journeyId);
const journeys = await journeyDatabaseService.getUserJourneys(userId);

// Update
await journeyDatabaseService.updateJourney(journeyId, updates);

// Delete
await journeyDatabaseService.deleteJourney(journeyId);
```

### 3. Mapbox Rendering Test
**Service**: `MapboxService`
**Methods to Test**:
```typescript
const mapboxService = getMapboxService();

// Render single journey
mapboxService.renderJourney(journey);

// Render multiple journeys
mapboxService.renderAllJourneys(journeys);

// Clear specific journey
mapboxService.clearJourney(journeyId);

// Clear all journeys
mapboxService.clearAllJourneys();
```

### 4. Transport Mode Style Test
**Expected Styles**:
- **Flight** (flight): Cyan dashed line (#4ECDC4, dash: 2-2, blur: 2)
- **Car** (car): Red solid line (#FF6B6B, width: 4)
- **Bus** (bus): Orange solid line (#FFA07A, width: 4)
- **Train** (train): Blue dashed line (#45B7D1, dash: 4-2, width: 3)
- **Ship** (ship): Light blue dashed line (#85C1E2, dash: 6-3, width: 3)
- **Walk** (walk): Mint dotted line (#95E1D3, dash: 1-3, width: 1.5)

### 5. Journey Isolation Test
**Test Multiple Journeys**:
1. Create Journey A: Istanbul → Paris (flight)
2. Create Journey B: Tokyo → Kyoto (train)
3. Verify:
   - Both render on map simultaneously
   - No layer ID conflicts
   - Each has unique source: `journey-source-{id}`
   - Each has unique layers: `journey-layer-{id}-{index}`
   - Deleting Journey A doesn't affect Journey B

## 🐛 Known Issues (Pre-Test)
None currently - all compile/build checks passed!

## 📝 Manual Test Checklist
- [ ] Dashboard loads without errors
- [ ] Journey loading works (if journeys exist)
- [ ] Map renders journeys correctly
- [ ] Transport mode styles are correct
- [ ] Medallion icons appear at midpoints
- [ ] Stop markers are clickable with popups
- [ ] Multiple journeys don't interfere with each other
- [ ] Journey distance/duration calculations are correct
- [ ] Console has no errors

## 🔧 Debug Commands
```bash
# Check build
npm run build

# Check lint
npm run lint

# Start dev server
npm run dev

# Check TypeScript
npx tsc --noEmit
```

## 🎨 Visual Verification Points
1. **Route Lines**: Should follow geodesic paths on globe
2. **Markers**: Circular colored dots at stops (32px for start/end, 24px for middle)
3. **Medallions**: White 32px circles with transport icons at segment midpoints
4. **Popups**: Should show place name and city on marker hover
5. **Colors**: Each journey should have unique color from JOURNEY_COLORS

## ⚠️ Edge Cases to Test
1. Journey with single step (no routes to draw)
2. Journey with null transportToNext on last step
3. Journey with all 6 different transport modes
4. Very long journey (10+ stops)
5. Journey with stops at same coordinates
6. Journey crossing international date line
7. Journey with missing optional fields (address.city)

## 📊 Performance Metrics
- Dashboard initial load: ~1.5s ✅
- Journey render time: TBD
- Map interaction (zoom/pan): Should be smooth
- Memory usage: Monitor for leaks with multiple journeys

## 🔄 Next Steps After Testing
1. If no errors → System is production ready
2. If runtime errors → Debug and fix
3. Add Journey creation UI (future phase)
4. Add Journey editing/deletion UI (future phase)
5. Add Journey selection/focus features (future phase)
