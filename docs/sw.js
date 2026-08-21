/* FeedPoint service worker — FlockOff update methodology.
   The build version is stamped in at deploy time, so every release ships a
   byte-different worker. That is what lets the browser notice an update and
   offer the in-app "Update now" banner. The updated worker WAITS (no
   skipWaiting on install) until the user taps the banner.

   Cache strategy stays network-first with full offline fallback: fresh when
   online, complete app from cache when not. The cache name carries the
   version, so a new release starts a fresh cache and drops the old one. */
const VERSION = "__BUILD_VERSION__";
const CACHE = "feedpoint-site-" + VERSION;
const ASSETS = ["./", "apple-touch-icon.png", "icon-512.png", "manifest.webmanifest",
  "touch-icon-180-v15.png", "icon-512-v15.png",
  "favicon.ico", "favicon-16.png", "favicon-32.png", "mask-icon.svg"];

self.addEventListener("install", e => {
  // No skipWaiting: a first install activates on its own; an *update* waits
  // so the page can offer the "Update now" button.
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.all(ASSETS.map(u => c.add(u).catch(() => {})))
    )
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// The page posts this when the user taps "Update now".
self.addEventListener("message", e => {
  if (e.data && e.data.type === "SKIP_WAITING") self.skipWaiting();
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
