// Smart Community Health Camp Service Worker (PWA Offline Engine v2.0)
const CACHE_NAME = 'healthcamp-pwa-v3';
const STATIC_PUBLIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json'
];

// Sensitive endpoints that MUST NEVER be cached locally to prevent PHI leaks on shared devices
const SENSITIVE_API_PATTERNS = [
  /\/api\/v1\/reports/,
  /\/api\/v1\/medical-reports/,
  /\/api\/v1\/health-id/,
  /\/api\/v1\/patients\//,
  /\/api\/v1\/audit/,
  /\/api\/v1\/auth\//
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_PUBLIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // STRICT PRIVACY RULE: Never store sensitive medical data in browser caches
  const isSensitiveEndpoint = SENSITIVE_API_PATTERNS.some((pattern) => pattern.test(url));
  if (isSensitiveEndpoint) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Medical data cannot be accessed offline for patient privacy reasons. Please reconnect to a secure network.',
            requiresNetwork: true,
            isOffline: true,
          }),
          {
            headers: { 'Content-Type': 'application/json' },
            status: 503,
          }
        );
      })
    );
    return;
  }

  // Standard API endpoints (public camp discovery, public awareness, offline sync ingestion)
  if (url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Network offline. Actions will be queued locally in secure offline storage for batch synchronization.',
            isOffline: true,
          }),
          {
            headers: { 'Content-Type': 'application/json' },
            status: 503,
          }
        );
      })
    );
    return;
  }

  // Static assets (App shell, JS, CSS, Fonts, Images): Cache First with Network Fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          event.request.method === 'GET' &&
          !url.includes('chrome-extension')
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});
