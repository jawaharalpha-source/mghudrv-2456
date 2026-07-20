/* MoneyDesk service worker: cache-first with background refresh */
const CACHE = "moneydesk-v1";
self.addEventListener("install", e => {
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(self.clients.claim());
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // never touch API calls (mfapi.in etc.)
  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const cached = await cache.match(req);
      const network = fetch(req).then(res => {
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      }).catch(() => null);
      // serve cache instantly if present; refresh in background so re-uploads propagate
      return cached || network.then(r => r || new Response("Offline and not cached yet. Open once with internet.", {status: 503, headers: {"Content-Type": "text/plain"}}));
    })
  );
});
