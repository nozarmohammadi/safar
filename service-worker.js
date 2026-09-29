const CACHE_NAME = 'karkere-v3';
const URLS = [
  '/safar/',
  '/safar/index.html',
  '/safar/manifest.json',
  '/safar/icon-192.png',
  '/safar/icon-512.png',
  '/safar/apple-touch-icon.png'
];

// نصب: کش کردن فایل‌ها
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.all(
        URLS.map(url => {
          return fetch(url).then(response => {
            if (response.ok) {
              return cache.put(url, response);
            }
          }).catch(() => {});
        })
      );
    })
  );
});

// فعال‌سازی
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// fetch: اول کش، اگه نبود شبکه
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  // برای فایل‌های CDN (فونت، کتابخانه)، از cache-first استفاده کن
  const url = new URL(event.request.url);
  
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      
      return fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      }).catch(() => {
        // اگه آفلاین و درخواست صفحه بود، index.html بده
        if (event.request.mode === 'navigate') {
          return caches.match('/safar/index.html');
        }
      });
    })
  );
});
