const CACHE_NAME = 'finflow-v2'
const STATIC_ASSETS = [
  '/',
  '/index.html',
]

// Install: cache shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch: network-first for HTML, cache-first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET
  if (request.method !== 'GET') return

  // HTML: network-first
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request).then((response) => {
        const clone = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        return response
      }).catch(() => caches.match(request) || caches.match('/'))
    )
    return
  }

  // Assets: cache-first
  if (url.pathname.match(/\.(js|css|woff2?|png|jpg|svg|webp|ico)$/)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          return response
        })
      })
    )
    return
  }

  // Default: network with cache fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  )
})

// ── Push Notification Support ──

// Handle push events (for future server-side push)
self.addEventListener('push', (event) => {
  let data = { title: 'FinFlow', body: 'Nova notificação' }
  
  if (event.data) {
    try {
      data = event.data.json()
    } catch {
      data.body = event.data.text()
    }
  }

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: data.data || { url: '/' },
    actions: data.actions || [],
    tag: data.tag || 'finflow-notification',
    renotify: data.renotify || false,
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Handle notification click — open the app on the correct page
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If the app is already open, focus it
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(url)
            return client.focus()
          }
        }
        // Otherwise open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(url)
        }
      })
  )
})

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  // Analytics or logging could go here
})

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'finflow-check-notifications') {
    event.waitUntil(checkAndNotify())
  }
})

// Background sync check
async function checkAndNotify() {
  // This would ideally fetch from a server
  // For local-only, we rely on the client-side checks
  const clients = await self.clients.matchAll({ type: 'window' })
  if (clients.length > 0) {
    clients[0].postMessage({ type: 'CHECK_NOTIFICATIONS' })
  }
}
