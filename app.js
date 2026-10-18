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

const I = {
  route: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="5" r="2.2"/><circle cx="18" cy="19" r="2.2"/><path d="M6 7.2v4.3a3 3 0 0 0 3 3h6a3 3 0 0 1 3 3v-.3"/></svg>',
  photo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  ticket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8a2 2 0 0 0 0 4v4h18v-4a2 2 0 0 1 0-4V4H3z" transform="translate(0 2)"/><path d="M14 6v2M14 11v2M14 16v2"/></svg>',
  coin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M14.5 8.5a2.5 2.5 0 0 0-4.5 1.5c0 3 0 4-1.5 5.5h6.5M8.5 12.5h5"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.6v.1"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>'
};
const SECTIONS = [["programme", "Programme", I.route], ["photos", "Photos", I.photo], ["billets", "Billets", I.ticket], ["budget", "Budget", I.coin], ["infos", "Infos", I.info]];

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
const tKey = (d, s) => trip.id + "|" + d.id + "|" + s.n;
const ticketsFor = k => TICKETS.filter(t => t.key === k);
const photosFor = k => PHOTOS.filter(p => p.key === k).sort((a, b) => a.created - b.created);

async function loadTripData() {
  try { [TICKETS, PHOTOS] = await Promise.all([DB.byTrip("tickets", trip.id), DB.byTrip("photos", trip.id)]); }
  catch (e) { DB.ok = false; TICKETS = []; PHOTOS = []; }
}

/* object URLs (aperçus et photos) */
const URLS = new Map();
function objURL(id, blob) { if (!URLS.has(id)) URLS.set(id, URL.createObjectURL(blob)); return URLS.get(id); }
function dropURL(id) { [id, id + ":f"].forEach(k => { if (URLS.has(k)) { URL.revokeObjectURL(URLS.get(k)); URLS.delete(k); } }); }
function hydrate(root) {
  $$("img[data-thumb]", root).forEach(img => { const p = PHOTOS.find(x => x.id === img.dataset.thumb); if (p) img.src = objURL(p.id, p.thumb || p.blob); });
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
  let sec = route.sec;
  if (!sec) { const st = tripState(trip); sec = st.day || ls.get("cv-last-" + trip.id) || trip.days[0].id; history.replaceState(null, "", href(sec)); }
  const di = trip.days.findIndex(d => d.id === sec);
  if (di >= 0) { section = "programme"; dayId = sec; ls.set("cv-last-" + trip.id, sec); }
  else if (["photos", "billets", "budget", "infos"].includes(sec)) section = sec;
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
  setTheme(TRIPS[0]);
  const stats = {};
  await Promise.all(TRIPS.map(async t => {
    let ph = [];
    try { ph = await DB.byTrip("photos", t.id); } catch (e) {}
    ph.sort((a, b) => b.created - a.created);
    stats[t.id] = { photos: ph.length, cover: ph[0] || null, stops: t.days.reduce((a, d) => a + d.stops.length, 0) };
  }));
  const order = TRIPS.slice().sort((a, b) => {
    const pa = tripState(a).k === "past", pb = tripState(b).k === "past";
    return pa !== pb ? (pa ? 1 : -1) : (pa ? b.start.localeCompare(a.start) : a.start.localeCompare(b.start));
  });
  $("#app").innerHTML = `
   <header class="homehead"><div><h1>Mes voyages</h1><p>Programme jour par jour, trajets, photos et billets. Tout reste disponible sans réseau.</p></div>${netPill()}</header>
   <div class="trips">${order.map(t => {
     const st = tripState(t), s = stats[t.id];
     return `<a class="trip ${st.k}" href="#/${esc(t.id)}" style="--c:${esc(t.color)};--a:${esc(t.accent)}">
       <div class="cover${s.cover ? "" : " noimg"}">${s.cover ? `<img alt="" data-cover="${s.cover.id}">` : ""}
         <div class="lines" aria-hidden="true">${t.days.map(d => `<i style="background:${esc(d.c)}"></i>`).join("")}</div></div>
       <div class="tinfo">
         <div class="tstatus">${esc(st.txt)}</div>
         <h2>${esc(t.title)}</h2>
         <div class="tdates">${esc(range(t.start, t.end))}${t.country ? ", " + esc(t.country) : ""}</div>
         ${t.summary ? `<p>${esc(t.summary)}</p>` : ""}
         <div class="tcounts"><span><b>${t.days.length}</b>jours</span><span><b>${s.stops}</b>étapes</span><span><b>${s.photos}</b>photo${s.photos > 1 ? "s" : ""}</span></div>
       </div></a>`;
   }).join("")}</div>
   <section class="howto"><h2>Ajouter un voyage</h2><p>Sur GitHub, copie le fichier <b>voyages/modele.js</b> sous un nouveau nom (par exemple <b>voyages/rome.js</b>), remplis-le, puis ajoute son nom dans <b>voyages.js</b>. Le nouveau voyage apparaît ici une à deux minutes plus tard.</p></section>
   <footer>Les photos, billets et cases cochées sont enregistrés uniquement sur cet appareil.</footer>`;
  $$("img[data-cover]").forEach(img => { const id = img.dataset.cover; for (const t of TRIPS) { const c = stats[t.id].cover; if (c && c.id === id) img.src = objURL("cover:" + id, c.thumb || c.blob); } });
}
function setTheme(t) { const m = $('meta[name="theme-color"]'); if (m && t) m.content = t.color; }
const netPill = () => `<span class="net" data-net ${navigator.onLine ? "hidden" : ""}>Hors ligne</span>`;
function updateNet() { $$("[data-net]").forEach(n => n.hidden = navigator.onLine); }
window.addEventListener("online", updateNet); window.addEventListener("offline", updateNet);

