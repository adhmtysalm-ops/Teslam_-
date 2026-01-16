const CACHE_NAME = "teslam-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/post.html",
  "/about.html",
  "/contact.html",
  "/privacy.html",
  "/terms.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png"
];

// 1. تثبيت الكاش (Install)
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. تفعيل وتنظيف الكاش القديم (Activate)
self.addEventListener("activate", (event) => {
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

// 3. استدعاء الملفات (Network First Strategy)
// يحاول يجيب من النت الأول، لو مفيش نت يجيب من الكاش
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const resClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, resClone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

