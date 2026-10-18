(() => {
"use strict";
/* =====================================================================
   Carnets de voyage : accueil (liste des voyages) + une page par voyage
   (programme jour par jour, photos, billets, budget, infos).
   Photos et billets restent sur l'appareil (IndexedDB), jamais sur GitHub.
   ===================================================================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const ls = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};
const plural = (n, a, b) => n + " " + (n > 1 ? (b || a + "s") : a);
const uid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/* icônes (icons.js) */
const ic = (n, cls) => `<svg class="i${cls ? " " + cls : ""}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${(self.ICONS || {})[n] || (self.ICONS || {})["map-pin"] || ""}</svg>`;
const I = { route: ic("route"), photo: ic("camera"), ticket: ic("ticket"), coin: ic("coin"), info: ic("info-circle"), back: ic("chevron-left"), plus: ic("plus") };
const SECTIONS = [["programme", "Programme", I.route], ["photos", "Photos", I.photo], ["billets", "Billets", I.ticket], ["budget", "Budget", I.coin], ["comptes", "Comptes", ic("scale")], ["infos", "Infos", I.info]];

/* une icône et une couleur pastel par étape, devinées d'après son nom (ou s.ic dans les données) */
const RULES = [
  [/décollage|aéroport|arrivée à gatwick|\(lgw\)/, "plane"], [/transfert|uber|taxi/, "car"],
  [/croisière|uber boat|bateau/, "ship"], [/téléphérique|cable car/, "cloud"],
  [/train|thameslink|elizabeth line →|navette|euston|watford|retour vers londres/, "train"],
  [/hôtel|check-in/, "bed"], [/harry potter|warner/, "wand"], [/london eye/, "building-carousel"],
  [/déjeuner|dîner/, "tools-kitchen-2"], [/cakes|gâteau|café/, "cake"], [/fleur|flower/, "flower"],
  [/sky garden|horizon 22|garden at 120|canary wharf/, "building-skyscraper"],
  [/museum|gallery|collection|tate/, "building-bank"], [/bridge/, "building-bridge"],
  [/st paul|dunstan|cathedral/, "building-church"], [/tour de londres|relève de la garde|palace|big ben/, "building-castle"],
  [/de nuit/, "moon-stars"], [/primrose|coucher/, "sunset"], [/street arches|leake/, "spray"],
  [/outernet/, "device-tv"], [/babylon/, "confetti"],
  [/market|marché/, "shopping-bag"], [/harrods|hamleys|disney|selfridges|lego|westfield|shopping|boutiques|bagages/, "building-store"],
  [/piccadilly|chinatown|leicester|covent|neal|soho|marylebone|notting/, "star"],
  [/park|gardens|venice|kensington/, "trees"], [/statue|ours/, "crown"], [/temps libre|soirée/, "sparkles"]
];
const TONE = { plane: "sky", car: "sky", ship: "sky", cloud: "sky", train: "sky", bed: "lilac", wand: "pink", "building-carousel": "pink",
  "tools-kitchen-2": "peach", cake: "peach", flower: "mint", "building-skyscraper": "lilac", "building-bank": "butter", "building-bridge": "butter",
  "building-church": "butter", "building-castle": "butter", "moon-stars": "lilac", sunset: "peach", spray: "pink", "device-tv": "pink", confetti: "pink",
  "shopping-bag": "peach", "building-store": "pink", star: "pink", trees: "mint", crown: "butter", sparkles: "lilac", "map-pin": "lilac" };
function stopIcon(s) {
  if (s.ic) return s.ic;
  const n = (s.n || "").toLowerCase();
  for (const [re, name] of RULES) if (re.test(n)) return name;
  return "map-pin";
}
const tile = (name, tone, cls) => `<span class="tile t-${tone || TONE[name] || "lilac"}${cls ? " " + cls : ""}">${ic(name)}</span>`;

/* ---------- dates ---------- */
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const isoToday = () => { const t = new Date(); return t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0"); };
const parts = iso => { const [y, m, d] = iso.split("-").map(Number); return { y, m, d }; };
function range(a, b) {
  const A = parts(a), B = parts(b);
  if (A.y === B.y && A.m === B.m) return `${A.d} → ${B.d} ${MOIS[B.m - 1]} ${B.y}`;
  if (A.y === B.y) return `${A.d} ${MOIS[A.m - 1]} → ${B.d} ${MOIS[B.m - 1]} ${B.y}`;
  return `${A.d} ${MOIS[A.m - 1]} ${A.y} → ${B.d} ${MOIS[B.m - 1]} ${B.y}`;
}
const dayDiff = (a, b) => Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 86400000);
function tripState(t) {
  if (!t.start) return { k: "soon", txt: "" };
  const today = isoToday();
  if (today < t.start) { const n = dayDiff(today, t.start); return { k: "soon", txt: n === 1 ? "Départ demain" : `Départ dans ${n} jours` }; }
  if (today > t.end) return { k: "past", txt: "Voyage terminé" };
  const i = t.days.findIndex(d => d.date === today);
  return { k: "now", txt: i >= 0 ? `En voyage, jour ${i + 1} sur ${t.days.length}` : "En voyage", day: i >= 0 ? t.days[i].id : null };
}

/* ---------- liens Google Maps ---------- */
const place = (t, q) => q + (t.city ? ", " + t.city : "");
const mapsSearch = (t, q) => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(place(t, q));
const mapsDir = (t, from, to, walk) => "https://www.google.com/maps/dir/?api=1&origin=" + encodeURIComponent(place(t, from)) +
  "&destination=" + encodeURIComponent(place(t, to)) + "&travelmode=" + (walk ? "walking" : "transit");
const dayRoute = (t, d) => "https://www.google.com/maps/dir/" + [...new Set([t.hotel && t.hotel.q, ...d.stops.map(s => s.q)].filter(Boolean))].map(q => encodeURIComponent(place(t, q))).join("/");

/* ---------- chargement des voyages ---------- */
const loadScript = src => new Promise(r => { const s = document.createElement("script"); s.src = src; s.onload = s.onerror = r; document.head.appendChild(s); });
let TRIPS = [];

/* ---------- stockage sur l'appareil (IndexedDB) ---------- */
const DB = {
  db: null, ok: true,
  open() {
    if (this.db) return Promise.resolve(this.db);
    return new Promise((res, rej) => {
      let r; try { r = indexedDB.open("carnets-voyage", 1); } catch (e) { return rej(e); }
      r.onupgradeneeded = () => {
        const db = r.result;
        ["tickets", "photos"].forEach(n => { const s = db.createObjectStore(n, { keyPath: "id" }); s.createIndex("key", "key"); s.createIndex("trip", "trip"); });
      };
      r.onsuccess = () => { this.db = r.result; res(this.db); };
      r.onerror = () => rej(r.error);
    });
  },
  async run(store, mode, fn) {
    const db = await this.open();
    return new Promise((res, rej) => {
      const tx = db.transaction(store, mode), st = tx.objectStore(store), req = fn(st);
      tx.oncomplete = () => res(req && "result" in req ? req.result : undefined);
      tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error);
    });
  },
  byTrip(store, trip) { return this.run(store, "readonly", s => s.index("trip").getAll(trip)); },
  put(store, v) { return this.run(store, "readwrite", s => s.put(v)); },
  del(store, id) { return this.run(store, "readwrite", s => s.delete(id)); }
};

/* Reprend les billets de l'ancien site « Carnet de Londres » (base londres-2027) */
async function migrateOld() {
  if (ls.get("cv-migr1")) return;
  const r = ls.get("ldn27-resa"); if (r && !ls.get("cv-resa-londres")) ls.set("cv-resa-londres", r);
  try {
    const old = await new Promise((res, rej) => {
      const q = indexedDB.open("londres-2027");
      q.onupgradeneeded = e => e.target.transaction.abort(); // n'existait pas : on ne crée rien
      q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error);
    });
    if (old.objectStoreNames.contains("tickets")) {
      const all = await new Promise((res, rej) => { const q = old.transaction("tickets").objectStore("tickets").getAll(); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); });
      for (const t of all) await DB.put("tickets", { ...t, trip: "londres", key: "londres|" + t.key });
    }
    old.close();
  } catch (e) {}
  ls.set("cv-migr1", true);
}

/* ---------- état ---------- */
let trip = null, TICKETS = [], PHOTOS = [], route = { home: true }, section = "", dayId = "";
let PRIV = false; // true une fois le code entré : détails, billets, comptes
const PRIVATE_SECTIONS = ["billets", "budget", "comptes", "infos"];
const pubPhotos = id => ((self.PUBPHOTOS || {})[id] || []).map((x, i) => ({ id: "pub:" + id + ":" + x.f, key: id + "|" + x.k, src: "photos/" + id + "/" + encodeURIComponent(x.f), caption: x.c || "", pub: true, pubName: x.f, created: i }));
const tKey = (d, s) => trip.id + "|" + d.id + "|" + s.n;
const ticketsFor = k => TICKETS.filter(t => t.key === k);
const photosFor = k => PHOTOS.filter(p => k === "*" || p.key === k).sort((a, b) => a.created - b.created);

async function loadTripData() {
  let local = []; TICKETS = [];
  if (PRIV) { try { [TICKETS, local] = await Promise.all([DB.byTrip("tickets", trip.id), DB.byTrip("photos", trip.id)]); } catch (e) { DB.ok = false; TICKETS = []; local = []; } }
  const names = new Set(local.map(p => p.pubName).filter(Boolean));
  PHOTOS = local.concat(pubPhotos(trip.id).filter(p => !names.has(p.pubName)));
}

/* object URLs (aperçus et photos) */
const URLS = new Map();
function objURL(id, blob) { if (!URLS.has(id)) URLS.set(id, URL.createObjectURL(blob)); return URLS.get(id); }
function dropURL(id) { [id, id + ":f"].forEach(k => { if (URLS.has(k)) { URL.revokeObjectURL(URLS.get(k)); URLS.delete(k); } }); }
function hydrate(root) {
  $$("img[data-thumb]", root).forEach(img => { const p = PHOTOS.find(x => x.id === img.dataset.thumb); if (p) img.src = p.src || objURL(p.id, p.thumb || p.blob); });
  $$("img[data-blob]", root).forEach(img => { const [id, j] = img.dataset.blob.split(":"); const t = TICKETS.find(x => x.id === id); if (t && t.files[+j]) img.src = objURL(id + ":" + j, t.files[+j].blob); });
}

