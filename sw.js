const CACHE_NAME = 'nic-flashcard-v1';
const STATIC_ASSETS = [
  '/nic-flashcard/',
  '/nic-flashcard/index.html',
  '/nic-flashcard/manifest.json',
];

// インストール時: 静的アセットをキャッシュ
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// アクティベート時: 古いキャッシュを削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// フェッチ戦略:
// phrases.json → Network first（最新データ優先）、失敗時はキャッシュ
// その他 → Cache first
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (url.pathname.endsWith('phrases.json')) {
    // Network first for data
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // Cache first for static assets
    event.respondWith(
      caches.match(event.request).then(cached => {
        return cached || fetch(event.request).then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        });
      })
    );
  }
});
