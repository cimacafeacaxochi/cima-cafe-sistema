/* Service Worker · Cima Café
   Cachea la app para que abra sin internet. Los datos se sincronizan
   con Firebase cuando hay conexión (Firestore maneja el offline solo). */

const CACHE = 'cima-cafe-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // Nunca cachear llamadas a Firebase/Google: siempre red
  if (url.includes('firestore.googleapis.com') || url.includes('googleapis.com') ||
      url.includes('gstatic.com') || url.includes('identitytoolkit')) {
    return; // deja pasar a la red normal
  }
  // App shell: cache-first con respaldo a red
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => { if (e.request.method === 'GET') c.put(e.request, copy); });
      return res;
    }).catch(() => cached))
  );
});
