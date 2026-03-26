console.log('SW test file loaded successfully');

// Test basic Service Worker functionality
self.addEventListener('install', (event) => {
  console.log('SW installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('SW activated');
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Just pass through, no caching for test
});
