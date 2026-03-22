// =============================================================================
// FIREBASE MESSAGING (Push Notifications)
// =============================================================================
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase
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
  console.log('[sw.js] Received background message', payload);

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

// =============================================================================
// PWA CACHE
// =============================================================================
const CACHE_NAME = 'tripnoute-v3';

// Assets to cache on install (sadece ikonlar ve manifest)
const PRECACHE_ASSETS = [
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/tripnoute-logo.png',
];

// Install: pre-cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first for everything except images
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip non-http(s) requests (chrome-extension, etc.)
  if (!url.protocol.startsWith('http')) return;

  // Next.js JS/CSS chunks — ASLA cache'leme, her zaman network
  if (url.pathname.startsWith('/_next/')) {
    event.respondWith(fetch(request));
    return;
  }

  // Skip Firebase, Mapbox, external APIs — always network
  const isExternal =
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('mapbox') ||
    url.hostname.includes('google') ||
    url.hostname.includes('firebaseio');

  if (isExternal) {
    event.respondWith(fetch(request));
    return;
  }

  // Skip Next.js API routes — always network
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // For navigation requests (HTML pages): network-first
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
    );
    return;
  }

  // Sadece ikonlar ve manifest için cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && (
          url.pathname.startsWith('/icons/') ||
          url.pathname === '/manifest.json' ||
          url.pathname.endsWith('.png') ||
          url.pathname.endsWith('.jpg')
        )) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});

// =============================================================================
// NOTIFICATION CLICK HANDLER
// =============================================================================
self.addEventListener('notificationclick', (event) => {
  console.log('[sw.js] Notification click received.');

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


// Install: pre-cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first for API/Firebase, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip non-http(s) requests (chrome-extension, etc.)
  if (!url.protocol.startsWith('http')) return;

  // Skip Firebase, Mapbox, external APIs — always network
  const isExternal =
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('mapbox') ||
    url.hostname.includes('google') ||
    url.hostname.includes('firebaseio');

  if (isExternal) {
    event.respondWith(fetch(request));
    return;
  }

  // Skip Next.js API routes — always network
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // For navigation requests (HTML pages): network-first
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
    );
    return;
  }

  // For static assets (images, fonts, etc.): cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});
