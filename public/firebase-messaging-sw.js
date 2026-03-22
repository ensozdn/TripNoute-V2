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

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification?.title || 'TripNoute';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/tripnoute-logo.png',
    badge: '/icons/icon-96x96.png',
    tag: payload.data?.notificationId || 'default',
    data: payload.data,
    requireInteraction: false,
    vibrate: [200, 100, 200]
  };

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
