const STATIC_CACHE_NAME = 'jarvis-static-v1';
const DYNAMIC_CACHE_NAME = 'jarvis-dynamic-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/hooks/useJarvis.ts',
  '/services/geminiService.ts',
  '/components/JarvisOrb.tsx',
  '/components/ChatLog.tsx',
  '/components/MicButton.tsx',
  '/icon.svg'
];

// INSTALL: Cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then(cache => {
      console.log('Service Worker: Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// ACTIVATE: Clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// FETCH: Serve from cache, fallback to network, and cache dynamically
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
      return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse; // Return from cache if found
      }
      // Not in cache, fetch from network
      return fetch(event.request).then(networkResponse => {
        // We only cache successful responses and remote resources
        const isRemoteResource = event.request.url.startsWith('https://');
        
        if (isRemoteResource && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
            return caches.open(DYNAMIC_CACHE_NAME).then(cache => {
              cache.put(event.request.url, networkResponse.clone());
              return networkResponse;
            });
        }
        return networkResponse;
      });
    }).catch(error => {
        console.error("Service Worker fetch failed:", error);
        // Optional: Return a fallback offline page here if one was cached
    })
  );
});