/* ---------- page voyage ---------- */
function renderTrip() {
  const t = trip, st = tripState(t);
  document.title = t.title + " · Mes voyages";
  setTheme(t);
  document.documentElement.style.setProperty("--c", t.color); document.documentElement.style.setProperty("--a", t.accent);
  const counts = { photos: PHOTOS.length, billets: TICKETS.length };
  const view = section === "programme" ? dayView() : section === "photos" ? photosView() : section === "billets" ? billetsView() : section === "budget" ? budgetView() : infosView();
  $("#app").innerHTML = `
   <div class="tripbar"><a class="back" href="#/">${I.back}Mes voyages</a>${netPill()}</div>
   <header class="top">
     <div class="ttl">
       <h1>${esc(t.title)}</h1>
       <div class="dates">${esc(range(t.start, t.end))}</div>
       <div class="facts"><span class="status">${esc(st.txt)}</span>${(t.facts || []).map(f => `<span>${esc(f[0])} : <b>${esc(f[1])}</b></span>`).join("")}</div>
     </div>
   </header>
   <nav class="secnav" aria-label="Sections du voyage">${SECTIONS.filter(s => s[0] !== "budget" || (t.budget && t.budget.length) || (t.paid && t.paid.length)).map(([id, lab, ic]) =>
     `<a href="${href(id === "programme" ? dayId || t.days[0].id : id)}" ${section === id ? 'aria-current="page"' : ""}>${ic}<span>${lab}</span>${counts[id] ? `<span class="n">${counts[id]}</span>` : ""}</a>`).join("")}</nav>
   ${view}
   ${t.footer ? `<footer>${esc(t.footer)} Les photos, billets et cases cochées restent sur l'appareil qui les a enregistrés.</footer>` : ""}`;
  bindView();
}

function daysNav() {
  const today = isoToday();
  return `<div id="dayanchor"></div><nav class="days" aria-label="Jours du voyage"><div class="daylist">${trip.days.map((d, i) =>
    `<a class="daybtn${d.light ? " light" : ""}" href="${href(d.id)}" style="--dc:${esc(d.c)}" ${d.id === dayId ? 'aria-current="page"' : ""}><span class="d1">Jour ${i + 1}</span><span class="d2">${esc(d.dow)} ${esc(d.label)}</span>${d.date === today ? '<span class="today" title="Aujourd\'hui"></span>' : ""}</a>`).join("")}</div></nav>`;
}

function photoStrip(key, label) {
  const list = photosFor(key), max = 7, shown = list.length > max ? list.slice(0, max - 1) : list;
  return `${list.length ? `<div class="phs">${shown.map(p => `<button class="pth" data-ph="${p.id}" data-pk="${esc(key)}" aria-label="Voir la photo${p.caption ? " : " + esc(p.caption) : ""}"><img alt="" data-thumb="${p.id}" loading="lazy"></button>`).join("")}
      ${list.length > max ? `<button class="pth more" data-ph="${list[max - 1].id}" data-pk="${esc(key)}" aria-label="Voir les ${list.length} photos">+${list.length - max + 1}</button>` : ""}</div>` : ""}`;
}
const addPhotoBtn = key => `<label class="chip">${I.photo}Ajouter des photos<input type="file" class="vh" accept="image/*" multiple data-addph="${esc(key)}"></label>`;

