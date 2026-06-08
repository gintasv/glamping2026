// Service worker — makes the app installable and usable offline.
//
// Strategy:
//   • App shell + local images are precached on install.
//   • Navigations: network-first, fall back to the cached shell when offline.
//   • Other GETs: stale-while-revalidate (instant from cache, refreshed in bg).
//   • Live data (Firestore, Firebase SDK, Open-Meteo) is never cached — those
//     calls go straight to the network and degrade gracefully when offline
//     (sync falls back to local; the forecast shows its static fallback).
//
// Bump CACHE_VERSION whenever the shell assets change so old caches are purged.
const CACHE_VERSION = "v4";
const CACHE = `devils-lake-g3-${CACHE_VERSION}`;

const SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./sync.js",
  "./data.js",
  "./checklist.js",
  "./firebase-config.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-180.png",
  "./icons/favicon-32.png",
  "./images/trails/boulders.jpg",
  "./images/trails/east-bluff.jpg",
  "./images/trails/beach.jpg",
  "./images/trails/doorway.jpg",
  "./images/trails/nature-center.jpg",
];

// Requests that must always hit the network (live/dynamic data).
function isLiveData(url) {
  return (
    url.includes("firestore.googleapis.com") ||
    url.includes("/firebasejs/") ||
    url.includes("api.open-meteo.com")
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      // addAll is atomic — ignore individual misses by caching best-effort.
      .then((cache) => Promise.allSettled(SHELL.map((u) => cache.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  if (isLiveData(req.url)) return; // let the network handle live data

  // Navigations → network-first, fall back to cached shell offline.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("./index.html", copy));
          return res;
        })
        .catch(() => caches.match("./index.html").then((m) => m || caches.match("./")))
    );
    return;
  }

  // Everything else → stale-while-revalidate.
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && (res.type === "basic" || res.type === "cors")) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
