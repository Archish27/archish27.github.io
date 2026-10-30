// Retires the offline service worker the old Gatsby site installed at this
// path. Browsers re-check /sw.js on every visit, find this new version,
// install it, and it then deletes the old caches, unregisters itself and
// reloads open tabs so they load the current site from the network.
self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.map((key) => caches.delete(key)))
      await self.registration.unregister()
      const windows = await self.clients.matchAll({ type: 'window' })
      windows.forEach((client) => client.navigate(client.url))
    })(),
  )
})
