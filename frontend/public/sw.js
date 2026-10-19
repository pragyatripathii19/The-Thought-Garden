// The Thought Garden service worker.
// Keeps the app's own files on the device so it opens straight away, even while the server wakes up.
// It never touches /api: thoughts and account data always come live from the server.

const SHELL = 'tg-shell-v1'; // the page, icons and manifest
const ASSETS = 'tg-assets-v1'; // built files with a content hash in their name, so they never change
const FONTS = 'tg-fonts-v1';
const KEEP = [SHELL, ASSETS, FONTS];
const MAX_ASSETS = 150;
const PAGE_TIMEOUT_MS = 2500;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => cache.addAll(['/', '/manifest.webmanifest', '/favicon.svg']))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => !KEEP.includes(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith('/api/')) return;
    if (request.mode === 'navigate') return event.respondWith(openPage(event));
    if (url.pathname.startsWith('/assets/')) return event.respondWith(cacheFirst(request));
    return event.respondWith(staleWhileRevalidate(event, SHELL));
  }
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(staleWhileRevalidate(event, FONTS));
  }
});

/**
 * The page: the latest from the server, unless it takes longer than a moment (the free server
 * sleeping), then the saved copy. Every route is the same single page, saved under '/'.
 */
async function openPage(event) {
  const cache = await caches.open(SHELL);
  const fresh = fetch(event.request).then((response) => {
    if (response.ok) cache.put('/', response.clone());
    return response;
  });
  event.waitUntil(fresh.catch(() => {}));
  const saved = await cache.match('/');
  if (!saved) return fresh;
  const freshOrSaved = fresh.then((response) => (response.ok ? response : saved), () => saved);
  const timeout = new Promise((resolve) => setTimeout(() => resolve(saved), PAGE_TIMEOUT_MS));
  return Promise.race([freshOrSaved, timeout]);
}

/** Built files: from the device if saved, otherwise fetched once and saved. */
async function cacheFirst(request) {
  const cache = await caches.open(ASSETS);
  const saved = await cache.match(request);
  if (saved) return saved;
  const response = await fetch(request);
  if (response.ok) {
    await cache.put(request, response.clone());
    const keys = await cache.keys();
    await Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_ASSETS)).map((key) => cache.delete(key)));
  }
  return response;
}

/** Small files that rarely change: the saved copy now, refreshed in the background. */
async function staleWhileRevalidate(event, cacheName) {
  const cache = await caches.open(cacheName);
  const saved = await cache.match(event.request);
  const fresh = fetch(event.request).then((response) => {
    if (response.ok || response.type === 'opaque') cache.put(event.request, response.clone());
    return response;
  });
  event.waitUntil(fresh.catch(() => {}));
  return saved || fresh;
}