function stopHTML(d, s, i) {
  const t = trip, prev = i === 0 ? t.hotel && t.hotel.q : d.stops[i - 1].q;
  const prevName = i === 0 ? "l'hôtel" : d.stops[i - 1].n;
  const key = tKey(d, s), nt = ticketsFor(key).length, np = photosFor(key).length;
  const how = (s.how || []).length ? `<details class="how"${i === 0 ? " open" : ""}>
     <summary><span>Comment y aller</span><span class="from">depuis ${esc(prevName)}</span></summary>
     <ol>${s.how.map(h => `<li>${esc(h)}</li>`).join("")}</ol>
     ${prev && prev !== s.q ? `<a class="mini" href="${mapsDir(t, prev, s.q, s.mode === "walk")}" target="_blank" rel="noopener">${s.mode === "walk" ? "Itinéraire à pied" : "Itinéraire en transports"} dans Google Maps ↗</a>` : ""}
   </details>` : "";
  return `<li class="stop${s.major ? " major" : ""}" id="${esc(d.id)}-${i}">
    <div class="time">${esc(s.t)}</div><div class="tick"></div>
    <div class="card">
      <span class="ctime">${esc(s.t)}</span>
      <h3><a href="${mapsSearch(t, s.q)}" target="_blank" rel="noopener">${esc(s.n)}</a></h3>
      ${s.addr ? `<div class="addr">${esc(s.addr)}</div>` : ""}
      ${s.d ? `<p>${esc(s.d)}</p>` : ""}
      ${s.tags ? `<div class="tags">${s.tags.map(g => `<span class="tag ${esc(g[1])}">${esc(g[0])}</span>`).join("")}</div>` : ""}
      ${s.warn ? `<div class="alert">${esc(s.warn)}</div>` : ""}
      ${s.adj ? `<div class="adj"><b>Ajusté</b>${esc(s.adj)}</div>` : ""}
      ${how}
      ${photoStrip(key)}
      <div class="acts">${addPhotoBtn(key, np)}
      ${s.tk ? `<button class="chip tk${nt ? " has" : ""}" data-tk="${esc(key)}" data-title="${esc(s.n)}">${I.ticket}${nt ? `Billets (${nt})` : "Ajouter un billet"}</button>` : ""}</div>
    </div></li>`;
}

function dayView() {
  const t = trip, i = t.days.findIndex(d => d.id === dayId), d = t.days[i];
  return `${daysNav()}<main><section aria-labelledby="h-${esc(d.id)}" style="--line:${esc(d.c)};min-width:0">
   <div class="dayhead"><div style="min-width:0">
     <div class="lineName"><i></i>${esc(d.dow)} ${esc(d.label)} ${parts(d.date).y}, jour ${i + 1}${d.line ? ", " + esc(d.line) : ""}</div>
     <h2 id="h-${esc(d.id)}">${esc(d.title)}</h2>
     ${d.sub ? `<div class="daysub">${esc(d.sub)}</div>` : ""}</div>
     <a class="btn" href="${dayRoute(t, d)}" target="_blank" rel="noopener">Carte de la journée ↗</a>
   </div>
   ${(d.notes || []).length ? `<div class="notes">${d.notes.map(n => `<div class="note ${esc(n[1])}">${esc(n[0])}</div>`).join("")}</div>` : ""}
   <ol class="route">${d.stops.map((s, k) => stopHTML(d, s, k)).join("")}
   ${d.back && d.back.length ? `<li class="stop home"><div class="time">Retour</div><div class="tick"></div><div class="card"><span class="ctime">Retour</span><h3>Rentrer à l'hôtel</h3>
      <ol class="plain">${d.back.map(h => `<li>${esc(h)}</li>`).join("")}</ol>
      ${t.hotel ? `<a class="mini" href="${mapsDir(t, d.stops[d.stops.length - 1].q, t.hotel.q, false)}" target="_blank" rel="noopener">Itinéraire retour dans Google Maps ↗</a>` : ""}</div></li>` : ""}
   </ol>
   <div class="pager">
    ${i > 0 ? `<a class="btn" href="${href(t.days[i - 1].id)}">‹ ${esc(t.days[i - 1].dow)} ${esc(t.days[i - 1].label)}</a>` : "<span></span>"}
    ${i < t.days.length - 1 ? `<a class="btn" href="${href(t.days[i + 1].id)}">${esc(t.days[i + 1].dow)} ${esc(t.days[i + 1].label)} ›</a>` : ""}
   </div>
  </section>${sidebar()}</main>`;
}

