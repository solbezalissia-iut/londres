/* Garde le site disponible hors connexion (métro, avion, pas de forfait à l'étranger).
   - À l'installation : met en cache tout le site, chaque voyage, les polices et les icônes.
   - Ensuite : essaie le réseau (pour avoir les mises à jour), mais si la connexion
     ne répond pas en 3 secondes ou est absente, sert la copie enregistrée. */
importScripts("voyages.js");
const VERSION = "2026-10-18f";
const CACHE = "carnets-" + VERSION;
const FILES = ["./", "index.html", "app.js", "icons.js", "voyages.js", "outils/carnet-build.js", "lib/jszip.min.js",
  "fonts/nunito-latin-500-normal.woff2", "fonts/nunito-latin-700-normal.woff2", "fonts/nunito-latin-800-normal.woff2",
  "fonts/nunito-latin-ext-500-normal.woff2", "fonts/nunito-latin-ext-700-normal.woff2", "fonts/nunito-latin-ext-800-normal.woff2", "manifest.webmanifest", "icon.svg", "icon-192.png", "icon-512.png",
  ...(self.VOYAGES || []).map(v => "voyages/" + v + ".js")];

self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(FILES.map(f => new Request(f, { cache: "reload" })));
    // fichiers facultatifs de chaque voyage : détails chiffrés et photos du récap public
    const extra = (self.VOYAGES || []).flatMap(v => ["prive/" + v + ".enc.json", "photos/" + v + "/photos.js"]);
    await Promise.all(extra.map(f => fetch(f, { cache: "reload" }).then(r => r.ok && c.put(f, r)).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

const timeout = (p, ms) => new Promise((res, rej) => { const t = setTimeout(() => rej(new Error("lent")), ms); p.then(v => { clearTimeout(t); res(v); }, err => { clearTimeout(t); rej(err); }); });

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (url.origin !== location.origin) return;

  // pages et fichiers du site : réseau d'abord avec délai, sinon cache
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const net = fetch(req).then(r => { if (r.ok) c.put(req.mode === "navigate" ? "index.html" : req, r.clone()); return r; });
    try { return await timeout(net, 3000); }
    catch (err) {
      const hit = await c.match(req.mode === "navigate" ? "index.html" : req, { ignoreSearch: true });
      if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
      try { return await net; } catch (err2) { return (await c.match("index.html")) || Response.error(); }
    }
  })());
});
