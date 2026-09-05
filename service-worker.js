const CACHE = "school-garden-v12";
const BASE = "/school-garden/";
const MOBILE_CSS = BASE + "mobile-fixes.css?v=21";
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
  BASE + "icons/icon-maskable-512-v19.png",
  MOBILE_CSS
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

async function injectMobileStyles(response) {
  if (!response || !response.ok) return response;
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) return response;

  const html = await response.text();
  if (html.includes("mobile-fixes.css")) {
    return new Response(html, { status: response.status, statusText: response.statusText, headers: response.headers });
  }

  const stylesheet = `<link rel="stylesheet" href="${MOBILE_CSS}">`;
  const patched = html.includes("</head>")
    ? html.replace("</head>", `${stylesheet}</head>`)
    : stylesheet + html;

  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.delete("content-encoding");
  return new Response(patched, { status: response.status, statusText: response.statusText, headers });
}

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.hostname.includes("open-meteo.com")) return;

  if (event.request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const networkResponse = await fetch(event.request);
        const styledResponse = await injectMobileStyles(networkResponse);
        const copy = styledResponse.clone();
        caches.open(CACHE).then(cache => cache.put(BASE + "index.html", copy)).catch(()=>{});
        return styledResponse;
      } catch (error) {
        const cached = await caches.match(BASE + "index.html");
        return cached || Response.error();
      }
    })());
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
