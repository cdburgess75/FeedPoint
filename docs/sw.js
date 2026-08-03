/* FEEDPOINT service worker — network-first with full offline fallback.
   Fresh when online, complete app from cache when not. */
const CACHE = "feedpoint-site-v2";
const ASSETS = ["./", "apple-touch-icon.png", "icon-512.png", "manifest.webmanifest",
  "favicon.ico", "favicon-16.png", "favicon-32.png", "mask-icon.svg"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then(r => {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return r;
      })
      .catch(() =>
        caches.match(e.request, { ignoreSearch: true }).then(m => m || caches.match("./"))
      )
  );
});
