const CACHE = "school-garden-v13";
const BASE = new URL("./", self.location.href).pathname;
const CORE = [BASE, BASE + "index.html", BASE + "manifest.webmanifest", BASE + "mobile-fixes.css?v=22"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)));
  self.skipWaiting();
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k =>
    k !== CACHE && (k.startsWith("school-garden-") || k.startsWith("garden-climate-journal-"))
  ).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if(request.method !== "GET" || url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;
  const networkFirst = request.mode === "navigate" || ["script", "style"].includes(request.destination);
  const cacheKey = request.mode === "navigate" ? BASE + "index.html" : request;
  if(networkFirst){
    event.respondWith(fetch(request).then(response => {
      if(response.ok) caches.open(CACHE).then(cache => cache.put(cacheKey,response.clone())).catch(()=>{});
      return response;
    }).catch(async () => (await caches.match(cacheKey)) || Response.error()));
  }else{
    event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
      if(response.ok) caches.open(CACHE).then(cache => cache.put(request,response.clone())).catch(()=>{});
      return response;
    })));
  }
});