/* ---------- routeur ---------- */
function parse() {
  const h = decodeURIComponent((location.hash || "").replace(/^#\/?/, ""));
  if (!h) return { home: true };
  const p = h.split("/");
  if (TRIPS.some(t => t.id === p[0])) return { trip: p[0], sec: p[1] || "" };
  // anciens liens du site de Londres (#j3, #billets…)
  if (TRIPS.some(t => t.id === "londres") && (/^j\d+$/.test(p[0]) || ["billets", "budget", "infos"].includes(p[0]))) return { trip: "londres", sec: p[0], legacy: true };
  return { home: true };
}
const href = (sec) => "#/" + trip.id + (sec ? "/" + sec : "");

async function render() {
  route = parse();
  if (route.legacy) { history.replaceState(null, "", "#/" + route.trip + "/" + route.sec); }
  if (route.home) { document.body.classList.remove("intrip"); return renderHome(); }
  if (!trip || trip.id !== route.trip) { trip = TRIPS.find(t => t.id === route.trip); await loadTripData(); }
  document.body.classList.add("intrip");
  if (!PRIV && trip.locked) { section = "public"; renderTrip(); return; }
  let sec = route.sec;
  if (!sec) { const st = tripState(trip); sec = st.day || ls.get("cv-last-" + trip.id) || trip.days[0].id; history.replaceState(null, "", href(sec)); }
  const di = trip.days.findIndex(d => d.id === sec);
  if (di >= 0) { section = "programme"; dayId = sec; ls.set("cv-last-" + trip.id, sec); }
  else if (sec === "photos") section = sec;
  else if (PRIVATE_SECTIONS.includes(sec)) section = PRIV ? sec : "locked";
  else { location.hash = href(trip.days[0].id); return; }
  renderTrip();
}
window.addEventListener("hashchange", async () => {
  const prevSec = section, prevTrip = trip && trip.id, prevY = window.scrollY;
  await render();
  if (route.home || prevTrip !== (trip && trip.id) || prevSec !== section) return window.scrollTo(0, 0);
  // changement de jour : on garde la barre des jours en haut si on avait défilé
  const a = $("#dayanchor"); window.scrollTo(0, a ? Math.min(prevY, a.offsetTop) : 0);
});
function refresh() { const y = window.scrollY; renderTrip(); window.scrollTo(0, y); }

/* ---------- accueil ---------- */
async function renderHome() {
  document.title = "Mes voyages";
  setTheme();
  const stats = {};
  await Promise.all(TRIPS.map(async t => {
    let ph = [];
    if (PRIV) try { ph = await DB.byTrip("photos", t.id); } catch (e) {}
    ph.sort((a, b) => b.created - a.created);
    const names = new Set(ph.map(p => p.pubName).filter(Boolean));
    const all = ph.concat(pubPhotos(t.id).filter(p => !names.has(p.pubName)));
    stats[t.id] = { photos: all.length, cover: all[0] || null, stops: placesOf(t).length };
  }));
  const order = TRIPS.slice().sort((a, b) => {
    const pa = tripState(a).k === "past", pb = tripState(b).k === "past";
    return pa !== pb ? (pa ? 1 : -1) : (pa ? (b.start || "").localeCompare(a.start || "") : (a.start || "").localeCompare(b.start || ""));
  });
  const next = order.find(t => tripState(t).k !== "past");
  const hi = next ? (tripState(next).k === "now" ? `Bon voyage à ${next.title} !` : `Bonjour ! ${tripState(next).txt}`) : "Bonjour !";
  $("#app").innerHTML = `
   <header class="hello"><div><p class="hi">${esc(PRIV ? hi : "Nos souvenirs de voyage")}</p><h1>${PRIV ? "Mes voyages" : "Nos voyages"}</h1></div><div class="hacts">${netPill()}${lockBtn()}</div></header>
   <div class="trips">${order.map(t => {
     const st = tripState(t), s = stats[t.id];
     return `<a class="trip card ${st.k}" href="#/${esc(t.id)}">
       <div class="cover">${s.cover ? `<img alt="" data-cover="${s.cover.id}">` : `<div class="mosaic" aria-hidden="true">${highlights(t).map(n => tile(n)).join("")}</div>`}</div>
       <div class="tinfo">
         ${PRIV ? `<div class="trow"><h2>${esc(t.title)}</h2><span class="pill">${esc(st.k === "soon" ? st.txt.replace("Départ d", "D") : st.txt)}</span></div>
         <div class="tmeta">${ic("calendar")}${esc(range(t.start, t.end))}${t.country ? ", " + esc(t.country) : ""}</div>
         ${t.summary ? `<p>${esc(t.summary)}</p>` : ""}
         <div class="chips"><span>${plural(t.days.length, "jour")}</span><span>${plural(s.stops, "étape")}</span><span>${plural(s.photos, "photo")}</span></div>`
         : `<h2>${esc(t.title)}</h2>${t.country ? `<div class="tmeta">${ic("map-pin")}${esc(t.country)}</div>` : ""}${t.summary ? `<p>${esc(t.summary)}</p>` : ""}`}
       </div></a>`;
   }).join("")}</div>
   ${PRIV ? `<section class="howto card">${tile("plus", "lilac")}<div><h2>Ajouter un voyage</h2><p>Va sur la page <a href="outils/">Modifier un voyage</a> : pars du modèle, remplis-le, et la page prépare le fichier à déposer sur GitHub. Ajoute ensuite son nom dans <b>voyages.js</b>.</p></div></section>
   <footer>Les photos, billets et cases cochées sont enregistrés uniquement sur cet appareil.</footer>` : ""}`;
  $$("img[data-cover]").forEach(img => { const id = img.dataset.cover; for (const t of TRIPS) { const c = stats[t.id].cover; if (c && c.id === id) img.src = c.src || objURL("cover:" + id, c.thumb || c.blob); } });
}
/* six étapes phares aux icônes différentes, pour la couverture sans photo */
function highlights(t) {
  const out = [], seen = new Set(["map-pin", "plane", "car", "bed", "train", "tools-kitchen-2", "sparkles"]);
  for (const pass of [1, 0]) for (const s of placesOf(t)) {
    if (out.length >= 6) break;
    if (pass && !s.major) continue;
    const n = stopIcon(s); if (!seen.has(n)) { seen.add(n); out.push(n); }
  }
  while (out.length < 6) out.push(["map-pin", "camera", "plane", "star", "trees", "sparkles"][out.length]);
  return out;
}
function setTheme() { const m = $('meta[name="theme-color"]'); if (m) m.content = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim() || "#f3f0fd"; }
const netPill = () => `<span class="net" data-net ${navigator.onLine ? "hidden" : ""}>Hors ligne</span>`;
function updateNet() { $$("[data-net]").forEach(n => n.hidden = navigator.onLine); }
window.addEventListener("online", updateNet); window.addEventListener("offline", updateNet);

/* ---------- page voyage ---------- */
const factIcon = l => /hôtel|logement/i.test(l) ? ["bed", "lilac"] : /arriv/i.test(l) ? ["plane-arrival", "sky"] : /départ|retour/i.test(l) ? ["plane-departure", "peach"] : ["info-circle", "mint"];
function renderTrip() {
  const t = trip, st = tripState(t);
  if (section === "public") {
    document.title = t.title + " · Nos voyages"; setTheme();
    $("#app").innerHTML = `
     <div class="tripbar"><a class="iconbtn" href="#/" aria-label="Retour aux voyages">${I.back}</a><span class="crumb">Nos voyages</span>${netPill()}${lockBtn(true)}</div>
     <header class="hero card pubhero"><h1>${esc(t.title)}</h1>${t.country ? `<div class="hdates">${esc(t.country)}</div>` : ""}${t.summary ? `<p class="daysub">${esc(t.summary)}</p>` : ""}</header>
     ${publicView()}`;
    hydrate($("#app")); return;
  }
  document.title = t.title + " · Mes voyages";
  setTheme();
  const counts = { photos: PHOTOS.length, billets: TICKETS.length };
  const view = section === "locked" ? lockedView() : section === "programme" ? dayView() : section === "photos" ? photosView() : section === "billets" ? billetsView() : section === "budget" ? budgetView() : section === "comptes" ? comptesView() : infosView();
  $("#app").innerHTML = `
   <div class="tripbar"><a class="iconbtn" href="#/" aria-label="Retour aux voyages">${I.back}</a><span class="crumb">${PRIV ? "Mes voyages" : "Nos voyages"}</span>${netPill()}${lockBtn(true)}</div>
   <header class="hero card">
     <div class="htop"><div><h1>${esc(t.title)}</h1><div class="hdates">${esc(range(t.start, t.end))}</div></div><span class="pill">${esc(st.txt)}</span></div>
     ${!PRIV && t.summary ? `<p class="daysub">${esc(t.summary)}</p>` : ""}
     ${PRIV && (t.facts || []).length ? `<div class="hfacts">${t.facts.map(f => { const [n, tone] = factIcon(f[0]); return `<div class="fact">${tile(n, tone)}<div style="min-width:0"><small>${esc(f[0])}</small><b>${esc(f[1])}</b></div></div>`; }).join("")}</div>` : ""}
   </header>
   <nav class="secnav${PRIV ? "" : " pub"}" aria-label="Sections du voyage">${SECTIONS.filter(s => PRIV ? (s[0] !== "budget" || (t.budget && t.budget.length) || (t.paid && t.paid.length)) : ["programme", "photos"].includes(s[0])).map(([id, lab0, icn]) => { const lab = !PRIV && id === "programme" ? "Activités" : lab0; return `<a href="${href(id === "programme" ? dayId || t.days[0].id : id)}" ${section === id ? 'aria-current="page"' : ""}>${icn}<span>${lab}</span>${counts[id] ? `<span class="n">${counts[id]}</span>` : ""}</a>`; }).join("")}</nav>
   ${view}
   ${PRIV ? (t.footer ? `<footer>${esc(t.footer)} Les photos, billets et cases cochées restent sur l'appareil qui les a enregistrés.</footer>` : "") : `<footer>Récap public : les horaires, trajets et réservations sont visibles avec le code.</footer>`}`;
  bindView();
}

function daysNav() {
  const today = isoToday();
  return `<div id="dayanchor"></div><nav class="days" aria-label="Jours du voyage"><div class="daylist">${trip.days.map((d, i) =>
    `<a class="daypill" href="${href(d.id)}" style="--dc:${esc(d.c)}" ${d.id === dayId ? 'aria-current="page"' : ""}><span class="dn"><i></i>Jour ${i + 1}</span><span class="dl">${esc(d.dow)} ${parts(d.date).d}</span>${d.date === today ? '<span class="today" title="Aujourd\'hui"></span>' : ""}</a>`).join("")}</div></nav>`;
}

function photoStrip(key) {
  const list = photosFor(key), max = 7, shown = list.length > max ? list.slice(0, max - 1) : list;
  return list.length ? `<div class="phs">${shown.map(p => `<button class="pth" data-ph="${p.id}" data-pk="${esc(key)}" aria-label="Voir la photo${p.caption ? " : " + esc(p.caption) : ""}"><img alt="" data-thumb="${p.id}" loading="lazy"></button>`).join("")}
      ${list.length > max ? `<button class="pth more" data-ph="${list[max - 1].id}" data-pk="${esc(key)}" aria-label="Voir les ${list.length} photos">+${list.length - max + 1}</button>` : ""}</div>` : "";
}
const addPhotoBtn = key => `<label class="chip">${I.photo}Ajouter des photos<input type="file" class="vh" accept="image/*" multiple data-addph="${esc(key)}"></label>`;
const legHTML = (s, from) => `<div class="leg">${ic(s.mode === "walk" ? "walk" : "bus")}${s.mode === "walk" ? "À pied" : "En transports"}${from ? ` depuis ${esc(from)}` : ""}</div>`;

function stopHTML(d, s, i) {
  const t = trip, prev = i === 0 ? t.hotel && t.hotel.q : d.stops[i - 1].q;
  const prevName = s.from || (i === 0 ? "l'hôtel" : d.stops[i - 1].n);
  const key = tKey(d, s), nt = ticketsFor(key).length;
  const how = (s.how || []).length ? `<details class="how"${i === 0 ? " open" : ""}>
     <summary><span>Comment y aller</span><span class="from">depuis ${esc(prevName)}</span></summary>
     <ol>${s.how.map(h => `<li>${esc(h)}</li>`).join("")}</ol>
     ${prev && prev !== s.q ? `<a class="mini" href="${mapsDir(t, prev, s.q, s.mode === "walk")}" target="_blank" rel="noopener">${ic("map-2")}${s.mode === "walk" ? "Itinéraire à pied" : "Itinéraire en transports"} dans Google Maps</a>` : ""}
   </details>` : "";
  if (!PRIV) return `<li id="${esc(d.id)}-${i}" class="publi">
    <article class="card scard">
      <div class="shead">${tile(stopIcon(s))}
        <div class="smain">${s.major ? '<div class="stime"><span class="must">Incontournable</span></div>' : ""}
          <h3><a href="${mapsSearch(t, s.q)}" target="_blank" rel="noopener">${esc(s.n)}</a></h3>
          ${s.d ? `<p class="addr" style="font-size:14px">${esc(s.d)}</p>` : ""}</div></div>
      ${photoStrip(key) ? `<div class="sbody" style="margin-top:4px">${photoStrip(key)}</div>` : ""}
    </article></li>`;
  return `<li id="${esc(d.id)}-${i}">
    ${i > 0 ? legHTML(s) : ""}
    <article class="card scard">
      <div class="shead">${tile(stopIcon(s))}
        <div class="smain"><div class="stime">${esc(s.t)}${s.major ? '<span class="must">Incontournable</span>' : ""}</div>
          <h3><a href="${mapsSearch(t, s.q)}" target="_blank" rel="noopener">${esc(s.n)}</a></h3>
          ${s.addr ? `<div class="addr">${esc(s.addr)}</div>` : ""}</div></div>
      <div class="sbody">
      ${s.d ? `<p>${esc(s.d)}</p>` : ""}
      ${s.tags ? `<div class="tags">${s.tags.map(g => `<span class="pill ${esc(g[1])}">${esc(g[0])}</span>`).join("")}</div>` : ""}
      ${s.warn ? `<div class="alert">${esc(s.warn)}</div>` : ""}
      ${s.adj ? `<div class="adj"><b>Ajusté</b>${esc(s.adj)}</div>` : ""}
      ${how}
      ${photoStrip(key)}
      <div class="acts">${addPhotoBtn(key)}
      ${s.tk ? `<button class="chip tk${nt ? " has" : ""}" data-tk="${esc(key)}" data-title="${esc(s.n)}">${I.ticket}${nt ? `Billets (${nt})` : "Ajouter un billet"}</button>` : ""}</div>
      </div>
    </article></li>`;
}

function dayView() {
  const t = trip, i = t.days.findIndex(d => d.id === dayId), d = t.days[i];
  const noteTile = k => k === "warn" ? tile("alert-triangle", "butter") : tile(k === "info" ? "bulb" : "info-circle", k === "info" ? "lilac" : "mint");
  if (!PRIV) return `${daysNav()}<main class="full"><section aria-labelledby="h-${esc(d.id)}" style="--dc:${esc(d.c)};min-width:0;max-width:760px">
   <div class="card dayhead">
     <div class="dkick"><i></i>Jour ${i + 1}, ${esc(d.dow.toLowerCase())}. ${parts(d.date).d} ${MOIS[parts(d.date).m - 1]}</div>
     <h2 id="h-${esc(d.id)}">${esc(d.title)}</h2>
     ${d.sub ? `<p class="daysub">${esc(d.sub)}</p>` : ""}
   </div>
   ${d.stops.length ? `<ol class="stops pubstops">${d.stops.map((s, k) => stopHTML(d, s, k)).join("")}</ol>` : `<div class="card empty" style="margin-top:12px">${tile("plane-departure", "peach")}<p>Journée de retour.</p></div>`}
   <div class="pager">
    ${i > 0 ? `<a class="btn ghost" href="${href(t.days[i - 1].id)}">${ic("chevron-left")}${esc(t.days[i - 1].dow)} ${parts(t.days[i - 1].date).d}</a>` : "<span></span>"}
    ${i < t.days.length - 1 ? `<a class="btn solid" href="${href(t.days[i + 1].id)}">${esc(t.days[i + 1].dow)} ${parts(t.days[i + 1].date).d}${ic("chevron-right")}</a>` : ""}
   </div></section></main>`;
  return `${daysNav()}<main><section aria-labelledby="h-${esc(d.id)}" style="--dc:${esc(d.c)};min-width:0">
   <div class="card dayhead">
     <div class="dkick"><i></i>Jour ${i + 1}, ${esc(d.dow.toLowerCase())}. ${parts(d.date).d} ${MOIS[parts(d.date).m - 1]}</div>
     <h2 id="h-${esc(d.id)}">${esc(d.title)}</h2>
     ${d.sub ? `<p class="daysub">${esc(d.sub)}</p>` : ""}
     <div class="dacts"><a class="btn" href="${dayRoute(t, d)}" target="_blank" rel="noopener">${ic("map-2")}Carte de la journée</a></div>
   </div>
   ${(d.notes || []).length ? `<div class="notes">${d.notes.map(n => `<div class="note">${noteTile(n[1])}<p>${esc(n[0])}</p></div>`).join("")}</div>` : ""}
   <ol class="stops">${d.stops.map((s, k) => stopHTML(d, s, k)).join("")}
   ${d.back && d.back.length ? `<li><div class="leg">${ic("home-2")}Retour</div><article class="card scard homecard"><div class="shead">${tile("home-2", "lilac")}<div class="smain"><div class="stime">Fin de journée</div><h3>Rentrer à l'hôtel</h3></div></div>
      <div class="sbody"><ol class="plain">${d.back.map(h => `<li>${esc(h)}</li>`).join("")}</ol>
      ${t.hotel ? `<a class="mini" href="${mapsDir(t, d.stops[d.stops.length - 1].q, t.hotel.q, false)}" target="_blank" rel="noopener">${ic("map-2")}Itinéraire retour dans Google Maps</a>` : ""}</div></article></li>` : ""}
   </ol>
   <div class="pager">
    ${i > 0 ? `<a class="btn ghost" href="${href(t.days[i - 1].id)}">${ic("chevron-left")}${esc(t.days[i - 1].dow)} ${parts(t.days[i - 1].date).d}</a>` : "<span></span>"}
    ${i < t.days.length - 1 ? `<a class="btn solid" href="${href(t.days[i + 1].id)}">${esc(t.days[i + 1].dow)} ${parts(t.days[i + 1].date).d}${ic("chevron-right")}</a>` : ""}
   </div>
  </section>${sidebar()}</main>`;
}

function sidebar() {
  const t = trip, resa = t.resa || [], done = ls.get("cv-resa-" + t.id) || {};
  const n = resa.filter(r => done[r[0]]).length;
  const oui = (t.budget || []).filter(b => b[3] === "oui");
  const lo = oui.reduce((a, b) => a + b[4], 0), hi = oui.reduce((a, b) => a + b[5], 0);
  return `<aside>
   ${convHTML()}
   ${resa.length ? `<div class="card panel"><h3>${tile("check", "mint")}À réserver</h3>
    <div class="prog"><i style="width:${n / resa.length * 100}%"></i></div>
    <div class="small cnt" style="margin-bottom:6px">${n} sur ${resa.length} fait${n > 1 ? "s" : ""}</div>
    <div class="chk">${resa.map(r => `<label><input type="checkbox" data-k="${esc(r[0])}" ${done[r[0]] ? "checked" : ""}><span>${esc(r[1])}<em>${esc(r[2])}</em></span></label>`).join("")}</div>
   </div>` : ""}
   <div class="card panel"><h3>${tile("camera", "peach")}Photos</h3><div class="big">${PHOTOS.length}</div>
    <div class="small">photo${PHOTOS.length > 1 ? "s" : ""} sur cet appareil</div>
    <div style="margin-top:12px"><a class="btn" href="${href("photos")}">Voir les photos</a></div></div>
   <div class="card panel"><h3>${tile("ticket", "pink")}Mes billets</h3><div class="big">${TICKETS.length}</div>
    <div class="small">billet${TICKETS.length > 1 ? "s" : ""} enregistré${TICKETS.length > 1 ? "s" : ""} sur cet appareil</div>
    <div style="margin-top:12px"><a class="btn" href="${href("billets")}">Ouvrir mes billets</a></div></div>
   ${oui.length ? `<div class="card panel"><h3>${tile("coin", "butter")}Budget activités</h3><div class="big">${money(lo)} – ${money(hi)}</div>
    <div class="small">par personne, pour ce que tu as noté « Oui ».</div>
    <div style="margin-top:12px"><a class="btn" href="${href("budget")}">Voir le détail</a></div></div>` : ""}
  </aside>`;
}
const money = n => (trip.currency || "€") + (Math.round(n * 100) / 100).toString().replace(".", ",");

/* ---------- photos ---------- */
function photosView() {
  const t = trip, byKey = {};
  PHOTOS.forEach(p => (byKey[p.key] = byKey[p.key] || []).push(p));
  const known = new Set();
  const grid = k => `<div class="pgrid">${photosFor(k).map(p => `<button class="pth" data-ph="${p.id}" data-pk="${esc(k)}" aria-label="Voir la photo"><img alt="" data-thumb="${p.id}" loading="lazy"></button>`).join("")}</div>`;
  const days = t.days.map(d => {
    const stops = d.stops.map(s => { const k = tKey(d, s); known.add(k); return byKey[k] ? [s, k] : null; }).filter(Boolean);
    return stops.length ? `<section class="card pgday" style="--dc:${esc(d.c)}"><h3><i></i><a href="${href(d.id)}">${esc(d.dow)} ${parts(d.date).d} ${MOIS[parts(d.date).m - 1]}, ${esc(d.title)}</a></h3>
      ${stops.map(([s, k]) => `<div class="pgstop"><h4>${esc(s.n)}</h4>${grid(k)}</div>`).join("")}</section>` : "";
  }).join("");
  const orphan = Object.keys(byKey).filter(k => !known.has(k));
  return `<main class="full"><section style="min-width:0">
   <h2 class="pageh" style="margin-top:8px">Photos</h2>
   <p class="daysub">${PHOTOS.length ? `${plural(PHOTOS.length, "photo")}, rangée${PHOTOS.length > 1 ? "s" : ""} par jour et par endroit. ` : ""}${PRIV ? "Pour en ajouter, ouvre un jour du programme et touche « Ajouter des photos » sur l'étape." : ""}</p>
   ${PRIV ? `<div class="store small" id="storeInfo"></div>` : ""}
   ${!DB.ok ? `<div class="note" style="margin-top:14px">${tile("alert-triangle", "butter")}<p>Ce navigateur bloque le stockage (navigation privée ?). Ouvre le site dans une fenêtre normale pour garder des photos.</p></div>` : ""}
   ${PHOTOS.length ? days + (orphan.length ? `<section class="card pgday"><h3><i></i>Autres photos</h3><p class="small">Étapes renommées ou retirées du programme.</p>${orphan.map(k => `<div class="pgstop"><h4>${esc(k.split("|").slice(2).join("|"))}</h4>${grid(k)}</div>`).join("")}</section>` : "")
     : PRIV ? `<div class="card empty">${tile("camera", "peach")}<p><b>Pas encore de photo.</b><br>Chaque étape du programme a un bouton « Ajouter des photos » : prends une photo sur place ou choisis-en dans ta galerie.</p></div>
        <div class="toolbar"><a class="btn solid" href="${href(dayId || t.days[0].id)}">Ouvrir le programme</a></div>`
     : `<div class="card empty">${tile("camera", "peach")}<p><b>Les photos arrivent bientôt.</b><br>Elles apparaîtront ici pendant et après le voyage.</p></div>`}
   ${PRIV ? publishPanel() + backupPanel() : ""}
  </section></main>`;
}
function backupPanel() {
  return `<div class="card panel" style="margin-top:22px"><h3>${tile("download", "sky")}Sauvegarder ou changer d'appareil</h3>
   <p class="small" style="margin:0 0 12px">Les photos et billets ne sont pas envoyés sur GitHub (ton site est public). Pour les garder en sécurité ou les passer sur un autre appareil, télécharge une sauvegarde puis restaure-la sur l'autre appareil.</p>
   <div class="toolbar" style="margin-top:0"><button class="btn" data-export>Télécharger une sauvegarde</button>
   <label class="btn">Restaurer une sauvegarde<input type="file" class="vh" accept="application/json,.json" data-import></label></div></div>`;
}
async function showStorage() {
  const el = $("#storeInfo"); if (!el || !navigator.storage || !navigator.storage.estimate) return;
  try {
    const { usage, quota } = await navigator.storage.estimate();
    const mo = x => (x / 1048576).toFixed(x > 1048576 * 100 ? 0 : 1).replace(".", ",") + " Mo";
    const persisted = navigator.storage.persisted ? await navigator.storage.persisted() : false;
    el.textContent = `Espace utilisé sur cet appareil : ${mo(usage)} sur ${quota > 1073741824 ? Math.round(quota / 1073741824) + " Go" : mo(quota)} disponibles.${persisted ? " Stockage protégé contre le nettoyage automatique." : ""}`;
  } catch (e) {}
}

/* réduit chaque photo (1800 px max) et crée une vignette, pour garder de la place */
function loadImg(file) {
  return new Promise((res, rej) => { const u = URL.createObjectURL(file), img = new Image(); img.onload = () => res([img, u]); img.onerror = () => { URL.revokeObjectURL(u); rej(); }; img.src = u; });
}
function toJpeg(img, max, q) {
  const r = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement("canvas"); c.width = Math.round(img.naturalWidth * r); c.height = Math.round(img.naturalHeight * r);
  c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
  return new Promise(res => c.toBlob(b => res(b), "image/jpeg", q));
}
async function processImage(file) {
  try {
    const [img, u] = await loadImg(file);
    const blob = await toJpeg(img, 1800, .84), thumb = await toJpeg(img, 360, .72);
    const w = img.naturalWidth, h = img.naturalHeight; URL.revokeObjectURL(u);
    if (!blob) throw 0;
    return { blob: blob.size < file.size ? blob : file, thumb, w, h };
  } catch (e) { return { blob: file, thumb: null }; }
}
async function addPhotos(key, files, input) {
  files = [...files].filter(f => !f.type || f.type.startsWith("image/"));
  if (!files.length) return;
  const label = input && input.closest(".chip"); if (label) label.classList.add("busy");
  toast(files.length > 1 ? `Ajout de ${files.length} photos…` : "Ajout de la photo…", 60000);
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  const [, day] = key.split("|");
  let ok = 0;
  for (const f of files) {
    const r = await processImage(f);
    const p = { id: uid("p"), trip: trip.id, key, day, blob: r.blob, thumb: r.thumb, w: r.w, h: r.h, name: f.name, caption: "", taken: f.lastModified || Date.now(), created: Date.now() + ok };
    try { await DB.put("photos", p); PHOTOS.push(p); ok++; } catch (e) { toast("Plus de place sur cet appareil : photo non enregistrée."); break; }
  }
  if (ok) { refresh(); toast(ok > 1 ? `${ok} photos ajoutées` : "Photo ajoutée"); }
}

/* visionneuse plein écran */
const lb = $("#lb"); let lbList = [], lbI = 0;
function stopLabel(key) {
  const [, d, ...n] = key.split("|"); const day = trip.days.find(x => x.id === d);
  return (day ? day.dow + " " + day.label + ", " : "") + n.join("|");
}
function openLB(key, id) {
  lbList = photosFor(key); lbI = Math.max(0, lbList.findIndex(p => p.id === id));
  if (!lbList.length) return;
  showLB(); lb.showModal ? lb.showModal() : lb.setAttribute("open", "");
}
function showLB() {
  const p = lbList[lbI]; if (!p) return;
  const u = p.src || objURL(p.id + ":f", p.blob);
  $("#lbImg").src = u; $("#lbImg").alt = p.caption || "";
  $("#lbTitle").textContent = stopLabel(p.key);
  $("#lbCount").textContent = lbList.length > 1 ? `${lbI + 1} / ${lbList.length}` : "";
  $("#lbCap").value = p.caption || ""; $("#lbCap").hidden = !!p.src || !PRIV; $("#lbCapRO").textContent = p.caption || ""; $("#lbCapRO").hidden = !((p.src || !PRIV) && p.caption);
  $("#lbDel").hidden = !!p.src || !PRIV;
  const pb = $("#lbPub"); pb.hidden = !!p.src || !PRIV; pb.classList.toggle("on", !!p.wantPub); pb.lastChild.textContent = p.wantPub ? "Dans le récap public" : "Récap public";
  $("#lbPrev").disabled = lbI === 0; $("#lbNext").disabled = lbI >= lbList.length - 1;
  const fname = (stopLabel(p.key).replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "photo") + "-" + (lbI + 1) + ".jpg";
  $("#lbDl").href = u; $("#lbDl").download = fname;
  const del = $("#lbDel"); del.dataset.confirm = ""; del.lastChild.textContent = "Supprimer";
  if (p.src) { $("#lbShare").hidden = true; return; }
  const file = new File([p.blob], fname, { type: p.blob.type || "image/jpeg" });
  $("#lbShare").hidden = !(navigator.canShare && navigator.canShare({ files: [file] }));
  $("#lbShare").onclick = () => navigator.share({ files: [file], title: stopLabel(p.key) }).catch(() => {});
}
$("#lbPub").onclick = async () => {
  const p = lbList[lbI]; if (!p || p.src) return;
  p.wantPub = !p.wantPub; try { await DB.put("photos", p); } catch (e) {}
  showLB(); toast(p.wantPub ? "Ajoutée au récap public (à envoyer depuis l'onglet Photos)" : "Retirée du récap public");
};
const lbGo = n => { saveCap(); const j = lbI + n; if (j >= 0 && j < lbList.length) { lbI = j; showLB(); } };
async function saveCap() {
  const p = lbList[lbI]; if (!p || p.src || !PRIV) return; const v = $("#lbCap").value.trim();
  if (v === (p.caption || "")) return; p.caption = v; try { await DB.put("photos", p); } catch (e) {}
}
$("#lbPrev").onclick = () => lbGo(-1); $("#lbNext").onclick = () => lbGo(1);
$("#lbClose").onclick = () => lb.close();
lb.addEventListener("close", () => { saveCap(); if (!route.home) refresh(); });
$("#lbCap").addEventListener("change", saveCap);
$("#lbCap").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); e.target.blur(); } });
lb.addEventListener("keydown", e => { if (e.target.id === "lbCap") return; if (e.key === "ArrowLeft") lbGo(-1); if (e.key === "ArrowRight") lbGo(1); });
(() => { // glisser pour changer de photo
  const st = $("#lbStage"); let x0 = null, y0 = 0;
  st.addEventListener("pointerdown", e => { x0 = e.clientX; y0 = e.clientY; });
  st.addEventListener("pointerup", e => { if (x0 === null) return; const dx = e.clientX - x0, dy = e.clientY - y0; x0 = null; if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) lbGo(dx < 0 ? 1 : -1); });
  st.addEventListener("pointercancel", () => x0 = null);
})();
$("#lbDel").onclick = async () => {
  const b = $("#lbDel");
  if (b.dataset.confirm !== "1") { b.dataset.confirm = "1"; b.lastChild.textContent = "Confirmer la suppression"; return; }
  const p = lbList[lbI];
  try { await DB.del("photos", p.id); } catch (e) { return toast("Suppression impossible"); }
  PHOTOS = PHOTOS.filter(x => x.id !== p.id); dropURL(p.id); lbList.splice(lbI, 1);
  toast("Photo supprimée");
  if (!lbList.length) return lb.close();
  lbI = Math.min(lbI, lbList.length - 1); showLB();
};

