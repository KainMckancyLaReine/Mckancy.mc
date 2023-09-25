// service-worker.js

// Cache a list of files when the service worker is installed
self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open('pp-cache').then((cache) => {
        return cache.addAll([
          '/',
          '/index.html',
          '/manifest.json',
          // Add paths to other static assets like JavaScript, CSS, and images
        ]);
      })
    );
  });
  
  // Serve cached files when there's no network connection
  self.addEventListener('fetch', (event) => {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  });
  
  // Clean up old caches when a new service worker is activated
  self.addEventListener('activate', (event) => {
    const cacheWhitelist = ['your-app-cache'];
  
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!cacheWhitelist.includes(cacheName)) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    );
  });
  