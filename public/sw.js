const CACHE = 'varman-v2'
const ASSETS = ['/', '/index.html']

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)))
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))))
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)
  // Ignorer les requêtes API et non-GET
  if(e.request.method !== 'GET') return
  if(url.hostname === 'api.varman.ch') return
  if(url.pathname.includes('favicon')) return
  if(url.pathname.includes('icon')) return
  // Pour les autres, réseau d'abord puis cache
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  )
})
