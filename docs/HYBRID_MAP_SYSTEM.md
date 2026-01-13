# 🗺️ TripNoute v2 - Hibrit Harita Sistemi

## 📋 Mimari Özet

TripNoute v2, **Hibrit Harita Modeli** kullanır:
- **Mapbox GL JS**: Harita görselleştirme ve UI (streets, satellite, dark styles)
- **Google Places API**: Yer arama, otomatik tamamlama, detaylı mekan verileri

## 🏗️ Servis Yapısı

### 1. MapboxService (`src/services/maps/MapboxService.ts`)
Harita render'ı ve görsellik:
- ✅ `initializeMap()` - Mapbox haritası oluştur
- ✅ `addMarker()` - Custom marker ekle
- ✅ `flyTo()` / `jumpTo()` - Animasyonlu/anında konuma git
- ✅ `fitBounds()` - Tüm marker'ları görünür yap
- ✅ `onClick()` / `onMarkerClick()` - Event handler'lar

### 2. GooglePlacesService (`src/services/maps/GooglePlacesService.ts`)
Yer arama ve veri:
- ✅ `searchPlaces()` - Text arama
- ✅ `autocomplete()` - Otomatik tamamlama
- ✅ `getPlaceDetails()` - Detaylı bilgi
- ✅ `geocodeAddress()` - Adres → Koordinat
- ✅ `reverseGeocode()` - Koordinat → Adres

## 🎨 Component'ler

### MapboxMap (`src/components/MapboxMap.tsx`)
Ana harita component'i:
```tsx
<MapboxMap
  places={places}
  selectedPlace={selectedPlace}
  onMarkerClick={setSelectedPlace}
  center={[lng, lat]}
  zoom={12}
  style="mapbox://styles/mapbox/dark-v11"
/>
```

**Özellikler:**
- Place array'ini otomatik marker'a çevir
- Selected place'e animasyonlu uç
- Loading state ile kullanıcı dostu
- Custom marker renkleri

### PlaceSearchBar (`src/components/PlaceSearchBar.tsx`)
Google Places araması:
```tsx
<PlaceSearchBar
  onPlaceSelect={(place) => {
    console.log(place.location); // {lat, lng}
  }}
  placeholder="Yer ara..."
/>
```

**Özellikler:**
- Debounced search (300ms)
- Keyboard navigation (↑↓ Enter Esc)
- Autocomplete dropdown
- Click outside to close

## 🪝 Hooks

### useMapbox (`src/hooks/useMapbox.ts`)
React hook for Mapbox:
```tsx
const { map, isLoaded, error, flyTo, addMarker } = useMapbox(containerRef, {
  accessToken: 'pk.xxx',
  style: 'mapbox://styles/mapbox/streets-v12',
  center: [lng, lat],
  zoom: 10,
  markers: [...],
  onMarkerClick: (id) => console.log(id),
});
```

**Return değerleri:**
- `map` - Mapbox instance
- `isLoaded` - Yükleme durumu
- `error` - Hata mesajı
- `flyTo()` - Konuma uç
- `addMarker()` / `removeMarker()` - Marker yönetimi

## 🔧 Kurulum

### 1. Dependency'leri Yükle
```bash
npm install mapbox-gl @types/mapbox-gl
```

