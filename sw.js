const CACHE_NAME = 'telugu-bible-v6';

// Static Shell Assets
const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './logo.svg',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Noto+Sans+Telugu:wght@300;400;500;600;700&display=swap'
];

// All 66 Books + Books index JSON files
const BIBLE_BOOKS = [
  "1 Chronicles", "1 Corinthians", "1 John", "1 Kings", "1 Peter", "1 Samuel", "1 Thessalonians", "1 Timothy",
  "2 Chronicles", "2 Corinthians", "2 John", "2 Kings", "2 Peter", "2 Samuel", "2 Thessalonians", "2 Timothy",
  "3 John", "Acts", "Amos", "Books", "Colossians", "Daniel", "Deuteronomy", "Ecclesiastes", "Ephesians",
  "Esther", "Exodus", "Ezekiel", "Ezra", "Galatians", "Genesis", "Habakkuk", "Haggai", "Hebrews", "Hosea",
  "Isaiah", "James", "Jeremiah", "Job", "Joel", "John", "Jonah", "Joshua", "Jude", "Judges", "Lamentations",
  "Leviticus", "Luke", "Malachi", "Mark", "Matthew", "Micah", "Nahum", "Nehemiah", "Numbers", "Obadiah",
  "Philemon", "Philippians", "Proverbs", "Psalms", "Revelation", "Romans", "Ruth", "Song of Songs", "Titus",
  "Zechariah", "Zephaniah"
];

// Map book names to their JSON file paths
const DATA_ASSETS = BIBLE_BOOKS.map(book => `./data/${encodeURIComponent(book)}.json`);

// Combined cache list
const ALL_ASSETS = [...STATIC_ASSETS, ...DATA_ASSETS];

// Install Event - Pre-cache all assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Pre-caching offline assets...');
        // We use addAll but wrap it in an error-tolerant structure to ensure installation completes even if a font is slow
        return Promise.all(
          ALL_ASSETS.map(url => {
            return cache.add(url).catch(err => {
              console.error(`[Service Worker] Failed to cache asset: ${url}`, err);
            });
          })
        );
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheKeys => {
      return Promise.all(
        cacheKeys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Cache-First, Fallback to Network
self.addEventListener('fetch', event => {
  // Avoid caching non-GET requests or external extensions
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Handle same-origin assets or specific CDN font files
  if (url.origin === self.location.origin || url.hostname.includes('fonts.gstatic.com') || url.hostname.includes('fonts.googleapis.com')) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          // Return cached resource immediately
          return cachedResponse;
        }

        // Otherwise, fetch from network and cache it dynamically
        return fetch(event.request).then(networkResponse => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        }).catch(err => {
          console.error('[Service Worker] Fetch failed offline:', err);
          // If offline and request is HTML, return the cached index
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('./index.html');
          }
        });
      })
    );
  }
});
