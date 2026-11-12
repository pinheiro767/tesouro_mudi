/* PWA MAYA + THEO: instala sem precisar pré-carregar toda a pasta assets */
const CACHE = 'mudi-maya-theo-pwa-sem-assets-v4';
const SHELL = ['./','./index.html','./manifest.json','./manifest.webmanifest',
  './theo.js','./theo.css',
  './icons/icon-192.png','./icons/icon-512.png',
  './icons/icon-maskable-192.png','./icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('mudi-maya-theo-pwa-') && k !== CACHE).map(k => caches.delete(k)))),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if(request.method !== 'GET') return;
  const url = new URL(request.url);
  if(url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  if(request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      if(response.ok) {const cloned = response.clone(); caches.open(CACHE).then(cache => cache.put(request, cloned));}
      return response;
    }).catch(() => caches.match(request).then(r => r || caches.match('./index.html'))));
    return;
  }
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if(response.ok) {const cloned = response.clone(); caches.open(CACHE).then(cache => cache.put(request, cloned));}
    return response;
  })));
});
