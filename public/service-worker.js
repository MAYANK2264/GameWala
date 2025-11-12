const STATIC_CACHE = 'gamewala-static-v2'
const PRECACHE_ASSETS = ['/', '/index.html', '/manifest.json']
const AUTH_PATH_MARKERS = ['__/auth/', '/auth/', 'firebaseapp.com', 'googleapis.com/identitytoolkit']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_ASSETS)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  // Always go to the network for Firebase Auth handlers and external APIs
  if (AUTH_PATH_MARKERS.some((marker) => url.href.includes(marker))) {
    event.respondWith(fetch(request).catch(() => caches.match(request)))
    return
  }

  // Cache-first for same-origin static assets
  if (url.origin === self.location.origin && (url.pathname.startsWith('/assets/') || /\.(?:js|css|png|jpg|svg|webp|ico)$/.test(url.pathname))) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) return cached
          return fetch(request).then((response) => {
            cache.put(request, response.clone())
            return response
          })
        })
      )
    )
    return
  }

  // Network-first for everything else to keep data fresh
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (url.origin === self.location.origin && response.status === 200) {
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, response.clone()))
        }
        return response
      })
      .catch(() => caches.match(request))
  )
})