function sidebar() {
  const t = trip, resa = t.resa || [], done = ls.get("cv-resa-" + t.id) || {};
  const n = resa.filter(r => done[r[0]]).length;
  const oui = (t.budget || []).filter(b => b[3] === "oui");
  const lo = oui.reduce((a, b) => a + b[4], 0), hi = oui.reduce((a, b) => a + b[5], 0);
  return `<aside>
   ${resa.length ? `<div class="panel"><h3>À réserver</h3>
    <div class="prog"><i style="width:${n / resa.length * 100}%"></i></div>
    <div class="small cnt" style="margin-bottom:8px">${n} sur ${resa.length} fait${n > 1 ? "s" : ""}</div>
    <div class="chk">${resa.map(r => `<label><input type="checkbox" data-k="${esc(r[0])}" ${done[r[0]] ? "checked" : ""}><span>${esc(r[1])}<em>${esc(r[2])}</em></span></label>`).join("")}</div>
   </div>` : ""}
   <div class="panel"><h3>Photos</h3><div class="big">${PHOTOS.length}</div>
    <div class="small">photo${PHOTOS.length > 1 ? "s" : ""} sur cet appareil</div>
    <div style="margin-top:12px"><a class="btn" href="${href("photos")}">Voir toutes les photos</a></div></div>
   <div class="panel"><h3>Mes billets</h3><div class="big">${TICKETS.length}</div>
    <div class="small">billet${TICKETS.length > 1 ? "s" : ""} enregistré${TICKETS.length > 1 ? "s" : ""} sur cet appareil</div>
    <div style="margin-top:12px"><a class="btn" href="${href("billets")}">Ouvrir mes billets</a></div></div>
   ${oui.length ? `<div class="panel"><h3>Budget activités</h3><div class="big">${money(lo)} – ${money(hi)}</div>
    <div class="small">par personne, pour ce que tu as noté « Oui ». Hors repas et transports du quotidien.</div>
    <div style="margin-top:12px"><a class="btn" href="${href("budget")}">Voir le détail</a></div></div>` : ""}
  </aside>`;
}
const money = n => (trip.currency || "€") + (Math.round(n * 100) / 100).toString().replace(".", ",");

