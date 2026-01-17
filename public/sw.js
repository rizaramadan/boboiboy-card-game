// Service Worker for BoBoiBoy Card Game PWA
const CACHE_NAME = 'boboiboy-game-v1';
const DYNAMIC_CACHE = 'boboiboy-dynamic-v1';

// Core app files to cache immediately
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
];

// Game assets to cache
const GAME_ASSETS = [
  // Icons
  '/icons/icon-72x72.svg',
  '/icons/icon-96x96.svg',
  '/icons/icon-128x128.svg',
  '/icons/icon-144x144.svg',
  '/icons/icon-152x152.svg',
  '/icons/icon-192x192.svg',
  '/icons/icon-384x384.svg',
  '/icons/icon-512x512.svg',

  // Monsters
  '/assets/monsters/monster_green.svg',
  '/assets/monsters/monster_blue.svg',
  '/assets/monsters/alien_blue.svg',
  '/assets/monsters/monster_red.svg',
  '/assets/monsters/robot_purple.svg',
  '/assets/monsters/monster_blackdragon.png',
  '/assets/monsters/alien_green.svg',
  '/assets/monsters/mythical_cerberus_robot.svg',
  '/assets/monsters/mythical_dragon_robot.svg',
  '/assets/monsters/mythical_hydra_robot.svg',
  '/assets/monsters/mythical_griffin_robot.svg',
  '/assets/monsters/mythical_minotaur_robot.svg',
  '/assets/monsters/mythical_phoenix_robot.svg',

  // Heroes
  '/assets/hero/hero_placeholder.svg',
  '/assets/hero/spaceship.svg',

  // UI
  '/assets/ui/meteor.svg',
  '/assets/ui/star_empty.svg',
  '/assets/ui/space_smash.svg',
  '/assets/ui/button.svg',
  '/assets/ui/planet_score.svg',
  '/assets/ui/smash_effect.svg',
  '/assets/ui/heart.svg',
  '/assets/ui/star.svg',

  // Asset manifest
  '/assets/manifest.json',
];

// Tesseract.js files to cache (these will be added dynamically)
const TESSERACT_URLS = [
  'https://cdn.jsdelivr.net/npm/tesseract.js@5.0.5/dist/worker.min.js',
  'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.0.0/tesseract-core-simd.wasm.js',
  'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.0.0/tesseract-core.wasm.js',
  'https://tessdata.projectnaptha.com/4.0.0/eng.traineddata.gz',
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching core and game assets...');
      return cache.addAll([...CORE_ASSETS, ...GAME_ASSETS]);
    }).then(() => {
      console.log('[SW] Core assets cached, skip waiting...');
      return self.skipWaiting();
    }).catch((error) => {
      console.error('[SW] Failed to cache assets:', error);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Service worker activated, claiming clients...');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests that aren't Tesseract or other CDN resources
  if (url.origin !== location.origin &&
      !url.href.includes('tesseract') &&
      !url.href.includes('tessdata') &&
      !url.href.includes('jsdelivr') &&
      !url.href.includes('openrouter')) {
    return;
  }

  // For OpenRouter API calls, use network only (no caching)
  if (url.href.includes('openrouter.ai')) {
    event.respondWith(fetch(request));
    return;
  }

  // Cache-first strategy for all other requests
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached response and update cache in background
        updateCacheInBackground(request);
        return cachedResponse;
      }

      // Not in cache, fetch from network
      return fetch(request).then((response) => {
        // Don't cache if response is not valid
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        // Clone the response as it can only be consumed once
        const responseToCache = response.clone();

        // Determine which cache to use
        const cacheName = shouldCacheInCore(request.url) ? CACHE_NAME : DYNAMIC_CACHE;

        // Cache the fetched response
        caches.open(cacheName).then((cache) => {
          cache.put(request, responseToCache);
        });

        return response;
      }).catch((error) => {
        console.error('[SW] Fetch failed:', error);

        // Return offline fallback for navigation requests
        if (request.mode === 'navigate') {
          return caches.match('/index.html');
        }

        // For other requests, throw error
        throw error;
      });
    })
  );
});

// Helper function to update cache in background
function updateCacheInBackground(request) {
  fetch(request).then((response) => {
    if (response && response.status === 200) {
      const cacheName = shouldCacheInCore(request.url) ? CACHE_NAME : DYNAMIC_CACHE;
      caches.open(cacheName).then((cache) => {
        cache.put(request, response);
      });
    }
  }).catch(() => {
    // Silently fail - we already have cached version
  });
}

// Helper function to determine if URL should be cached in core cache
function shouldCacheInCore(url) {
  return CORE_ASSETS.some(asset => url.includes(asset)) ||
         GAME_ASSETS.some(asset => url.includes(asset)) ||
         TESSERACT_URLS.some(tesseractUrl => url.includes(tesseractUrl));
}

// Handle messages from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    // Cache additional URLs requested by the app
    const urls = event.data.urls || [];
    caches.open(DYNAMIC_CACHE).then((cache) => {
      cache.addAll(urls);
    });
  }
});

// Pre-cache Tesseract files on first idle moment
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PRECACHE_TESSERACT') {
    console.log('[SW] Pre-caching Tesseract files...');

    caches.open(DYNAMIC_CACHE).then((cache) => {
      Promise.all(
        TESSERACT_URLS.map(url =>
          fetch(url)
            .then(response => cache.put(url, response))
            .catch(err => console.warn('[SW] Failed to cache:', url, err))
        )
      ).then(() => {
        console.log('[SW] Tesseract files cached!');
        // Notify the app that Tesseract is cached
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({ type: 'TESSERACT_CACHED' });
          });
        });
      });
    });
  }
});
