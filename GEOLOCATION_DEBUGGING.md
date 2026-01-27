# 🔍 Geolocation Debugging Guide

## Sorunu Teşhis Etmek İçin

### 1️⃣ **Browser Console'da Deneyelim**

iOS Safari'de:
1. Dev Tools açmak: Develop menu (varsa) veya iCloud Keychain'den
2. Veya **Android Chrome**: `chrome://inspect`

Bu kodu console'da çalıştır:
```javascript
// Test geolocation support
console.log('Geolocation supported?', 'geolocation' in navigator);

// Request permission
navigator.geolocation.getCurrentPosition(
  (position) => {
    console.log('✅ Location:', position.coords.latitude, position.coords.longitude);
  },
  (error) => {
    console.error('❌ Error code:', error.code);
    console.error('Error message:', error.message);
    // Error codes: 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
  }
);
```

### 2️⃣ **iOS Settings Kontrolü** (Most Important)

#### iOS Privacy Settings:
```
Settings > Privacy > Location Services
├─ Location Services: ON ✅
├─ Safari: While Using / Always ✅
└─ TripNoute App (varsa): Always ✅
```

#### Safari Settings:
```
Settings > Safari > Location
└─ Should be: "Allow" or "While Using" ✅
```

#### Website Level Permission:
In Safari address bar:
```
Tap 🔒 (lock icon on left)
   ↓
Look for "Location" section
   ↓
Change to "Allow" ✅
```

### 3️⃣ **Mapbox GeolocateControl Issue**

Harita sağ üstteki X ikonu **Mapbox'ın GeolocateControl**'ü.

Sorun: Permission denied olduğunda hata gösteriyor.

**Çözüm adımları:**

#### Step A: Önce tüm izinleri temizle
```
Settings > Privacy > Location Services > Safari
→ Reset/Remove TripNoute
→ Force-close Safari
```

#### Step B: Safari'yi yeniden aç
```
1. TripNoute v2'yi açt
2. Geolocation prompt gelecek
3. "Allow While Using App" TAP ✅
```

#### Step C: Test et
- Custom location button'u tıkla (sağ üstte)
- Harita konuma gitmelidir + error mesajı gitmeli

### 4️⃣ **Problem Hala Varsa?**

Eğer X hala gösteriliyorsa:
1. **Hard Refresh yapılmadı**
   - Safari: `Settings > Safari > Clear History and Website Data`
   - Sonra refresh: Cmd+R

2. **iOS DNS Cache Issue**
   - `Settings > Wi-Fi > Network Name > Forget`
   - WiFi'ye yeniden bağlan

3. **Safari Private Mode?**
   - Private mode geolocation reddediyor
   - Normal mode kullan

### 5️⃣ **Technical Details**

Our implementation:

**MapboxMap.tsx:**
```typescript
const handleLocateMe = async () => {
  setIsLocating(true);
  setLocationError(null);
  
  try {
    const result = await flyToUserLocation(12);
    if (!result) {
      setLocationError('Konumunuz alınamadı. GPS\'i açın ve tekrar deneyin.');
    }
  } catch (err) {
    setLocationError(err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu');
  } finally {
    setIsLocating(false);
  }
};
```

**MapboxService.ts - flyToUserLocation():**
```typescript
async flyToUserLocation(zoom: number = 12): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      console.error('Geolocation not supported');
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Success - fly to location
        const { latitude: lat, longitude: lng } = position.coords;
        this.map?.flyTo({
          center: [lng, lat],
          zoom,
          duration: 2000,
          essential: true,
        });
        resolve({ lat, lng });
      },
      (error) => {
        // Handle errors
        const messages = {
          1: 'Location permission denied. Enable GPS in settings.',
          2: 'Location unavailable. Please try again.',
          3: 'Location request timed out. Please try again.'
        };
        console.warn(messages[error.code] || 'Unknown error');
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}
```

### 6️⃣ **Mapbox GeolocateControl Settings**

Updated in MapboxService.ts:
```typescript
const geolocateControl = new mapboxgl.GeolocateControl({
  positionOptions: {
    enableHighAccuracy: true,
    timeout: 10000, // Extended for mobile
  },
  trackUserLocation: false,
  showUserHeading: true,
  showUserLocation: true,
});

geolocateControl.on('error', (error) => {
  console.error('GeolocateControl error:', error);
  // User can use custom button instead
});
```

## ✅ Expected Behavior

1. **First Load:**
   - ❌ X icon gösterilir (permission prompt kapatılmış)
   - ✅ Custom location button works if permission granted

2. **After Allowing Permission:**
   - ✅ Custom location button works perfectly
   - ✅ Error message shows if GPS off
   - ✅ Loading spinner shows during request
   - ✅ Map flies to location at zoom 12

3. **Error States:**
   - GPS OFF: "Konumunuz alınamadı. GPS'i açın ve tekrar deneyin."
   - Permission DENIED: Same message
   - TIMEOUT: "Konum isteği zaman aşımına uğradı. Lütfen tekrar deneyin."

## 🎯 Quick Checklist

- [ ] iOS Location Services: ON
- [ ] Safari Location: "While Using" or "Allow"
- [ ] Website permission: Tap 🔒 → Allow Location
- [ ] Safari cache cleared: Settings > Safari > Clear History
- [ ] Hard refresh: Cmd+R after clearing cache
- [ ] Custom button clicked (not X button)
- [ ] Permission prompt appeared
- [ ] Tapped "Allow While Using"

If all these pass and still doesn't work, this might be a WiFi/network issue or iOS version bug.
