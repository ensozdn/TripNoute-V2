# Mapbox Route Lines & Focus Features

## 🎯 Overview

Polarsteps-style kavisli rota çizgileri ve interaktif timeline senkronizasyonu için MapboxService metodları.

## 🚀 Features

### 1. **drawRouteLines()** - Kavisli Rota Çizgileri
Gezi rotanızı harita üzerinde kavisli beyaz çizgilerle gösterir.

```typescript
import { getMapboxService } from '@/services/maps/MapboxService';

const mapboxService = getMapboxService();

// Places dizinizi gönderin (otomatik tarih sıralaması yapar)
mapboxService.drawRouteLines(places);
```

**Özellikler:**
- ✅ Otomatik tarih sıralaması (eskiden yeniye)
- ✅ Geodesic interpolation (kavisli çizgiler)
- ✅ Kesikli beyaz hat (Polarsteps style)
- ✅ Z-index yönetimi (çizgi altta, marker üstte)

**Parametreler:**
```typescript
places: Array<{
  id: string;
  location: { lat: number; lng: number };
  visitDate: Timestamp | Date;
}>
```

---

### 2. **focusOnPlace()** - Konuma Odaklan
Belirli bir yere yumuşak geçiş yapar (sinematik kamera hareketi).

```typescript
// Temel kullanım
mapboxService.focusOnPlace('place-id-123', places);

// Özelleştirilmiş kullanım
mapboxService.focusOnPlace('place-id-123', places, {
  zoom: 16,        // Yakınlaşma seviyesi (default: 15)
  pitch: 60,       // 3D açı (default: 45)
  bearing: 30,     // Rotasyon (default: 0)
  duration: 3000   // Animasyon süresi ms (default: 2000)
});
```

**Kullanım Senaryoları:**
- Timeline slider ile senkronizasyon
- Place kartına tıklandığında odaklanma
- "Next/Previous" butonları ile gezinme

---

### 3. **focusOnRoute()** - Tüm Rotayı Göster
Tüm konumları içine alacak şekilde kamerayı ayarlar.

```typescript
mapboxService.focusOnRoute(places);
```

**Özellikler:**
- ✅ Otomatik bounds hesaplama
- ✅ Padding ekleyerek kenar boşluğu
- ✅ Smooth zoom transition

---

### 4. **clearRouteLines()** - Çizgileri Temizle
Haritadaki rota çizgilerini kaldırır.

```typescript
mapboxService.clearRouteLines();
```

---

## 📱 Dashboard Entegrasyonu

### Örnek: Dashboard'a Route Ekleme

```tsx
'use client';

import { useEffect, useState } from 'react';
import { getMapboxService } from '@/services/maps/MapboxService';
import MapboxMap from '@/components/MapboxMap';

export default function DashboardPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const mapboxService = getMapboxService();

  useEffect(() => {
    if (places.length > 0) {
      // Route çizgilerini çiz
      mapboxService.drawRouteLines(places);
      
      // Tüm rotayı göster
      mapboxService.focusOnRoute(places);
    }

    return () => {
      // Cleanup
      mapboxService.clearRouteLines();
    };
  }, [places]);

  const handlePlaceClick = (placeId: string) => {
    // Konuma odaklan
    mapboxService.focusOnPlace(placeId, places, {
      zoom: 16,
      pitch: 45,
    });
  };

  return (
    <div className="h-screen">
      <MapboxMap
        places={places}
        onMarkerClick={handlePlaceClick}
      />
    </div>
  );
}
```

---

## 🎨 Styling Options

### Çizgi Renklerini Özelleştirme

Varsayılan stil: `#ffffff` beyaz, kesikli çizgi

Özelleştirmek için `MapboxService.ts` içinde:

```typescript
paint: {
  'line-color': '#3b82f6',  // Mavi
  'line-width': 4,
  'line-opacity': 0.9,
  'line-dasharray': [3, 3], // Daha uzun kesikler
}
```

---

## 🔧 Advanced: Timeline Senkronizasyonu

```tsx
const [currentPlaceIndex, setCurrentPlaceIndex] = useState(0);

// Slider değiştiğinde
const handleTimelineChange = (index: number) => {
  setCurrentPlaceIndex(index);
  
  const placeId = places[index].id;
  mapboxService.focusOnPlace(placeId, places, {
    zoom: 15,
    pitch: 50,
    duration: 1500,
  });
};

return (
  <div>
    <MapboxMap places={places} />
    
    <input
      type="range"
      min={0}
      max={places.length - 1}
      value={currentPlaceIndex}
      onChange={(e) => handleTimelineChange(Number(e.target.value))}
    />
  </div>
);
```

---

## 🐛 Troubleshooting

### Çizgiler Görünmüyor
```typescript
// Map'in yüklenmesini bekleyin
map.on('load', () => {
  mapboxService.drawRouteLines(places);
});
```

### Marker'lar Çizginin Üstünde Değil
Layer order doğru - `addLayer` sonrasında marker'lar ekleniyor. Sorun devam ederse:

```typescript
// Force marker z-index
marker.getElement().style.zIndex = '1000';
```

### Performance Issues (Çok Fazla Place)
```typescript
// 100+ place için sadece önemli noktaları göster
const keyPlaces = places.filter((p, i) => i % 5 === 0);
mapboxService.drawRouteLines(keyPlaces);
```

---

## 📊 Technical Details

**Layer Hierarchy:**
1. Base map (en altta)
2. `route-source` + `route-line` layer (ortada)
3. Markers (en üstte)

**Geodesic Interpolation:**
- Basit linear interpolation kullanır
- Production için Turf.js entegrasyonu önerilir:
  ```bash
  npm install @turf/turf
  ```

**Memory Management:**
- `clearRouteLines()` her defasında eski layer/source'u kaldırır
- Component unmount'ta cleanup yapın

---

## 🎯 Next Steps

1. **Turf.js Integration**: Daha hassas geodesic curves
2. **Animation**: Çizginin animasyonlu çizilmesi
3. **Gradient Colors**: Tarihe göre renk değişimi
4. **Interactive Tooltips**: Çizgi üzerine hover'da bilgi

---

## 📚 References

- [Mapbox GL JS API](https://docs.mapbox.com/mapbox-gl-js/api/)
- [Turf.js Geodesic](https://turfjs.org/docs/#greatCircle)
- [Polarsteps Blog](https://www.polarsteps.com)

---

**Author:** TripNoute Team  
**Date:** 2026-01-15  
**Version:** 1.0.0
