// Service worker: l'app si apre anche senza rete. Solo file pubblici dell'app e Leaflet nella versione fissata.
// Mai risposte autenticate, Supabase, routing o tile: quelli richiedono rete e l'app lo dichiara.
const CACHE = 'nfhp-app-v2';
const LEAFLET = ['https://unpkg.com/leaflet@1.9.4/dist/leaflet.css', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.add('/').catch(() => undefined);
      await Promise.all(LEAFLET.map((u) => cache.add(new Request(u, { mode: 'cors' })).catch(() => undefined)));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
      await self.clients.claim();
    })(),
  );
});

// La pagina comunica i file già caricati, così valgono anche quelli della prima visita
self.addEventListener('message', (event) => {
  if (event.data?.type !== 'precache' || !Array.isArray(event.data.urls)) return;
  const urls = event.data.urls.filter((u) => {
    try {
      return new URL(u).origin === self.location.origin;
    } catch {
      return false;
    }
  });
  event.waitUntil(caches.open(CACHE).then((c) => Promise.all(urls.map((u) => c.add(u).catch(() => undefined)))));
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (LEAFLET.includes(req.url)) {
    event.respondWith(caches.match(req.url, { ignoreVary: true }).then((hit) => hit ?? fetch(req)));
    return;
  }
  if (url.origin !== self.location.origin) return;
  // Pagina: prima la rete, così l'app si aggiorna; senza rete l'ultima salvata
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req);
          if (res.ok) (await caches.open(CACHE)).put('/', res.clone());
          return res;
        } catch {
          return (await caches.match('/', { ignoreVary: true })) ?? Response.error();
        }
      })(),
    );
    return;
  }
  // File con impronta nel nome: non cambiano
  event.respondWith(
    (async () => {
      const hit = await caches.match(req, { ignoreVary: true });
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok && res.type === 'basic') (await caches.open(CACHE)).put(req, res.clone());
      return res;
    })(),
  );
});
