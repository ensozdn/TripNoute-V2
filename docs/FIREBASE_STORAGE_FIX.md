# 🔥 Firebase Storage Troubleshooting Guide

## Error: "storage/unknown"

Bu hata genellikle şu sebeplerden kaynaklanır:

### 1. ✅ Storage Bucket URL'i Yanlış (FİX YAPILDI)

**Eski (YANLIŞ):**
```
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=trip-noute.firebasestorage.app
```

**Yeni (DOĞRU):**
```
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=trip-noute.appspot.com
```

Firebase Storage bucket her zaman `PROJECT_ID.appspot.com` formatındadır.

---

### 2. 🔒 Firebase Storage Rules Çok Kısıtlayıcı

`storage.rules` dosyası oluşturuldu ve deploy edilmesi gerekiyor.

**Deploy komutu:**
```bash
# Terminal'de çalıştır:
firebase deploy --only storage
```

**Geçici test için (development only):**
Firebase Console'dan manuel olarak şu kuralları ayarlayabilirsin:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

### 3. 🌐 CORS Configuration

Firebase Storage otomatik CORS yapılandırması yapar, ama bazen manual düzeltmek gerekebilir.

**gsutil ile CORS ayarla (ihtiyaç halinde):**

1. `cors.json` dosyası oluştur:
```json
[
  {
    "origin": ["http://localhost:3000", "https://yourdomain.com"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "maxAgeSeconds": 3600
  }
]
```

2. Komut çalıştır:
```bash
gsutil cors set cors.json gs://trip-noute.appspot.com
```

---

## ✅ Düzeltmeler Yapıldı

1. ✅ `.env.local` dosyasında `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` düzeltildi
2. ✅ `FirebaseStorageService.ts` constructor'ına validation eklendi
3. ✅ `storage.rules` dosyası oluşturuldu
4. ✅ Debug logları eklendi

---

## 🧪 Test Adımları

### 1. Dev Server'ı Yeniden Başlat
```bash
# Terminal'de:
pkill -f "next dev"
rm -rf .next
npm run dev
```

### 2. Browser Console'u Aç
- Chrome/Edge: `F12` veya `Cmd+Option+I` (Mac)
- Şu logları göreceksin:
  ```
  🔧 Firebase Storage initialized
  Storage bucket: trip-noute.appspot.com
  🔵 Starting photo upload: {...}
  ```

### 3. Fotoğraf Yükle
- Dashboard'da "Add Place" tıkla
- Bir fotoğraf seç
- Console'da hata olup olmadığını kontrol et

---

## 🚨 Hala Hata Alıyorsan

### Console'da Şunları Kontrol Et:

1. **Storage bucket doğru mu?**
```javascript
// Console'da çalıştır:
console.log(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
// Sonuç: "trip-noute.appspot.com" olmalı
```

2. **Storage initialized mi?**
```javascript
// Console'da çalıştır:
import { storage } from '@/lib/firebase';
console.log(storage.app.options.storageBucket);
```

3. **Auth token var mı?**
```javascript
// Console'da çalıştır:
import { auth } from '@/lib/firebase';
console.log(auth.currentUser);
// Null değilse, kullanıcı giriş yapmış
```

---

## 📞 Firebase Console Kontrolleri

1. **Firebase Console'a Git:**
   https://console.firebase.google.com/project/trip-noute/storage

2. **Storage Rules Kontrol Et:**
   - Rules sekmesine tıkla
   - Şu kuralların olduğundan emin ol:
     ```
     allow read, write: if request.auth != null;
     ```

3. **Usage Kontrol Et:**
   - Eğer quota aşıldıysa upgrade gerekebilir
   - Free tier: 1GB storage, 10GB/month bandwidth

---

## 🔄 Sonraki Adımlar

1. ✅ Dev server'ı yeniden başlat
2. ✅ Tarayıcıyı yenile (hard refresh: `Cmd+Shift+R`)
3. ✅ Firebase Storage Rules'u deploy et
4. ✅ Fotoğraf upload'u test et
5. ❌ Hala hata varsa, Firebase Console'da manual test yap

---

## 📚 Referanslar

- [Firebase Storage Documentation](https://firebase.google.com/docs/storage)
- [Firebase Storage Security Rules](https://firebase.google.com/docs/storage/security)
- [Firebase Storage CORS](https://firebase.google.com/docs/storage/web/download-files#cors_configuration)

---

**Created:** 2026-01-18  
**Status:** FIX APPLIED - TESTING REQUIRED
