const CACHE = "school-garden-v11";
const BASE = "/school-garden/";
const CORE = [
  BASE,
  BASE + "index.html",
  BASE + "manifest.webmanifest?v=20",
  BASE + "favicon.ico?v=20",
  BASE + "favicon-32x32.png?v=20",
  BASE + "android-chrome-192x192.png?v=20",
  BASE + "android-chrome-512x512.png?v=20",
  BASE + "apple-touch-icon.png?v=20",
  BASE + "icons/icon-192-v19.png",
  BASE + "icons/icon-512-v19.png",
  BASE + "icons/icon-maskable-512-v19.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.hostname.includes("open-meteo.com")) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(BASE + "index.html", copy)).catch(()=>{});
          return response;
        })
        .catch(() => caches.match(BASE + "index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      if (response && response.ok && url.origin === self.location.origin) {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy)).catch(()=>{});
      }
      return response;
    }))
  );
});
