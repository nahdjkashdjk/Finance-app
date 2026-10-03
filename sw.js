// Finance – service worker: maakt de app offline beschikbaar.
// Verhoog VERSION bij elke nieuwe versie van index.html.
const VERSION = 'finance-v10';
const ASSETS = [
  './', './index.html', './manifest.webmanifest',
  './icons/icon-192-v2.png', './icons/icon-512-v2.png', './icons/maskable-192-v2.png', './icons/maskable-512-v2.png',
  './icons/apple-touch-icon-v2.png', './icons/favicon-64-v2.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Eerst uit de cache (snel en offline), op de achtergrond bijwerken voor de volgende keer
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const url = new URL(req.url);
  const scope = new URL(self.registration.scope);
  const isApp = req.mode === 'navigate' && (url.pathname === scope.pathname || url.pathname === scope.pathname + 'index.html');
  if (req.mode === 'navigate' && !isApp) return;   // andere adressen (zoals een afbeelding) gewoon van het internet
  e.respondWith(caches.open(VERSION).then(async cache => {
    const key = isApp ? './index.html' : req;
    const cached = await cache.match(key, { ignoreSearch: true });
    const update = fetch(req).then(res => {
      if (res.ok) cache.put(key, res.clone());
      return res;
    }).catch(() => cached);
    return cached || update;
  }));
});
