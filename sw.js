const CACHE_NAME = 'telugu-bible-v6';


const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './logo.svg',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Noto+Sans+Telugu:wght@300;400;500;600;700&display=swap'
];


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


const DATA_ASSETS = BIBLE_BOOKS.map(book => `./data/${encodeURIComponent(book)}.json`);


const ALL_ASSETS = [...STATIC_ASSETS, ...DATA_ASSETS];


self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Pre-caching offline assets...');
        
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


self.addEventListener('fetch', event => {
  
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  
  if (url.origin === self.location.origin || url.hostname.includes('fonts.gstatic.com') || url.hostname.includes('fonts.googleapis.com')) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          
          return cachedResponse;
        }

        
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
          
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('./index.html');
          }
        });
      })
    );
  }
});
