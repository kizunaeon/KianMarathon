// 馬拉松備戰計畫 - 離線快取
// 策略：優先抓最新版本(網路優先)，抓不到（沒網路）才退回快取版本，
// 這樣平常有網路時永遠看得到 Claude 更新的最新內容，只有離線時才吃快取。
const CACHE_NAME = 'kobe-marathon-plan-v1';
const PRECACHE_URLS = [
  './',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'icon-192-maskable.png',
  'icon-512-maskable.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => {}) // 某個檔案抓不到也不要讓整個安裝失敗
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => cached || caches.match('./'))
      )
  );
});
