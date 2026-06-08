/* ============================================
   ZEESHAN HOSPITAL — Service Worker
   Progressive Web App offline caching
   ============================================ */

const CACHE_NAME = 'zh-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/login.html',
  '/about.html',
  '/features.html',
  '/pricing.html',
  '/consultancy.html',
  '/404.html',
  '/privacy-policy.html',
  '/terms-of-service.html',
  '/css/style.css',
  '/css/business.css',
  '/js/firebase-config.js',
  '/js/main.js',
  '/manifest.json',
  '/assets/logo.png',
  '/robots.txt',
  '/sitemap.xml'
];

// Install — cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch — serve from cache first, network fallback
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip Firebase API calls
  if (event.request.url.includes('firebaseio.com') ||
      event.request.url.includes('googleapis.com') ||
      event.request.url.includes('gstatic.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      // Return cached response if available
      if (cached) return cached;

      // Otherwise fetch from network
      return fetch(event.request).then(response => {
        // Cache successful responses for static assets
        if (response.ok && (
            event.request.url.includes('.css') ||
            event.request.url.includes('.js') ||
            event.request.url.includes('.png') ||
            event.request.url.includes('.jpg') ||
            event.request.url.includes('.svg') ||
            event.request.url.includes('.webp') ||
            event.request.url.includes('.ico') ||
            event.request.url.includes('.xml') ||
            event.request.url.includes('.json'))) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // If offline and page not cached, show 404
        if (event.request.mode === 'navigate') {
          return caches.match('/404.html');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});
