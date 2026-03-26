# 🔔 Push Notifications - Duplicate Fix

**Problem:** Follow işleminde 2 kere bildirim geliyordu.

## 🐛 Root Cause Analysis

### 1. **Notification ID Problemi**
```typescript
// ❌ BEFORE: Her request'te yeni ID
notificationId: `follow_${Date.now()}`

// ✅ AFTER: Stable ID (relationship-based)
notificationId: `follow_${followerId}_${followingId}`
```

**Neden:** Service Worker'daki `tag` parametresi deduplication için kullanılıyor. Eğer `tag` her seferinde farklıysa, aynı bildirim 2 kez gösterilir.

### 2. **Service Worker Tag Configuration**
```javascript
// ❌ BEFORE: Icon yanlış yerde, tag eksik
notification: {
  imageUrl: payload.icon,  // ❌ Yanlış property
},
webpush: {
  notification: {
    icon: payload.icon,    // ✅ Doğru property
    // tag eksik!
  }
}

// ✅ AFTER: Icon doğru yerde, tag eklendi
notification: {
  icon: payload.icon,      // ✅ Doğru
},
webpush: {
  notification: {
    tag: notificationId,   // ✅ Deduplication için kritik
    renotify: false,       // ✅ Aynı tag için tekrar vibration yapma
  }
}
```

### 3. **Follow Button Race Condition**
```typescript
// ❌ BEFORE: Hızlı tıklamalarda birden fazla request
await followService.followUser(user.uid, targetUserId);

// ✅ AFTER: Progress tracking ile protection
if (followingInProgress.has(targetUserId)) return;
setFollowingInProgress(prev => new Set(prev).add(targetUserId));
try {
  await followService.followUser(user.uid, targetUserId);
} finally {
  setFollowingInProgress(prev => {
    const next = new Set(prev);
    next.delete(targetUserId);
    return next;
  });
}
```

---

## ✅ Changes Made

### Modified Files

#### 1. `src/services/firebase/FollowService.ts`
- ✅ `notificationId` artık stable: `follow_${followerId}_${followingId}`
- ✅ Timestamp kaldırıldı
- ✅ Daha iyi log mesajları

#### 2. `src/services/firebase/PushNotificationService.ts`
- ✅ `sendFollowNotification()`: `notificationId` parameter eklendi
- ✅ `sendLikeNotification()`: `notificationId` parameter eklendi
- ✅ `sendCommentNotification()`: `notificationId` parameter eklendi
- ✅ `icon` property düzeltildi (notification level)
- ✅ `tag` eklendi (webpush.notification level)
- ✅ `renotify: false` eklendi

#### 3. `src/app/api/notifications/send-push/route.ts`
- ✅ Request body'den `notificationId` parse ediliyor
- ✅ Service metodlarına `notificationId` geçiliyor
- ✅ Daha iyi log mesajları

#### 4. `public/firebase-messaging-sw.js`
- ✅ `icon` property düzeltildi
- ✅ `tag` stable ID kullanıyor
- ✅ `renotify: false` eklendi
- ✅ Console log'ları iyileştirildi

#### 5. `src/services/firebase/FCMTokenService.ts`
- ✅ Foreground listener yorumları güncellendi
- ✅ Service Worker otomatik handle ettiği belirtildi

#### 6. `src/services/firebase/ExploreService.ts`
- ✅ Like notification için stable ID: `like_${userId}_${postId}`
- ✅ `notificationId` API'ye gönderiliyor

#### 7. `src/components/journey/JourneyHub.tsx`
- ✅ `followingInProgress` state eklendi
- ✅ Duplicate follow request engellendi

---

## 🧪 Testing Guide

### Test Scenario 1: Single Follow (Temel Senaryo)
1. Kız arkadaşının telefonundan login
2. Senin hesabına follow at
3. **EXPECTED:** Sadece 1 bildirim gelir
4. **CHECK:** Console'da "Push notifications sent: 1/1" yazmalı

### Test Scenario 2: Rapid Follow (Race Condition)
1. Follow butonuna 3 kez hızlıca tıkla
2. **EXPECTED:** Sadece 1 request gider, diğerleri block edilir
3. **CHECK:** Console'da "Follow request already in progress" görülür

