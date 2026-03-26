// Firebase Cloud Messaging Service Worker
// This file handles background push notifications

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: 'AIzaSyBsIRIBq5Xw8PpPVfs5I1Qv1MdvPB5m_HI',
  authDomain: 'trip-noute.firebaseapp.com',
  projectId: 'trip-noute',
  storageBucket: 'trip-noute.firebasestorage.app',
  messagingSenderId: '670419599620',
  appId: '1:670419599620:web:14bdcf5f609858d8c8d051',
  measurementId: 'G-G86FDVFYWN'
});

const messaging = firebase.messaging();

// Track recently shown notifications to prevent duplicates
const recentNotifications = new Map(); // tag -> timestamp
const DUPLICATE_WINDOW_MS = 3000; // 3 seconds

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [tag, timestamp] of recentNotifications.entries()) {
    if (now - timestamp > DUPLICATE_WINDOW_MS) {
      recentNotifications.delete(tag);
    }
  }
}, 5000);

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Received background message:', payload);
  
  // Extract data from payload
  const notificationData = payload.data || {};
  const notificationTag = notificationData.notificationId || `notif_${Date.now()}`;
  const icon = notificationData.icon || '/tripnoute-logo.png';

  // CRITICAL: Check if we already showed this notification recently
  const now = Date.now();
  const lastShown = recentNotifications.get(notificationTag);
  
  if (lastShown && (now - lastShown < DUPLICATE_WINDOW_MS)) {
    console.warn(`[SW] ⚠️ DUPLICATE DETECTED! Skipping notification with tag: ${notificationTag}`);
    console.warn(`[SW] Last shown ${now - lastShown}ms ago`);
    return; // Skip duplicate
  }
  
  // Mark as shown
  recentNotifications.set(notificationTag, now);
  console.log(`[SW] ✅ First time showing tag: ${notificationTag}`);

  const notificationTitle = payload.notification?.title || 'TripNoute';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: icon, // Get icon from data payload
    badge: '/icons/icon-96x96.png',
    tag: notificationTag, // CRITICAL: Same tag = replace old notification
    data: notificationData,
    requireInteraction: false,
    vibrate: [200, 100, 200],
    renotify: false, // Don't vibrate again if same tag
  };

  console.log('[SW] Showing notification:', {
    title: notificationTitle,
    tag: notificationTag,
    icon: icon
  });

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.');

  event.notification.close();

  // Get notification data
  const data = event.notification.data;
  let urlToOpen = '/dashboard';

  if (data?.type === 'follow' && data?.senderId) {
    urlToOpen = `/profile/${data.senderId}`;
  } else if (data?.type === 'like' && data?.postId) {
    urlToOpen = `/post/${data.postId}`;
  } else if (data?.type === 'comment' && data?.postId) {
    urlToOpen = `/post/${data.postId}`;
  }

  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
