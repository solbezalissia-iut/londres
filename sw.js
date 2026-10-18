/* Garde le site disponible hors connexion (métro, avion, pas de forfait à l'étranger).
   - À l'installation : met en cache tout le site, chaque voyage et les polices.
   - Ensuite : essaie le réseau (pour avoir les mises à jour), mais si la connexion
     ne répond pas en 3 secondes ou est absente, sert la copie enregistrée. */
importScripts("voyages.js");
const VERSION = "2026-10-18";
const CACHE = "carnets-" + VERSION;
const FONTS = "carnets-polices";
const FONT_CSS = "https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600;700&family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&family=IBM+Plex+Mono:wght@500;600&display=swap";
const FILES = ["./", "index.html", "app.js", "voyages.js", "manifest.webmanifest", "icon.svg", "icon-192.png", "icon-512.png",
  ...(self.VOYAGES || []).map(v => "voyages/" + v + ".js")];

self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(FILES.map(f => new Request(f, { cache: "reload" })));
    try { // polices : la feuille de style puis chaque fichier de police qu'elle cite
      const fc = await caches.open(FONTS), r = await fetch(FONT_CSS);
      if (r.ok) {
        const css = await r.clone().text(); await fc.put(FONT_CSS, r);
        const urls = [...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com[^)]+)\)/g)].map(m => m[1]);
        await Promise.all(urls.map(u => fetch(u, { mode: "cors" }).then(x => x.ok && fc.put(u, x)).catch(() => {})));
      }
    } catch (err) {}
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE && k !== FONTS).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

const timeout = (p, ms) => new Promise((res, rej) => { const t = setTimeout(() => rej(new Error("lent")), ms); p.then(v => { clearTimeout(t); res(v); }, err => { clearTimeout(t); rej(err); }); });

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // polices Google : cache d'abord (elles ne changent pas)
  if (/fonts\.(googleapis|gstatic)\.com$/.test(url.host)) {
    e.respondWith(caches.open(FONTS).then(async c => (await c.match(req)) || fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; })));
    return;
  }
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
