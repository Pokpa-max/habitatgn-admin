// Service worker de l'app d'administration : uniquement les notifications
// push (nouvelles demandes de service…). Aucune mise en cache : l'app reste
// toujours chargée depuis le réseau.
// Les notifications sont envoyées par le site public (habitatgnweb, lib/push).

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}
  event.waitUntil(
    self.registration.showNotification(data.title || 'BâtiMoo Admin', {
      body: data.body || 'Nouvelle notification.',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      data: { href: data.href || '/' },
      tag: data.tag || undefined,
      requireInteraction: true,
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = new URL(event.notification.data?.href || '/', self.location.origin).href
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(async (clients) => {
      // Un onglet de l'admin est déjà ouvert : on l'amène au premier plan sur la bonne page
      const existing = clients.find((client) => 'focus' in client)
      if (existing) {
        try {
          const focused = await existing.focus()
          return await focused.navigate(targetUrl)
        } catch {
          // navigation refusée : nouvelle fenêtre
        }
      }
      return self.clients.openWindow(targetUrl)
    })
  )
})