### Test Scenario 3: Follow → Unfollow → Follow (Tag Replacement)
1. Follow at
2. Hemen unfollow yap
3. Tekrar follow at
4. **EXPECTED:** İkinci follow bildirimi birincisini replace eder
5. **CHECK:** Sadece 1 bildirim görünür (aynı `tag` kullanıldığı için)

### Test Scenario 4: Multiple Tokens (Aynı User)
1. Chrome ve Safari'den aynı hesaba login
2. Başka bir user'dan follow at
3. **EXPECTED:** Her device'a 1 bildirim (toplam 2)
4. **CHECK:** "Push notifications sent: 2/2"

---

## 📊 Log Flow (Debugging)

### Follow Action Logs:
```
🔔 [FollowService] Sending push notification... { recipientId, senderId, notificationId: "follow_user1_user2" }
✅ [FollowService] Push notification request completed
📤 [API] Received follow push notification request: { recipientId, senderId, notificationId: "follow_user1_user2" }
📤 [API] Calling pushNotificationService.sendFollowNotification...
📤 [PushService] Sending follow notification: { recipientId, senderName, notificationId: "follow_user1_user2" }
📤 Sending push notification to 1 device(s)
✅ Push notifications sent: 1/1
[SW] Received background message: { notification, data }
[SW] Showing notification with tag: follow_user1_user2
```

### Success Indicators:
- ✅ "Push notifications sent: 1/1" (veya token sayısı kadar)
- ✅ "Showing notification with tag: follow_user1_user2"
- ✅ Sadece 1 bildirim görünür

### Failure Indicators (Artık Olmayacak):
- ❌ "Push notifications sent: 2/2" (1 token varken)
- ❌ İki kere "Showing notification with tag"
- ❌ 2 bildirim görünür

---

## 🔥 Critical Points

### 1. **Notification Tag** (En Önemli!)
- Service Worker'da `tag` parametresi **same-tag-replace** mekanizması kullanır
- Aynı `tag` ile gelen yeni bildirim, eskisini replace eder
- Bu yüzden `notificationId` **stable** olmalı (timestamp içermemeli)

### 2. **Icon Property Location**
```javascript
// ❌ WRONG: Admin SDK'da imageUrl diye bir property yok
notification: { imageUrl: '...' }

// ✅ CORRECT: icon property kullan
notification: { icon: '...' }
```

### 3. **Renotify Flag**
```javascript
renotify: false  // ✅ Aynı tag için vibration tekrarlanmasın
```

### 4. **Race Condition Protection**
- Follow button disabled değil, state tracking kullanıyor
- Daha iyi UX: button aktif görünür ama duplicate request gitmez

---

## 🚀 Deployment Checklist

- [x] Service Worker güncellendi (`firebase-messaging-sw.js`)
- [x] Backend service'ler güncellendi (`PushNotificationService`, `FollowService`)
- [x] API endpoint güncellendi (`send-push/route.ts`)
- [x] Frontend component güncellendi (`JourneyHub.tsx`)
- [x] Test edildi (local)
- [ ] Production'a deploy et
- [ ] Vercel'de test et (production URL ile)
- [ ] Service Worker cache'i temizle (tarayıcıda)

---

## 📱 Service Worker Cache Temizleme

Eğer hala eski Service Worker çalışıyorsa:

### Chrome/Edge:
1. DevTools → Application → Service Workers
2. "Unregister" tıkla
3. Sayfayı yenile (Cmd+Shift+R)

### Safari:
1. Developer → Service Workers
2. Unregister
3. Sayfayı yenile

### Universal:
```javascript
// Console'a yapıştır
navigator.serviceWorker.getRegistrations().then(function(registrations) {
  for(let registration of registrations) {
    registration.unregister()
  }
  location.reload()
})
```

---

## 🎉 Expected Result

✅ **1 Follow Action = 1 Push Notification**  
✅ **Stable notification IDs**  
✅ **No duplicates**  
✅ **Better logging**  
✅ **Race condition protected**

**Test ettiğinde artık 2 değil 1 bildirim gelecek!** 🎊
