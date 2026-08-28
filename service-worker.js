// Service Worker - Rapport AMES DRV BOSCH
// Stratégie : "cache d'abord, réseau en secours", pour un fonctionnement
// 100% hors ligne une fois la première visite effectuée.

const CACHE_VERSION = 'v4';
const CACHE_NAME = 'rapport-drv-' + CACHE_VERSION;

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
];

// Installation : on met en cache tous les fichiers de l'application
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activation : on supprime les anciens caches (versions précédentes)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Interception des requêtes : cache d'abord, réseau en secours
// (et mise à jour silencieuse du cache si le réseau répond)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => cached);

      // Sert le cache immédiatement s'il existe, sinon attend le réseau
      return cached || networkFetch;
    })
  );
});