/* ---------- photos ---------- */
function photosView() {
  const t = trip, byKey = {};
  PHOTOS.forEach(p => (byKey[p.key] = byKey[p.key] || []).push(p));
  const known = new Set();
  const days = t.days.map(d => {
    const stops = d.stops.map(s => { const k = tKey(d, s); known.add(k); return byKey[k] ? [s, k] : null; }).filter(Boolean);
    return stops.length ? `<section class="pgday" style="--line:${esc(d.c)}"><h3><i></i><a href="${href(d.id)}">${esc(d.dow)} ${esc(d.label)}, ${esc(d.title)}</a></h3>
      ${stops.map(([s, k]) => `<div class="pgstop"><h4>${esc(s.n)}</h4><div class="pgrid">${photosFor(k).map(p => `<button class="pth" data-ph="${p.id}" data-pk="${esc(k)}" aria-label="Voir la photo"><img alt="" data-thumb="${p.id}" loading="lazy"></button>`).join("")}</div></div>`).join("")}</section>` : "";
  }).join("");
  const orphan = Object.keys(byKey).filter(k => !known.has(k));
  return `<main class="full"><section style="min-width:0">
   <h2 class="pageh">Photos</h2>
   <div class="daysub">${PHOTOS.length ? `${plural(PHOTOS.length, "photo")} rangée${PHOTOS.length > 1 ? "s" : ""} par jour et par endroit.` : ""} Pour en ajouter, ouvre un jour du programme et touche « Ajouter des photos » sur l'étape.</div>
   <div class="store small" id="storeInfo"></div>
   ${!DB.ok ? `<div class="note warn" style="margin-top:14px">Ce navigateur bloque le stockage (navigation privée ?). Ouvre le site dans une fenêtre normale pour garder des photos.</div>` : ""}
   ${PHOTOS.length ? days + (orphan.length ? `<section class="pgday"><h3><i></i>Autres photos</h3><p class="small">Étapes renommées ou retirées du programme.</p>${orphan.map(k => `<div class="pgstop"><h4>${esc(k.split("|").slice(2).join("|"))}</h4><div class="pgrid">${photosFor(k).map(p => `<button class="pth" data-ph="${p.id}" data-pk="${esc(k)}"><img alt="" data-thumb="${p.id}" loading="lazy"></button>`).join("")}</div></div>`).join("")}</section>` : "")
     : `<div class="empty">${I.photo}<p><b>Pas encore de photo.</b><br>Chaque étape du programme a un bouton « Ajouter des photos » : prends une photo sur place ou choisis-en dans ta galerie.</p></div>
        <div class="toolbar"><a class="btn solid" href="${href(dayId || t.days[0].id)}">Ouvrir le programme</a></div>`}
   ${backupPanel()}
  </section></main>`;
}
function backupPanel() {
  return `<div class="panel" style="margin-top:26px"><h3>Sauvegarder ou changer d'appareil</h3>
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
  const u = objURL(p.id + ":f", p.blob);
  $("#lbImg").src = u; $("#lbImg").alt = p.caption || "";
  $("#lbTitle").textContent = stopLabel(p.key);
  $("#lbCount").textContent = lbList.length > 1 ? `${lbI + 1} / ${lbList.length}` : "";
  $("#lbCap").value = p.caption || "";
  $("#lbPrev").disabled = lbI === 0; $("#lbNext").disabled = lbI >= lbList.length - 1;
  const fname = (stopLabel(p.key).replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "photo") + "-" + (lbI + 1) + ".jpg";
  $("#lbDl").href = u; $("#lbDl").download = fname;
  const del = $("#lbDel"); del.dataset.confirm = ""; del.lastChild.textContent = "Supprimer";
  const file = new File([p.blob], fname, { type: p.blob.type || "image/jpeg" });
  $("#lbShare").hidden = !(navigator.canShare && navigator.canShare({ files: [file] }));
  $("#lbShare").onclick = () => navigator.share({ files: [file], title: stopLabel(p.key) }).catch(() => {});
}
const lbGo = n => { saveCap(); const j = lbI + n; if (j >= 0 && j < lbList.length) { lbI = j; showLB(); } };
async function saveCap() {
  const p = lbList[lbI]; if (!p) return; const v = $("#lbCap").value.trim();
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
   <h2 class="pageh">Mes billets</h2>
   <div class="daysub">PDF, captures d'écran ou photos de billets. Ils restent sur cet appareil et s'ouvrent sans connexion.</div>
   ${DB.ok ? "" : `<div class="note warn" style="margin-top:14px">Ce navigateur bloque le stockage (navigation privée ?). Ouvre le site dans une fenêtre normale pour enregistrer des billets.</div>`}
   <div class="toolbar"><button class="btn solid" data-tk="${esc(trip.id)}|general" data-title="">${I.plus}Ajouter un billet</button></div>
   ${order.length ? order.map(k => `<div class="tgroup"><h3>${esc(ticketLabel(k))}</h3><div class="tlist">${groups[k].map(ticketCard).join("")}</div></div>`).join("")
     : `<div class="empty">${I.ticket}<p><b>Aucun billet pour l'instant.</b><br>Touche « Ajouter un billet » ici, ou sur une étape réservée du programme.</p></div>`}
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
  const out = new Blob([JSON.stringify({ app: "carnets-voyage", v: 2, trip: trip.id, tickets, photos })], { type: "application/json" });
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
   ${paidBlock()}
   <h2 class="pageh"${(t.paid || []).length ? ' style="margin-top:34px"' : ""}>Activités, par personne</h2>
   <div class="daysub">Repris de ton tableau, avec ta colonne « On rentre ? ».</div>
   <div class="sum">
    <div><span class="small">Activités retenues</span><span class="big">${money(ol)} – ${money(oh)}</span></div>
    ${jh ? `<div><span class="small">Si tu ajoutes les « Je sais pas »</span><span class="big">+ ${money(jl)} – ${money(jh)}</span></div>` : ""}
   </div>
   <div class="tbl"><table><thead><tr><th>Activité</th><th>Prix / pers.</th><th>On rentre ?</th><th>Jour</th><th>Remarque</th></tr></thead><tbody>
    ${B.map(b => `<tr><td>${esc(b[0])}</td><td class="num">${esc(b[1])}</td><td><span class="st ${esc(b[3])}">${lab[b[3]] || esc(b[3])}</span></td><td>${esc(b[6])}</td><td class="small">${esc(b[2])}</td></tr>`).join("")}
   </tbody></table></div>
   ${t.free ? `<div class="panel" style="margin-top:16px"><h3>Gratuit</h3><p class="small" style="margin:0">${esc(t.free)}</p></div>` : ""}
  </section>${sidebar()}</main>`;
}
const euro = n => n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
function paidBlock() {
  const P = trip.paid || []; if (!P.length) return "";
  const tot = P.reduce((a, x) => a + x[2], 0);
  return `<h2 class="pageh">Déjà réservé</h2>
   <div class="daysub">Payé pour tout le groupe, en euros.</div>
   <div class="sum"><div><span class="small">Total réglé</span><span class="big">${euro(tot)}</span></div></div>
   <div class="tbl"><table class="paid"><thead><tr><th>Réservation</th><th>Détail</th><th>Montant</th></tr></thead><tbody>
    ${P.map(x => `<tr><td>${esc(x[0])}</td><td class="small">${esc(x[1])}</td><td class="num">${euro(x[2])}</td></tr>`).join("")}
   </tbody></table></div>`;
}
function infosView() {
  const t = trip;
  return `<main><section style="min-width:0">
   <h2 class="pageh">Infos pratiques</h2>
   <div class="grid2">
    ${(t.infos || []).map(x => `<div class="panel"><h3>${esc(x[0])}</h3><p class="small">${esc(x[1])}</p></div>`).join("")}
    ${(t.bonus || []).length ? `<div class="panel"><h3>Idées en plus</h3><ul class="bonus">${t.bonus.map(b => `<li><a href="${mapsSearch(t, b[2])}" target="_blank" rel="noopener">${esc(b[0])}</a> <span class="small">${esc(b[1])}</span></li>`).join("")}</ul></div>` : ""}
    <div class="panel"><h3>Hors connexion</h3><p class="small">Ce site s'enregistre sur l'appareil dès la première visite : programme, photos et billets s'ouvrent ensuite sans réseau, même dans le métro. Seuls les liens Google Maps demandent une connexion. Ajoute-le à l'écran d'accueil pour l'ouvrir comme une appli.</p></div>
   </div>
  </section>${sidebar()}</main>`;
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
}
document.addEventListener("change", e => {
  const a = e.target.closest("[data-addph]"); if (a) { addPhotos(a.dataset.addph, a.files, a); a.value = ""; return; }
  const im = e.target.closest("[data-import]"); if (im && im.files[0]) { importAll(im.files[0]); im.value = ""; }
});
document.addEventListener("click", async e => {
  const ph = e.target.closest("[data-ph]"); if (ph) return openLB(ph.dataset.pk, ph.dataset.ph);
  const tk = e.target.closest("[data-tk]"); if (tk) return openTicketDialog(tk.dataset.tk, tk.dataset.title);
  if (e.target.closest("[data-export]")) return exportAll();
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
  await Promise.all((self.VOYAGES || []).map(id => loadScript("voyages/" + encodeURIComponent(id) + ".js")));
  TRIPS = (self.VOYAGES || []).map(id => self.TRIPS && self.TRIPS[id]).filter(t => t && t.days && t.days.length);
  if (!TRIPS.length) { $("#app").innerHTML = `<header class="homehead"><div><h1>Mes voyages</h1><p>Aucun voyage trouvé. Vérifie la liste dans voyages.js.</p></div></header>`; return; }
  try { await DB.open(); await migrateOld(); } catch (e) { DB.ok = false; }
  // un seul voyage en cours ? on l'ouvre directement à l'ouverture de l'appli
  if (!location.hash) { const now = TRIPS.find(t => tripState(t).k === "now"); if (now) history.replaceState(null, "", "#/" + now.id); }
  await render();
})();

if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1") && !/claude\.ai|claudeusercontent/.test(location.host)) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
})();