/* ---------- billets ---------- */
function ticketStops() {
  const out = [[trip.id + "|general", "Général (vol, hôtel, assurance…)"]];
  trip.days.forEach(d => d.stops.forEach(s => { if (s.tk) out.push([tKey(d, s), d.dow + " " + d.label + ", " + s.n]); }));
  return out;
}
const ticketLabel = k => { const f = ticketStops().find(x => x[0] === k); return f ? f[1] : k.split("|").slice(1).join(" "); };

function billetsView() {
  const groups = {};
  TICKETS.slice().sort((a, b) => a.created - b.created).forEach(t => (groups[t.key] = groups[t.key] || []).push(t));
  const order = ticketStops().map(x => x[0]).filter(k => groups[k]);
  Object.keys(groups).forEach(k => { if (!order.includes(k)) order.push(k); });
  return `<main><section style="min-width:0">
   <h2 class="pageh" style="margin-top:8px">Mes billets</h2>
   <p class="daysub">PDF, captures d'écran ou photos de billets. Ils restent sur cet appareil et s'ouvrent sans connexion.</p>
   ${DB.ok ? "" : `<div class="note" style="margin-top:14px">${tile("alert-triangle", "butter")}<p>Ce navigateur bloque le stockage (navigation privée ?). Ouvre le site dans une fenêtre normale pour enregistrer des billets.</p></div>`}
   <div class="toolbar"><button class="btn solid" data-tk="${esc(trip.id)}|general" data-title="">${I.plus}Ajouter un billet</button></div>
   ${order.length ? order.map(k => `<div class="tgroup"><h3>${esc(ticketLabel(k))}</h3><div class="tlist">${groups[k].map(ticketCard).join("")}</div></div>`).join("")
     : `<div class="card empty">${tile("ticket", "pink")}<p><b>Aucun billet pour l'instant.</b><br>Touche « Ajouter un billet » ici, ou sur une étape réservée du programme.</p></div>`}
   ${backupPanel()}
  </section>${sidebar()}</main>`;
}
function ticketCard(t) {
  return `<div class="tcard"><div class="tthumbs">${(t.files || []).map((f, j) => f.type.startsWith("image/")
      ? `<button class="thumb" data-open="${t.id}" data-f="${j}" aria-label="Ouvrir ${esc(f.name)}"><img alt="" data-blob="${t.id}:${j}"></button>`
      : `<button class="thumb file" data-open="${t.id}" data-f="${j}"><span>${esc((f.name.split(".").pop() || "").toUpperCase())}</span><em>${esc(f.name)}</em></button>`).join("")}</div>
    <div class="tmeta"><b>${esc(t.title || "Billet")}</b>${t.ref ? `<div class="ref">Réf. <span>${esc(t.ref)}</span></div>` : ""}${t.note ? `<div class="small">${esc(t.note)}</div>` : ""}</div>
    <div class="tact"><button class="link" data-edit="${t.id}">Modifier</button><button class="link danger" data-del="${t.id}">Supprimer</button></div></div>`;
}
const dlg = $("#tdlg"); let editing = null, pendingFiles = [];
function openTicketDialog(key, title, existing) {
  editing = existing || null; pendingFiles = existing ? existing.files.slice() : [];
  $("#tKey").innerHTML = ticketStops().map(([k, l]) => `<option value="${esc(k)}"${k === (existing ? existing.key : key) ? " selected" : ""}>${esc(l)}</option>`).join("");
  $("#tTitle").value = existing ? existing.title : (title || "");
  $("#tRef").value = existing ? existing.ref || "" : "";
  $("#tNote").value = existing ? existing.note || "" : "";
  $("#tFile").value = "";
  $("#dlgTitle").textContent = existing ? "Modifier le billet" : "Ajouter un billet";
  const others = existing ? [] : ticketsFor(key);
  $("#tExisting").innerHTML = others.length ? `<div class="small" style="margin-bottom:6px">Déjà enregistrés pour cette étape :</div><div class="tlist">${others.map(ticketCard).join("")}</div>` : "";
  hydrate($("#tExisting")); renderPending(); $("#tErr").textContent = "";
  dlg.showModal ? dlg.showModal() : dlg.setAttribute("open", "");
}
function renderPending() {
  $("#tFiles").innerHTML = pendingFiles.map((f, i) => `<li>${esc(f.name)} <span class="small">(${Math.max(1, Math.round(f.blob.size / 1024))} Ko)</span> <button type="button" class="link danger" data-rm="${i}">Retirer</button></li>`).join("");
  $$("[data-rm]", $("#tFiles")).forEach(b => b.onclick = () => { pendingFiles.splice(+b.dataset.rm, 1); renderPending(); });
}
$("#tFile").onchange = e => { [...e.target.files].forEach(f => pendingFiles.push({ name: f.name, type: f.type || "application/octet-stream", blob: f })); e.target.value = ""; renderPending(); };
$("#tCancel").onclick = () => dlg.close();
$("#tForm").onsubmit = async e => {
  e.preventDefault();
  if (!pendingFiles.length && !$("#tRef").value.trim()) { $("#tErr").textContent = "Ajoute au moins un fichier ou un numéro de réservation."; return; }
  const k = $("#tKey").value;
  const t = { id: editing ? editing.id : uid("t"), trip: trip.id, key: k, title: $("#tTitle").value.trim() || ticketLabel(k).split(", ").pop(),
    ref: $("#tRef").value.trim(), note: $("#tNote").value.trim(), files: pendingFiles, created: editing ? editing.created : Date.now() };
  try { await DB.put("tickets", t); } catch (err) { $("#tErr").textContent = "Impossible d'enregistrer sur cet appareil (navigation privée ou stockage plein)."; return; }
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  await loadTripData(); dlg.close(); refresh(); toast("Billet enregistré");
};
function openFile(id, j) {
  const t = TICKETS.find(x => x.id === id); if (!t) return; const f = t.files[j]; const u = objURL(id + ":" + j, f.blob);
  $("#vTitle").textContent = (t.title || "Billet") + (t.ref ? ", réf. " + t.ref : "");
  $("#vBody").innerHTML = f.type.startsWith("image/") ? `<img src="${u}" alt="${esc(f.name)}">`
    : f.type === "application/pdf" ? `<object data="${u}" type="application/pdf"><p class="small" style="padding:20px">Aperçu indisponible ici : touche « Ouvrir en plein écran ».</p></object>`
    : `<p class="small">${esc(f.name)}</p>`;
  $("#vOpen").href = u; $("#vOpen").setAttribute("download", f.name);
  const v = $("#vdlg"); v.showModal ? v.showModal() : v.setAttribute("open", "");
  try { navigator.wakeLock && navigator.wakeLock.request("screen").catch(() => {}); } catch (e) {}
}
$("#vClose").onclick = () => $("#vdlg").close();

/* ---------- sauvegarde / restauration (photos + billets) ---------- */
const toB64 = blob => new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(blob); });
const fromB64 = async d => (await fetch(d)).blob();
async function exportAll() {
  toast("Préparation de la sauvegarde…", 60000);
  const tickets = [], photos = [];
  for (const t of TICKETS) tickets.push({ ...t, files: await Promise.all(t.files.map(async f => ({ name: f.name, type: f.type, data: await toB64(f.blob) }))) });
  for (const p of PHOTOS) { const { blob, thumb, ...rest } = p; photos.push({ ...rest, data: await toB64(blob) }); }
  const out = new Blob([JSON.stringify({ app: "carnets-voyage", v: 2, trip: trip.id, tickets, photos, comptes: ls.get("cv-comptes-" + trip.id) })], { type: "application/json" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(out); a.download = `sauvegarde-${trip.id}-${isoToday()}.json`;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast(`Sauvegarde téléchargée (${Math.max(1, Math.round(out.size / 1048576))} Mo)`);
}
async function importAll(file) {
  toast("Restauration…", 60000);
  try {
    const j = JSON.parse(await file.text()); if (!j.tickets && !j.photos) throw 0;
    const old = j.app === "londres-2027"; // sauvegarde de l'ancien site
    const tripId = old ? "londres" : j.trip;
    if (!TRIPS.some(t => t.id === tripId)) throw 0;
    let nt = 0, np = 0;
    for (const t of j.tickets || []) {
      t.files = await Promise.all(t.files.map(async f => ({ name: f.name, type: f.type, blob: await fromB64(f.data) })));
      if (old) { t.key = "londres|" + t.key; } t.trip = tripId; await DB.put("tickets", t); nt++;
    }
    for (const p of j.photos || []) {
      const blob = await fromB64(p.data); delete p.data;
      let thumb = null; try { const [img, u] = await loadImg(blob); thumb = await toJpeg(img, 360, .72); URL.revokeObjectURL(u); } catch (e) {}
      await DB.put("photos", { ...p, trip: tripId, blob, thumb }); np++;
    }
    if (j.comptes && j.comptes.people) { const k = "cv-comptes-" + tripId, cur = ls.get(k); if (!cur || !cur.exp || !cur.exp.length || confirm("Remplacer les comptes de cet appareil par ceux de la sauvegarde ?")) ls.set(k, j.comptes); }
    if (trip && trip.id === tripId) await loadTripData();
    if (!trip || trip.id !== tripId) location.hash = "#/" + tripId + "/photos"; else refresh();
    toast(`Restauré : ${plural(np, "photo")} et ${plural(nt, "billet")}`);
  } catch (e) { toast("Ce fichier n'est pas une sauvegarde valide pour ces voyages."); }
}

/* ---------- budget & infos ---------- */
function budgetView() {
  const t = trip, B = t.budget || [], lab = { oui: "Oui", non: "Non", jsp: "Je sais pas" };
  const sum = k => { const r = B.filter(b => b[3] === k); return [r.reduce((a, b) => a + b[4], 0), r.reduce((a, b) => a + b[5], 0)]; };
  const [ol, oh] = sum("oui"), [jl, jh] = sum("jsp");
  return `<main><section style="min-width:0">
   ${convHTML()}
   ${paidBlock()}
   ${B.length ? `<h2 class="pageh" style="margin-top:${(t.paid || []).length ? 30 : 8}px">Activités, par personne</h2>
   <p class="daysub">Repris de ton tableau, avec ta colonne « On rentre ? ».</p>
   <div class="sum">
    <div><span class="small">Activités retenues</span><span class="big">${money(ol)} – ${money(oh)}</span></div>
    ${jh ? `<div><span class="small">Avec les « Je sais pas »</span><span class="big">+ ${money(jl)} – ${money(jh)}</span></div>` : ""}
   </div>
   <div class="card rows">${B.map(b => `<div class="brow"><b>${esc(b[0])}</b><span class="bp">${esc(b[1])}${b[5] ? `<span class="small" style="display:block;font-weight:700">≈ ${euroRange(b[4], b[5])}</span>` : ""}</span><span class="bd">${esc(b[6] && b[6] !== "—" ? b[6] + ", " : "")}${esc(b[2])}</span><span class="bs"><span class="pill ${esc(b[3])}">${lab[b[3]] || esc(b[3])}</span></span></div>`).join("")}</div>` : ""}
   ${t.free ? `<div class="card panel" style="margin-top:16px"><h3>${tile("sparkles", "mint")}Gratuit</h3><p class="small">${esc(t.free)}</p></div>` : ""}
  </section>${sidebar()}</main>`;
}
const euro = n => n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
function paidBlock() {
  const P = trip.paid || []; if (!P.length) return "";
  const tot = P.reduce((a, x) => a + x[2], 0), np = trip.people || 1;
  const solo = P.filter(x => x[3] && x[3].solo), soloTot = solo.reduce((a, x) => a + x[2], 0), shared = tot - soloTot;
  return `<h2 class="pageh" style="margin-top:8px">Déjà réservé</h2>
   <p class="daysub">Payé pour tout le groupe, en euros${np > 1 ? `, puis divisé par ${np} voyageurs` : ""}.</p>
   <div class="sum"><div><span class="small">Total réglé</span><span class="big">${euro(tot)}</span></div>
     ${np > 1 ? `<div><span class="small">Par personne${soloTot ? " (partie commune)" : ""}</span><span class="big">${euro(shared / np)}</span></div>` : ""}</div>
   ${np > 1 && soloTot ? `<p class="small" style="margin-top:8px">En plus, pour une seule personne : ${solo.map(x => `${esc(x[0].replace(/ \(1 personne\)/, ""))} ${euro(x[2])}`).join(", ")}.</p>` : ""}
   <div class="card rows">${P.map(x => `<div class="brow"><b>${esc(x[0])}</b><span class="bp">${euro(x[2])}</span><span class="bd">${esc(x[1])}</span><span class="bs small">${x[3] && x[3].solo ? "pour 1 personne" : np > 1 ? euro(x[2] / np) + " / pers." : ""}</span></div>`).join("")}</div>
   <div class="toolbar"><a class="btn" href="${href("comptes")}">${ic("scale")}Qui a payé quoi ? Voir les comptes</a></div>`;
}

/* ---------- comptes partagés (façon Tricount) ----------
   Enregistrés sur l'appareil : { people:[{id,name}], exp:[{id,title,amount,cur,paidBy,split:[ids],date,kind,paidRef}], rate } */
const CK = () => "cv-comptes-" + trip.id;
const getC = () => {
  const c = ls.get(CK()) || {}, exp = c.exp || [];
  exp.forEach(e => { const x = e.paidRef != null && (trip.paid || [])[e.paidRef]; if (x && (e.amount !== x[2] || e.title !== x[0])) { e.amount = x[2]; e.title = x[0]; } });
  return { people: c.people || [], exp, rate: getRate().v };
};
const setC = c => ls.set(CK(), c);
const toEur = (e, c) => e.cur === "£" ? e.amount * c.rate : e.amount;
const nameOf = (c, id) => (c.people.find(p => p.id === id) || { name: "?" }).name;
const fmtAmt = (n, cur) => cur === "£" ? "£" + n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : euro(n);
function balances(c) {
  const b = Object.fromEntries(c.people.map(p => [p.id, { paid: 0, share: 0 }]));
  for (const e of c.exp) {
    if (!b[e.paidBy]) continue; // « pas encore payé » : ne compte pas dans les remboursements
    const v = toEur(e, c), who = (e.split || []).filter(id => b[id]);
    b[e.paidBy].paid += v;
    who.forEach(id => b[id].share += v / who.length);
    // remboursements faits pour cette dépense : comme un virement du débiteur vers le payeur
    (e.settled || []).forEach(id => { if (id !== e.paidBy && who.includes(id)) { b[id].paid += v / who.length; b[e.paidBy].paid -= v / who.length; } });
  }
  return b;
}
function settle(c, b) { // qui rembourse qui, en un minimum de virements
  const cred = [], debt = [];
  c.people.forEach(p => { const s = Math.round((b[p.id].paid - b[p.id].share) * 100) / 100; if (s > 0.005) cred.push([p.id, s]); else if (s < -0.005) debt.push([p.id, -s]); });
  cred.sort((x, y) => y[1] - x[1]); debt.sort((x, y) => y[1] - x[1]);
  const out = []; let i = 0, j = 0;
  while (i < debt.length && j < cred.length) {
    const m = Math.min(debt[i][1], cred[j][1]);
    if (m >= 0.01) out.push({ from: debt[i][0], to: cred[j][0], amount: Math.round(m * 100) / 100 });
    debt[i][1] -= m; cred[j][1] -= m;
    if (debt[i][1] < 0.005) i++; if (cred[j][1] < 0.005) j++;
  }
  return out;
}
function comptesView() {
  const c = getC();
  if (c.people.length < 1) return `<main class="full"><section style="min-width:0">
    <h2 class="pageh" style="margin-top:8px">Comptes</h2>
    <p class="daysub">Note qui a payé quoi pendant le voyage : le site partage chaque dépense en parts égales et calcule qui doit combien à qui.</p>
    <form class="card panel" id="cSetup" style="margin-top:16px;max-width:520px"><h3>${tile("users", "lilac")}Qui voyage ?</h3>
      ${Array.from({ length: Math.max(2, trip.people || 2) }, (_, i) => `<div class="field" style="margin-bottom:10px"><label for="pn${i}">Voyageur ${i + 1}</label><input id="pn${i}" data-pn placeholder="${i === 0 ? "Ton prénom" : "Prénom"}" autocomplete="off"></div>`).join("")}
      <div class="err" id="cErr"></div>
      <button class="btn solid" type="submit">Commencer les comptes</button></form>
  </section></main>`;
  const b = balances(c), tr = settle(c, b), total = c.exp.filter(e => e.kind !== "rembt").reduce((a, e) => a + toEur(e, c), 0);
  const unpaid = c.exp.filter(e => e.kind !== "rembt" && !c.people.some(p => p.id === e.paidBy)), unpaidTot = unpaid.reduce((a, e) => a + toEur(e, c), 0);
  const debtsOf = e => { // qui doit combien au payeur, pour cette dépense
    if (e.kind === "rembt" || !c.people.some(p => p.id === e.paidBy)) return "";
    const who = (e.split || []).filter(id => c.people.some(p => p.id === id)), share = toEur(e, c) / (who.length || 1);
    const l = who.filter(id => id !== e.paidBy);
    return l.length ? `<span class="debts">${l.map(id => { const done = (e.settled || []).includes(id);
      return `<span class="debt${done ? " done" : ""}"><span>${esc(nameOf(c, id))} doit ${euro(share)} à ${esc(nameOf(c, e.paidBy))}</span><button class="chip${done ? " ok" : ""}" data-sexp="${e.id}|${id}">${done ? ic("check") + "Remboursé" : "Marquer remboursé"}</button></span>`; }).join("")}</span>` : "";
  };
  const pendingPaid = (trip.paid || []).map((x, i) => [x, i]).filter(([, i]) => !c.exp.some(e => e.paidRef === i));
  const exps = c.exp.slice().sort((x, y) => (y.date || "").localeCompare(x.date || "") || y.created - x.created);
  return `<main class="full"><section style="min-width:0;max-width:760px">
   <h2 class="pageh" style="margin-top:8px">Comptes</h2>
   <p class="daysub">Chaque dépense est partagée en parts égales entre les personnes cochées. Les montants en livres sont convertis en euros.</p>
   <div class="sum"><div><span class="small">Dépenses du groupe</span><span class="big">${euro(total)}</span></div>
     <div><span class="small">Par personne</span><span class="big">${euro(c.people.length ? total / c.people.length : 0)}</span></div>
     ${unpaid.length ? `<div><span class="small">Pas encore payé</span><span class="big" style="color:var(--pink-fg)">${euro(unpaidTot)}</span></div>` : ""}</div>
   <div class="toolbar"><button class="btn solid" data-addexp>${I.plus}Ajouter une dépense</button></div>
   <div style="margin-top:16px">${convHTML()}</div>

   ${pendingPaid.length ? `<div class="card panel" style="margin-top:16px"><h3>${tile("receipt", "butter")}Réservations à attribuer</h3>
     <p class="small" style="margin:-4px 0 10px">Indique qui a payé chaque réservation (ou « Pas encore payé ») pour l'ajouter aux comptes.</p>
     ${pendingPaid.map(([x, i]) => `<div class="brow"><b>${esc(x[0])}</b><span class="bp">${euro(x[2])}</span>
       <span class="bd"><select data-paidsel="${i}" aria-label="Qui a payé ${esc(x[0])}" style="font:inherit;font-weight:700;padding:8px 10px;border-radius:12px;border:0;background:var(--bg);color:var(--fg);margin-top:6px"><option value="">Payé par…</option>${c.people.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join("")}<option value="none">Pas encore payé</option></select>${x[3] && x[3].solo ? ` <select data-forsel="${i}" aria-label="Pour qui : ${esc(x[0])}" style="font:inherit;font-weight:700;padding:8px 10px;border-radius:12px;border:0;background:var(--bg);color:var(--fg);margin-top:6px"><option value="">Pour qui ?</option>${c.people.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join("")}</select>` : ""}</span><span></span></div>`).join("")}
   </div>` : ""}

   <div class="card panel" style="margin-top:16px"><h3>${tile("scale", "mint")}Soldes</h3>
     ${(() => { // soldes arrondis au centime, qui s'équilibrent exactement
       const rs = c.people.map(p => Math.round((b[p.id].paid - b[p.id].share) * 100));
       const diff = -rs.reduce((x, y) => x + y, 0); if (diff && rs.length) { let k = 0; rs.forEach((v, i) => { if (Math.abs(v) > Math.abs(rs[k])) k = i; }); rs[k] += diff; }
       c.people.forEach((p, i) => b[p.id].round = rs[i] / 100); return ""; })()}
     ${c.people.map(p => { const r = b[p.id].round;
       return `<div class="brow"><b>${esc(p.name)}</b><span class="bp" style="color:${r > 0 ? "var(--mint-fg)" : r < 0 ? "var(--peach-fg)" : "inherit"}">${r > 0 ? "+" : ""}${euro(r)}</span>
         <span class="bd">a payé ${euro(b[p.id].paid)}, sa part ${euro(b[p.id].share)}</span><span class="bs"><span class="pill ${r > 0 ? "free" : r < 0 ? "book" : "out"}">${r > 0 ? "doit recevoir" : r < 0 ? "doit rembourser" : "à l'équilibre"}</span></span></div>`; }).join("")}
   </div>

   <div class="card panel" style="margin-top:16px"><h3>${tile("arrows-exchange", "sky")}Pour être quittes</h3>
     ${tr.length ? tr.map(t => `<div class="brow"><b>${esc(nameOf(c, t.from))} doit ${euro(t.amount)} à ${esc(nameOf(c, t.to))}</b><span></span>
       <span class="bd"><button class="link" data-settle="${t.from}|${t.to}|${t.amount}">Marquer comme remboursé</button></span><span></span></div>`).join("")
       : `<p class="small">Tout le monde est quitte.</p>`}
   </div>

   <h3 style="margin:22px 0 10px;font-size:18px">Dépenses</h3>
   ${exps.length ? `<div class="card rows">${exps.map(e => `<div class="brow" style="cursor:pointer" data-editexp="${e.id}" role="button" tabindex="0">
       <b>${e.kind === "rembt" ? "Remboursement : " : ""}${esc(e.title)}</b><span class="bp">${fmtAmt(e.amount, e.cur)}</span>
       <span class="bd">${c.people.some(p => p.id === e.paidBy) ? "Payé par " + esc(nameOf(c, e.paidBy)) : "Pas encore payé"}${e.date ? ", le " + esc(dayLabel(e.date)) : ""}${(e.split || []).length < c.people.length ? `, pour ${e.split.map(id => esc(nameOf(c, id))).join(" et ")}` : ", pour tout le monde"}</span>
       <span class="bs small">${c.people.some(p => p.id === e.paidBy) ? (e.cur === "£" ? "≈ " + euro(toEur(e, c)) : "") : `<span class="pill book">Pas encore payé</span>`}</span>${debtsOf(e)}</div>`).join("")}</div>`
     : `<div class="card empty">${tile("receipt", "peach")}<p><b>Aucune dépense pour l'instant.</b><br>Ajoute un repas, un billet ou un taxi : le site calcule tout seul qui doit combien.</p></div>`}

   <div class="card panel" style="margin-top:16px"><h3>${tile("users", "lilac")}Voyageurs et taux</h3>
     <div class="chips" style="margin-bottom:12px">${c.people.map(p => `<span>${esc(p.name)}</span>`).join("")}</div>
     <form id="cAdd" style="display:flex;gap:8px;flex-wrap:wrap"><input id="cNew" placeholder="Ajouter un voyageur" autocomplete="off" style="font:inherit;font-size:16px;padding:10px 12px;border:0;border-radius:14px;background:var(--bg);color:var(--fg);flex:1;min-width:160px"><button class="btn" type="submit">${ic("user-plus")}Ajouter</button></form>
     <label class="small" style="display:flex;align-items:center;gap:8px;margin-top:14px;font-weight:700">1 £ =
       <input id="cRate" type="number" step="0.01" min="0.5" max="3" value="${c.rate}" style="font:inherit;font-size:16px;width:90px;padding:8px 10px;border:0;border-radius:12px;background:var(--bg);color:var(--fg)"> €</label>
     <p class="small" style="margin-top:6px">Même taux que le convertisseur. Les comptes sont enregistrés sur cet appareil et inclus dans la sauvegarde.</p>
   </div>
  </section></main>`;
}
const dayLabel = iso => { const d = trip.days.find(x => x.date === iso); if (d) return d.dow.toLowerCase() + ". " + parts(iso).d + " " + MOIS[parts(iso).m - 1]; const p = parts(iso); return p.d + " " + MOIS[p.m - 1]; };

/* dialogue dépense */
const edlg = $("#edlg"); let editingExp = null;
function openExp(e) {
  const c = getC(); editingExp = e || null;
  $("#eTitleH").textContent = e ? (e.kind === "rembt" ? "Modifier le remboursement" : "Modifier la dépense") : "Ajouter une dépense";
  $("#eTitle").value = e ? e.title : "";
  $("#eAmount").value = e ? e.amount : "";
  $("#eCur").value = e ? e.cur : "€";
  $("#eDate").value = e ? e.date || "" : (trip.days.some(d => d.date === isoToday()) ? isoToday() : "");
  $("#ePaid").innerHTML = c.people.map(p => `<option value="${p.id}"${e && e.paidBy === p.id ? " selected" : ""}>${esc(p.name)}</option>`).join("") + `<option value=""${e && !c.people.some(p => p.id === e.paidBy) ? " selected" : ""}>Pas encore payé</option>`;
  const sp = e ? e.split : c.people.map(p => p.id);
  $("#eSplit").innerHTML = c.people.map(p => `<label><input type="checkbox" value="${p.id}" ${sp.includes(p.id) ? "checked" : ""}><span>${esc(p.name)}</span></label>`).join("");
  $("#eDel").hidden = !e; $("#eDel").textContent = "Supprimer"; $("#eDel").dataset.confirm = "";
  $("#eErr").textContent = ""; updateShare();
  edlg.showModal ? edlg.showModal() : edlg.setAttribute("open", "");
}
function updateShare() {
  const a = parseFloat(String($("#eAmount").value).replace(",", ".")), n = $$("#eSplit input:checked").length;
  $("#eShare").textContent = a > 0 && n ? `Soit ${fmtAmt(a / n, $("#eCur").value)} par personne (${n} part${n > 1 ? "s" : ""} égale${n > 1 ? "s" : ""})` : "";
}
["input", "change"].forEach(ev => { $("#eAmount").addEventListener(ev, updateShare); $("#eCur").addEventListener(ev, updateShare); $("#eSplit").addEventListener(ev, updateShare); });
$("#eCancel").onclick = () => edlg.close();
$("#eAll").onclick = () => { $$("#eSplit input").forEach(i => i.checked = true); updateShare(); };
$("#eForm").onsubmit = ev => {
  ev.preventDefault();
  const c = getC(), amount = Math.round(parseFloat(String($("#eAmount").value).replace(",", ".")) * 100) / 100;
  const split = $$("#eSplit input:checked").map(i => i.value), title = $("#eTitle").value.trim();
  if (!title) return $("#eErr").textContent = "Donne un nom à la dépense, par exemple « Dîner à Soho ».";
  if (!(amount > 0)) return $("#eErr").textContent = "Indique un montant supérieur à 0.";
  if (!split.length) return $("#eErr").textContent = "Coche au moins une personne pour partager la dépense.";
  const e = { ...(editingExp || { id: uid("e"), created: Date.now(), kind: "dep" }), title, amount, cur: $("#eCur").value, paidBy: $("#ePaid").value, split, date: $("#eDate").value };
  if (editingExp && editingExp.paidBy !== e.paidBy) e.settled = []; // nouveau payeur : remboursements à refaire
  c.exp = c.exp.filter(x => x.id !== e.id).concat(e); setC(c);
  edlg.close(); refresh(); toast(editingExp ? "Dépense modifiée" : "Dépense ajoutée");
};
$("#eDel").onclick = () => {
  const b = $("#eDel"); if (b.dataset.confirm !== "1") { b.dataset.confirm = "1"; b.textContent = "Confirmer la suppression"; return; }
  const c = getC(); c.exp = c.exp.filter(x => x.id !== editingExp.id); setC(c); edlg.close(); refresh(); toast("Dépense supprimée");
};
function bindComptes(v) {
  const f = $("#cSetup", v);
  if (f) f.onsubmit = ev => {
    ev.preventDefault();
    const names = $$("[data-pn]", f).map(i => i.value.trim()).filter(Boolean);
    if (names.length < 2) return $("#cErr").textContent = "Entre au moins deux prénoms.";
    const c = getC(); c.people = names.map(n => ({ id: uid("u"), name: n })); setC(c); refresh();
  };
  const a = $("#cAdd", v);
  if (a) a.onsubmit = ev => { ev.preventDefault(); const n = $("#cNew").value.trim(); if (!n) return; const c = getC(); c.people.push({ id: uid("u"), name: n }); setC(c); refresh(); toast(n + " ajouté·e aux comptes"); };
  const r = $("#cRate", v);
  if (r) r.onchange = () => { const x = parseFloat(String(r.value).replace(",", ".")); if (x > 0) { ls.set(RATE_KEY, { v: x, manual: true }); refresh(); } };
  const addPaid = i => {
    const s = $(`[data-paidsel="${i}"]`, v), f = $(`[data-forsel="${i}"]`, v), x = trip.paid[i];
    if (!s.value || (f && !f.value)) return; // pour une seule personne : il faut aussi « pour qui »
    const c = getC();
    c.exp.push({ id: uid("e"), created: Date.now(), kind: "dep", title: x[0], amount: x[2], cur: "€", paidBy: s.value === "none" ? "" : s.value, split: f ? [f.value] : c.people.map(p => p.id), date: "", paidRef: i });
    setC(c); refresh(); toast("Ajouté aux comptes");
  };
  $$("[data-paidsel]", v).forEach(s => s.onchange = () => addPaid(+s.dataset.paidsel));
  $$("[data-forsel]", v).forEach(s => s.onchange = () => addPaid(+s.dataset.forsel));
  $$("[data-editexp]", v).forEach(row => {
    const go = () => openExp(getC().exp.find(e => e.id === row.dataset.editexp));
    row.onclick = ev => { if (!ev.target.closest("[data-sexp]")) go(); };
    row.onkeydown = ev => { if (ev.target === row && (ev.key === "Enter" || ev.key === " ")) { ev.preventDefault(); go(); } };
  });
  $$("[data-sexp]", v).forEach(btn => btn.onclick = ev => {
    ev.stopPropagation();
    const [eid, pid] = btn.dataset.sexp.split("|"), c = getC(), e = c.exp.find(x => x.id === eid); if (!e) return;
    const s = new Set(e.settled || []); const was = s.has(pid); was ? s.delete(pid) : s.add(pid); e.settled = [...s];
    setC(c); refresh(); toast(was ? "Remboursement annulé" : "Remboursement enregistré");
  });
}

function infosView() {
  const t = trip, tones = ["sky", "lilac", "peach", "mint", "butter", "pink"], icons = ["coin", "bed", "plane", "device-tv", "bulb", "info-circle"];
  return `<main><section style="min-width:0">
   <h2 class="pageh" style="margin-top:8px">Infos pratiques</h2>
   <div style="margin-top:16px">${convHTML()}</div>
   <div class="grid2">
    ${(t.infos || []).map((x, i) => `<div class="card panel"><h3>${tile(icons[i % icons.length], tones[i % tones.length])}${esc(x[0])}</h3><p>${esc(x[1])}</p></div>`).join("")}
    ${(t.bonus || []).length ? `<div class="card panel"><h3>${tile("star", "pink")}Idées en plus</h3><ul class="bonus">${t.bonus.map(b => `<li><a href="${mapsSearch(t, b[2])}" target="_blank" rel="noopener"><b>${esc(b[0])}</b></a> <span class="small">${esc(b[1])}</span></li>`).join("")}</ul></div>` : ""}
    <div class="card panel"><h3>${tile("cloud", "sky")}Hors connexion</h3><p>Ce site s'enregistre sur l'appareil dès la première visite : programme, photos et billets s'ouvrent ensuite sans réseau, même dans le métro. Seuls les liens Google Maps demandent une connexion. Ajoute-le à l'écran d'accueil pour l'ouvrir comme une appli.</p></div>
   </div>
  </section>${sidebar()}</main>`;
}

/* ---------- récap public : activités et monuments, sans dates ni horaires ---------- */
const CATS = [
  ["Monuments", "building-castle", "butter", ["building-castle", "building-church", "building-bridge", "building-skyscraper", "crown", "building-carousel", "moon-stars"]],
  ["Musées", "building-bank", "lilac", ["building-bank"]],
  ["Quartiers", "star", "pink", ["star"]],
  ["Parcs et panoramas", "trees", "mint", ["trees", "sunset"]],
  ["Marchés et boutiques", "shopping-bag", "peach", ["shopping-bag", "building-store", "cake", "flower"]],
  ["Expériences", "sparkles", "sky", []]
];
const placesOf = t => t.places || (t.days || []).flatMap(d => d.stops);
function publicView() {
  const t = trip, groups = CATS.map(c => [c, []]);
  for (const p of placesOf(t)) {
    const n = stopIcon(p), g = groups.find(([c]) => c[3].includes(n)) || groups[groups.length - 1];
    g[1].push(p);
  }
  const card = p => {
    const key = t.id + "|" + p.k, ph = photosFor(key), n = stopIcon(p);
    return ph.length
      ? `<button class="place card hasph" data-ph="${ph[0].id}" data-pk="${esc(key)}"><span class="pimg"><img alt="" data-thumb="${ph[0].id}" loading="lazy"></span><b>${esc(p.n)}</b></button>`
      : `<a class="place card" href="${mapsSearch(t, p.q)}" target="_blank" rel="noopener">${tile(n, TONE[n], "big")}<b>${esc(p.n)}</b></a>`;
  };
  return `<main class="full"><section style="min-width:0">
   ${PHOTOS.length ? `<h2 class="pubh">${tile("camera", "pink")}Nos photos</h2><div class="pgrid pubgrid">${PHOTOS.slice().sort((a, b) => a.created - b.created).map(p => `<button class="pth" data-ph="${p.id}" data-pk="*" aria-label="Voir la photo"><img alt="" data-thumb="${p.id}" loading="lazy"></button>`).join("")}</div>` : ""}
   ${groups.filter(([, l]) => l.length).map(([c, l]) => `<h2 class="pubh">${tile(c[1], c[2])}${esc(c[0])}</h2><div class="places">${l.map(card).join("")}</div>`).join("")}
  </section></main>`;
}

/* ---------- accès privé (code) ----------
   Les détails de chaque voyage sont dans prive/<id>.enc.json, chiffrés avec le code (AES-GCM).
   Sans le code, le site n'affiche que le récap public : activités et photos. */
const lockBtn = small => PRIV
  ? `<button class="${small ? "iconbtn" : "btn ghost"}" data-lock aria-label="Verrouiller">${ic("lock-open")}${small ? "" : "Verrouiller"}</button>`
  : `<button class="${small ? "iconbtn" : "btn ghost"}" data-unlock aria-label="Accès privé">${ic("lock")}${small ? "" : "Accès privé"}</button>`;
function lockedView() {
  return `<main class="full"><section style="min-width:0;max-width:640px">
   <div class="card empty" style="margin-top:16px">${tile("lock", "lilac")}<div><p><b>Partie réservée aux voyageurs.</b><br>Horaires, trajets, réservations, billets, budget et comptes s'affichent avec le code.</p>
   <button class="btn solid" data-unlock style="margin-top:12px">${ic("lock-open")}Entrer le code</button></div></div></section></main>`;
}
async function unlock(code, remember) {
  for (let i = 0; i < TRIPS.length; i++) {
    const t = TRIPS[i]; if (!t.locked) continue;
    let enc;
    try { const r = await fetch("prive/" + encodeURIComponent(t.id) + ".enc.json", { cache: "no-cache" }); if (!r.ok) throw 0; enc = await r.json(); }
    catch (e) { throw new Error("reseau"); }
    let text;
    try { text = await CarnetBuild.decrypt(enc, code); } catch (e) { throw new Error("code"); }
    const full = CarnetBuild.evalTrip(text);
    TRIPS[i] = full; self.TRIPS[t.id] = full;
  }
  PRIV = true;
  if (remember) ls.set("cv-code", code);
  if (trip) { trip = TRIPS.find(x => x.id === trip.id); await loadTripData(); }
  refreshRate();
}
const udlg = $("#udlg");
function openUnlock() { $("#uCode").value = ""; $("#uErr").textContent = ""; udlg.showModal ? udlg.showModal() : udlg.setAttribute("open", ""); setTimeout(() => $("#uCode").focus(), 50); }
$("#uCancel").onclick = () => udlg.close();
$("#uForm").onsubmit = async ev => {
  ev.preventDefault();
  const code = $("#uCode").value.trim(), btn = $("#uForm button[type=submit]");
  if (!code) return $("#uErr").textContent = "Entre le code.";
  btn.disabled = true; $("#uErr").textContent = "Vérification…";
  try { await unlock(code, $("#uRemember").checked); udlg.close(); toast("Accès privé ouvert"); await render(); }
  catch (e) { $("#uErr").textContent = e.message === "code" ? "Code incorrect." : "Impossible de charger les détails. Ouvre le site une fois avec du réseau, puis réessaie."; }
  btn.disabled = false;
};
function lock() { ls.set("cv-code", null); location.reload(); }

/* ---------- photos du récap public ----------
   Dans la visionneuse, « Récap public » marque une photo ; « Préparer l'envoi » crée un .zip
   à déposer sur GitHub (dossier photos/<voyage>/), qui contient les photos et la liste photos.js. */
function publishPanel() {
  const local = PHOTOS.filter(p => !p.src), want = local.filter(p => p.wantPub), online = ((self.PUBPHOTOS || {})[trip.id] || []).length;
  return `<div class="card panel" style="margin-top:22px"><h3>${tile("world", "mint")}Récap public</h3>
   <p class="small" style="margin:0 0 12px">${online ? `${plural(online, "photo")} en ligne dans le récap public. ` : "Aucune photo dans le récap public pour l'instant. "}Pour en ajouter une, ouvre-la et touche « Récap public ». ${want.length ? `<b>${plural(want.length, "photo")} choisie${want.length > 1 ? "s" : ""}.</b>` : ""}</p>
   ${want.length || online ? `<div class="toolbar" style="margin-top:0"><button class="btn solid" data-publish>${ic("upload")}Préparer l'envoi sur GitHub</button></div>
   <p class="small" style="margin-top:10px">Tu obtiens un fichier .zip : décompresse-le, puis sur GitHub, ouvre ton dépôt, « Add file » → « Upload files », glisse le dossier <b>photos</b> et valide. Les photos apparaissent dans le récap en une à deux minutes.</p>` : ""}</div>`;
}
const slug = s => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
async function publishZip() {
  toast("Préparation du fichier…", 60000);
  if (!self.JSZip) await loadScript("lib/jszip.min.js");
  if (!self.JSZip) return toast("Ouvre le site une fois avec du réseau pour préparer l'envoi.");
  const id = trip.id, zip = new JSZip(), dir = zip.folder("photos").folder(id);
  const local = PHOTOS.filter(p => !p.src);
  const unpublished = new Set(local.filter(p => p.pubName && !p.wantPub).map(p => p.pubName));
  const list = ((self.PUBPHOTOS || {})[id] || []).filter(x => !unpublished.has(x.f));
  for (const p of local.filter(p => p.wantPub)) {
    const [, d, ...n] = p.key.split("|");
    const f = p.pubName || `${d}-${slug(n.join("|")) || "photo"}-${p.id.slice(-6)}.jpg`;
    dir.file(f, p.blob);
    const entry = { f, k: d + "|" + n.join("|"), c: p.caption || "" };
    const k = list.findIndex(x => x.f === f); if (k >= 0) list[k] = entry; else list.push(entry);
    if (p.pubName !== f) { p.pubName = f; try { await DB.put("photos", p); } catch (e) {} }
  }
  dir.file("photos.js", `/* Photos visibles dans le récap public de ${trip.title}.\n   Ce fichier est remplacé quand tu envoies tes photos depuis l'onglet Photos (accès privé). */\n(self.PUBPHOTOS = self.PUBPHOTOS || {})[${JSON.stringify(id)}] = ${JSON.stringify(list, null, 1)};\n`);
  const blob = await zip.generateAsync({ type: "blob" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `photos-${id}-a-envoyer.zip`;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast(`Fichier prêt : ${plural(list.length, "photo")} dans le récap`);
}

/* ---------- convertisseur euros ↔ livres ---------- */
const RATE_KEY = "cv-taux";
function getRate() { const r = ls.get(RATE_KEY); return r && r.v > 0 ? r : { v: (trip && trip.rate) || 1.16 }; }
async function refreshRate(force) {
  if (!navigator.onLine) return;
  const r = ls.get(RATE_KEY);
  if (!force && r && (r.manual || r.date === isoToday())) return;
  try {
    const j = await (await fetch("https://api.frankfurter.app/latest?from=GBP&to=EUR")).json();
    if (j && j.rates && j.rates.EUR > 0) { ls.set(RATE_KEY, { v: j.rates.EUR, date: isoToday(), src: j.date }); $$("[data-convrate]").forEach(el => el.textContent = rateTxt(getRate())); }
  } catch (e) {}
}
const num = (n, d = 2) => n.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });
function rateTxt(r) {
  const when = r.src ? `taux du ${parts(r.src).d} ${MOIS[parts(r.src).m - 1]}` : r.manual ? "taux saisi à la main" : "taux approximatif, mis à jour dès qu'il y a du réseau";
  return `1 £ = ${num(r.v)} €, 1 € = ${num(1 / r.v)} £ (${when})`;
}
const euroRange = (lo, hi) => { const v = getRate().v; return lo === hi ? num(lo * v, 0) + " €" : num(lo * v, 0) + " – " + num(hi * v, 0) + " €"; };
function convHTML() {
  if (!PRIV) return "";
  return `<div class="card panel conv"><h3>${tile("arrows-exchange", "sky")}Convertisseur</h3>
   <div class="convrow">
    <label><span>Euros</span><input data-conv="eur" inputmode="decimal" placeholder="10" autocomplete="off"></label>
    <span class="convx" aria-hidden="true">=</span>
    <label><span>Livres</span><input data-conv="gbp" inputmode="decimal" placeholder="${num(10 / getRate().v)}" autocomplete="off"></label>
   </div>
   <p class="small" data-convrate>${rateTxt(getRate())}</p>
   ${navigator.onLine ? `<button class="link" data-rate-refresh>${getRate().manual ? "Utiliser le taux du jour" : "Actualiser le taux"}</button>` : ""}</div>`;
}
function bindConv(root) {
  $$(".conv", root).forEach(box => {
    const e = $('[data-conv="eur"]', box), g = $('[data-conv="gbp"]', box);
    const val = x => parseFloat(String(x.value).replace(/\s/g, "").replace(",", "."));
    e.oninput = () => { const v = val(e); g.value = v >= 0 ? num(v / getRate().v) : ""; };
    g.oninput = () => { const v = val(g); e.value = v >= 0 ? num(v * getRate().v) : ""; };
  });
}

/* ---------- interactions ---------- */
function bindView() {
  const v = $("#app");
  hydrate(v);
  $$(".chk input", v).forEach(c => c.onchange = () => {
    const k = "cv-resa-" + trip.id, done = ls.get(k) || {}; done[c.dataset.k] = c.checked; ls.set(k, done);
    const resa = trip.resa, n = resa.filter(r => done[r[0]]).length, p = c.closest(".panel");
    p.querySelector(".prog i").style.width = (n / resa.length * 100) + "%"; p.querySelector(".cnt").textContent = `${n} sur ${resa.length} fait${n > 1 ? "s" : ""}`;
  });
  const sel = $('.daybtn[aria-current="page"]'); if (sel) sel.scrollIntoView({ block: "nearest", inline: "center" });
  if (section === "photos") showStorage();
  if (section === "comptes") bindComptes(v);
  bindConv(v);
}
document.addEventListener("change", e => {
  const a = e.target.closest("[data-addph]"); if (a) { addPhotos(a.dataset.addph, a.files, a); a.value = ""; return; }
  const im = e.target.closest("[data-import]"); if (im && im.files[0]) { importAll(im.files[0]); im.value = ""; }
});
document.addEventListener("click", async e => {
  const ph = e.target.closest("[data-ph]"); if (ph) return openLB(ph.dataset.pk, ph.dataset.ph);
  const tk = e.target.closest("[data-tk]"); if (tk) return openTicketDialog(tk.dataset.tk, tk.dataset.title);
  if (e.target.closest("[data-export]")) return exportAll();
  if (e.target.closest("[data-addexp]")) return openExp();
  if (e.target.closest("[data-unlock]")) return openUnlock();
  if (e.target.closest("[data-lock]")) return lock();
  if (e.target.closest("[data-publish]")) return publishZip();
  if (e.target.closest("[data-rate-refresh]")) { const r = ls.get(RATE_KEY); if (r && r.manual) ls.set(RATE_KEY, null); await refreshRate(true); if (!route.home) refresh(); return toast("Taux mis à jour"); }
  const st = e.target.closest("[data-settle]");
  if (st) { const [from, to, amt] = st.dataset.settle.split("|"), c = getC(); c.exp.push({ id: uid("e"), created: Date.now(), kind: "rembt", title: nameOf(c, from) + " → " + nameOf(c, to), amount: +amt, cur: "€", paidBy: from, split: [to], date: isoToday() }); setC(c); refresh(); return toast("Remboursement enregistré"); }
  const o = e.target.closest("[data-open]"); if (o) return openFile(o.dataset.open, +o.dataset.f);
  const ed = e.target.closest("[data-edit]"); if (ed) { const t = TICKETS.find(x => x.id === ed.dataset.edit); if (dlg.open) dlg.close(); return openTicketDialog(t.key, t.title, t); }
  const dl = e.target.closest("[data-del]");
  if (dl) {
    if (dl.dataset.confirm !== "1") { dl.dataset.confirm = "1"; dl.textContent = "Confirmer ?"; setTimeout(() => { dl.dataset.confirm = ""; dl.textContent = "Supprimer"; }, 3000); return; }
    await DB.del("tickets", dl.dataset.del); await loadTripData(); if (dlg.open) dlg.close(); refresh(); toast("Billet supprimé");
  }
});

function toast(msg, ms) { const t = $("#toast"); t.textContent = msg; t.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => t.hidden = true, ms || 2800); }

/* ---------- démarrage ---------- */
(async () => {
  await Promise.all((self.VOYAGES || []).flatMap(id => [loadScript("voyages/" + encodeURIComponent(id) + ".js?v=" + (self.APPV || "")), loadScript("photos/" + encodeURIComponent(id) + "/photos.js?v=" + (self.APPV || ""))]));
  TRIPS = (self.VOYAGES || []).map(id => self.TRIPS && self.TRIPS[id]).filter(t => t && ((t.days && t.days.length) || (t.places && t.places.length)));
  if (!TRIPS.length) { $("#app").innerHTML = `<header class="homehead"><div><h1>Mes voyages</h1><p>Aucun voyage trouvé. Vérifie la liste dans voyages.js.</p></div></header>`; return; }
  try { await DB.open(); await migrateOld(); } catch (e) { DB.ok = false; }
  const saved = ls.get("cv-code");
  if (saved) { try { await unlock(saved, true); } catch (e) { if (e.message === "code") ls.set("cv-code", null); } }
  // un seul voyage en cours ? on l'ouvre directement à l'ouverture de l'appli
  if (!location.hash) { const now = TRIPS.find(t => tripState(t).k === "now"); if (now) history.replaceState(null, "", "#/" + now.id); }
  await render();
})();

if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1") && !/claude\.ai|claudeusercontent/.test(location.host)) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
})();
