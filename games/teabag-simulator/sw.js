const CACHE_NAME = 'teabag-sim-v6';
const ASSETS = [
  './',
  './teabag-simulator.html',
  './sfx/sounds.js',
  './vendor/gsap.min.js',
  './runtime/npc-render-shared.js',
  './data/npc_payloads/index.json',
  './data/npc_payloads/strict-valid.json',
  './data/npc_payloads/visual-override.json',
  './sprites/mchat.png',
  './sprites/busstop.png',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