### 2. Mapbox Access Token Al
1. [Mapbox hesabı](https://account.mapbox.com/) oluştur
2. Access token'ı kopyala
3. `.env.local` dosyasına ekle:
```bash
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJja...
```

### 3. Google Maps API Key Kontrol Et
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyBnxqQ...
```

## 🎨 Mapbox Stil Seçenekleri

```tsx
// Light
style="mapbox://styles/mapbox/streets-v12"

// Dark (önerilen, TripNoute dark theme ile uyumlu)
style="mapbox://styles/mapbox/dark-v11"

// Satellite
style="mapbox://styles/mapbox/satellite-streets-v12"

// Outdoors
style="mapbox://styles/mapbox/outdoors-v12"
```

## 📦 Dosya Yapısı

```
src/
├── services/
│   └── maps/
│       ├── GooglePlacesService.ts  # Google Places API
│       ├── MapboxService.ts        # Mapbox GL JS
│       └── index.ts                # Export
├── hooks/
│   └── useMapbox.ts                # Mapbox React hook
├── components/
│   ├── MapboxMap.tsx               # Ana harita component
│   └── PlaceSearchBar.tsx          # Google arama
├── types/
│   └── maps.ts                     # Tüm type definitions
└── app/
    └── map/
        └── page.tsx                # Map view sayfası
```

## 🚀 Kullanım Örnekleri

### Basit Harita
```tsx
import MapboxMap from '@/components/MapboxMap';

<MapboxMap places={myPlaces} />
```

### Arama ile Birlikte
```tsx
import MapboxMap from '@/components/MapboxMap';
import PlaceSearchBar from '@/components/PlaceSearchBar';

const [center, setCenter] = useState<[number, number]>();

<PlaceSearchBar
  onPlaceSelect={(place) => {
    setCenter([place.location.lng, place.location.lat]);
  }}
/>
<MapboxMap
  places={places}
  center={center}
  zoom={14}
/>
```

### Manuel Marker Ekleme
```tsx
import { getMapboxService } from '@/services/maps';

const mapbox = getMapboxService();

mapbox.addMarker({
  id: 'custom-1',
  position: { lat: 41.0082, lng: 28.9784 }, // Istanbul
  title: 'Custom Location',
  description: 'My special place',
  color: '#ff0000',
});
```

## 🎯 Hibrit Model Avantajları

✅ **Mapbox Görsellik**
- Çok daha estetik harita stilleri
- Özelleştirilebilir tasarım
- 3D building support
- Smooth animations

✅ **Google Places Data**
- Devasa yer veritabanı
- Güncel işletme bilgileri
- Fotoğraflar, yorumlar, rating
- Doğru geocoding

✅ **Best of Both Worlds**
- Google'ın data gücü + Mapbox'ın görsel kalitesi
- Maliyet optimizasyonu (Google Maps API çok pahalı)
- Daha iyi performans

## 📝 Migration Notları

### Önceki Sistem (Google Maps)
```tsx
import GoogleMap from '@/components/GoogleMap';
<GoogleMap places={places} />
```

### Yeni Sistem (Mapbox + Google)
```tsx
import MapboxMap from '@/components/MapboxMap';
<MapboxMap places={places} />
```

**Farklar:**
- `center` prop'u `[lng, lat]` formatında (ters sıra!)
- `style` prop'u ile Mapbox stilleri seçilebilir
- `PlaceSearchBar` ayrı component (Google Places kullanıyor)

## 🐛 Troubleshooting

### "Mapbox Access Token bulunamadı"
→ `.env.local` dosyasına `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` ekleyin

### "Failed to load Google Maps API"
→ `.env.local` dosyasında `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` kontrol edin

### Harita görünmüyor
→ Container'a `height` ve `width` verilmiş mi kontrol edin:
```tsx
<MapboxMap className="w-full h-[600px]" />
```

### Marker'lar görünmüyor
→ Place'lerde `location.lat` ve `location.lng` var mı kontrol edin

## 🎓 Öğrenme Kaynakları

- [Mapbox GL JS Docs](https://docs.mapbox.com/mapbox-gl-js/api/)
- [Google Places API](https://developers.google.com/maps/documentation/places/web-service)
- [Mapbox Examples](https://docs.mapbox.com/mapbox-gl-js/example/)

## ✨ Gelecek Geliştirmeler

- [ ] Custom Mapbox stil tasarımı (TripNoute temalı)
- [ ] Cluster markers (çok sayıda yer için)
- [ ] Heatmap layer (ziyaret yoğunluğu)
- [ ] 3D building visualization
- [ ] Direction/routing (iki yer arası yol)
- [ ] Offline map caching

---

**Hazırlayan:** TripNoute Development Team  
**Tarih:** 2026-01-13  
**Versiyon:** 2.0.0
