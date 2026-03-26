# 🔍 Duplicate Notification Debugging Guide

## 🚨 Current Status
- ✅ Notifications are being sent
- ❌ 2 notifications appear instead of 1

## 🧪 Debug Steps

### Step 1: Clear Everything
```bash
# Browser DevTools Console:
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.unregister())
  location.reload()
})
```

### Step 2: Check FCM Tokens
Open browser console and run:
```javascript
// Check how many FCM tokens exist
firebase.auth().onAuthStateChanged(user => {
  if (user) {
    firebase.firestore()
      .collection('users')
      .doc(user.uid)
      .collection('fcmTokens')
      .get()
      .then(snap => {
        console.log(`📊 User has ${snap.size} FCM token(s):`);
        snap.forEach(doc => {
          const data = doc.data();
          console.log(`  - ${doc.id.substring(0, 20)}... (platform: ${data.platform})`);
        });
      });
  }
});
```

### Step 3: Test Follow Action
1. From another device, follow the user
2. Watch **both** console outputs:
   - **Sender's browser console** (who clicked follow)
   - **Recipient's browser console** (who receives notification)
   - **Vercel logs** (backend)

### Step 4: Check Logs

#### Expected Logs (Sender's Browser):
```
🔔 [FollowService] Sending push notification... { 
  recipientId: "...", 
  senderId: "...", 
  notificationId: "follow_user1_user2" 
}
✅ [FollowService] Push notification request completed
```

#### Expected Logs (Vercel Backend):
```
📤 [API] Received follow push notification request: { 
  recipientId: "...", 
  notificationId: "follow_user1_user2" 
}
📤 [PushService] Found 1 token(s) for user ...  👈 SHOULD BE 1!
📤 [PushService] Data payload: { 
  type: "follow", 
  senderId: "...", 
  notificationId: "follow_user1_user2",
  icon: "..." 
}
📤 [PushService] Sending to token 1/1: abc123...
✅ [PushService] Successfully sent to token 1
✅ Push notifications sent: 1/1  👈 CRITICAL: Must be 1/1!
```

#### Expected Logs (Recipient's Browser - Service Worker):
```
[SW] Received background message: { notification, data }
[SW] ✅ First time showing tag: follow_user1_user2
[SW] Showing notification: { 
  title: "New Follower", 
  tag: "follow_user1_user2", 
  icon: "..." 
}
```

#### IF DUPLICATE (What We Want to Catch):
```
[SW] Received background message (1st time)
[SW] ✅ First time showing tag: follow_user1_user2
[SW] Showing notification...
[SW] Received background message (2nd time!)  👈 PROBLEM HERE!
[SW] ⚠️ DUPLICATE DETECTED! Skipping notification with tag: follow_user1_user2
[SW] Last shown 50ms ago
```

---

## 🔍 Possible Root Causes

### Scenario 1: Multiple FCM Tokens
**Symptom:** Vercel log shows "Found 2 token(s)"  
**Cause:** User has 2 active devices/browsers  
**Solution:** This is expected! Each device gets 1 notification  
**Check:** Are both notifications on the SAME device?

### Scenario 2: Duplicate API Calls
**Symptom:** Vercel logs show 2 separate API calls  
**Cause:** Frontend calls `/api/notifications/send-push` twice  
**Solution:** Check `followingInProgress` state protection  
**Action:** Add unique request ID logging

### Scenario 3: FCM Sends Message Twice
**Symptom:** Backend sends once, but SW receives twice  
**Cause:** FCM bug or network retry  
**Solution:** Service Worker duplicate detection (already added!)  
**Expected:** 2nd message gets blocked with warning

### Scenario 4: Service Worker Registered Twice
**Symptom:** 2 SW instances running  
**Cause:** Multiple registrations  
**Action:** Check `navigator.serviceWorker.getRegistrations()` length

---

## 🛠️ New Protection Added

### 1. Service Worker Duplicate Detection
```javascript
// firebase-messaging-sw.js
const recentNotifications = new Map();
const DUPLICATE_WINDOW_MS = 3000;

// Skip if same tag shown within 3 seconds
if (recentNotifications.has(tag)) {
  console.warn('DUPLICATE DETECTED! Skipping...');
  return;
}
```

### 2. Unique Token Filtering
```typescript
// PushNotificationService.ts
const uniqueTokens = [...new Set(tokens)];
// Only send to unique tokens
```

### 3. Frontend Race Protection
```typescript
// JourneyHub.tsx
if (followingInProgress.has(targetUserId)) {
  return; // Already in progress
}
```

---

## 📋 Testing Checklist

- [ ] Clear Service Worker cache
- [ ] Check FCM token count (should be 1 per device)
- [ ] Perform follow action
- [ ] Check Vercel logs: "Push notifications sent: X/Y"
- [ ] Check if X === number of your logged-in devices
- [ ] Check SW console for duplicate warnings
- [ ] Verify only 1 notification per device appears

---

## 🎯 Expected Results

### Single Device (Most Common):
```
Backend: "Found 1 token(s)"
Backend: "Push notifications sent: 1/1"
Device: Shows 1 notification
```

### Multiple Devices (Expected):
```
Backend: "Found 2 token(s)"
Backend: "Push notifications sent: 2/2"
Device 1: Shows 1 notification
Device 2: Shows 1 notification
```

### Duplicate Bug (What We're Fixing):
```
Backend: "Found 1 token(s)"
Backend: "Push notifications sent: 1/1"
Device: Shows 2 notifications  👈 BUG!
SW Log: "DUPLICATE DETECTED!" 👈 Our protection catches it
```

---

## 🚀 Next Steps

1. Deploy changes (Service Worker duplicate detection)
2. Clear browser cache completely
3. Test follow action
4. Post logs here:
   - Vercel API logs
   - Browser console logs
   - Service Worker logs (DevTools → Application → Service Workers → Show logs)

---

## 💡 Pro Tips

### View Service Worker Logs:
1. Chrome DevTools → Application tab
2. Service Workers section
3. Check "Update on reload"
4. Check "Show events from other origins"
5. Console will show SW logs

### Force Service Worker Update:
1. DevTools → Application → Service Workers
2. Click "Update" button
3. Or check "Update on reload" + refresh page

### Clear Everything Nuclear Option:
1. DevTools → Application → Clear storage
2. Select all checkboxes
3. Click "Clear site data"
4. Close all tabs
5. Re-open app

---

**Status:** Service Worker duplicate detection added. Test and report back! 🔍
