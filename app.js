(() => {
const T = window.TRIP, DAYS = window.DAYS, BUDGET = window.BUDGET, RESA = window.RESA, BONUS = window.BONUS;
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fmt = n => "£" + (Math.round(n * 100) / 100).toString().replace(".", ",");
const city = q => q + ", London";
const mapsSearch = q => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(city(q));
const mapsDir = (from, to, walk) => "https://www.google.com/maps/dir/?api=1&origin=" + encodeURIComponent(city(from)) +
  "&destination=" + encodeURIComponent(city(to)) + "&travelmode=" + (walk ? "walking" : "transit");
const dayRoute = d => "https://www.google.com/maps/dir/" + [...new Set([T.hotel.q, ...d.stops.map(s => s.q)])].map(q => encodeURIComponent(city(q))).join("/");
const stopKey = (d, s) => d.id + "|" + s.n;

/* ---------- petit stockage local (préférences) ---------- */
const ls = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};
let done = ls.get("ldn27-resa") || {};

/* ---------- billets : IndexedDB (reste sur l'appareil) ---------- */
const DB = {
  db: null,
  open() {
    if (this.db) return Promise.resolve(this.db);
    return new Promise((res, rej) => {
      let r;
      try { r = indexedDB.open("londres-2027", 1); } catch (e) { return rej(e); }
      r.onupgradeneeded = () => { const s = r.result.createObjectStore("tickets", { keyPath: "id" }); s.createIndex("key", "key"); };
      r.onsuccess = () => { this.db = r.result; res(this.db); };
      r.onerror = () => rej(r.error);
    });
  },
  async tx(mode, fn) {
    const db = await this.open();
    return new Promise((res, rej) => {
      const t = db.transaction("tickets", mode), st = t.objectStore("tickets");
      const out = fn(st); t.oncomplete = () => res(out && out.result !== undefined ? out.result : out); t.onerror = () => rej(t.error);
    });
  },
  all() { return this.tx("readonly", s => s.getAll()); },
  put(v) { return this.tx("readwrite", s => s.put(v)); },
  del(id) { return this.tx("readwrite", s => s.delete(id)); }
};
let TICKETS = [];
let dbOK = true;
async function loadTickets() { try { TICKETS = await DB.all(); } catch (e) { dbOK = false; TICKETS = []; } }
const ticketsFor = key => TICKETS.filter(t => t.key === key);

/* ---------- onglets ---------- */
const TABS = [...DAYS.map((d, i) => ({ id: d.id, a: d.dow + " " + d.label, b: "Jour " + (i + 1), c: d.c, light: d.light })),
  { id: "billets", a: "Mes billets", b: "Billets", extra: 1 },
  { id: "budget", a: "Budget", b: "Prix", extra: 1 },
  { id: "infos", a: "Pratique", b: "Infos", extra: 1 }];

function todayId() {
  const t = new Date(); const iso = t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0");
  const d = DAYS.find(x => x.date === iso); return d ? d.id : null;
}

function header() {
  const start = new Date(T.start + "T00:00:00"), now = new Date();
  const days = Math.ceil((start - now) / 86400000);
  const tid = todayId();
  $("#count").innerHTML = tid ? `<b>C'est aujourd'hui !</b> <button class="link" id="goToday">Voir le programme du jour</button>`
    : days > 0 ? `Départ dans <b>${days} jour${days > 1 ? "s" : ""}</b>` : `Voyage terminé`;
  const g = $("#goToday"); if (g) g.onclick = () => go(tid);
}

function renderTabs(cur) {
  $("#daylist").innerHTML = TABS.map(t => `<button class="daybtn${t.light ? " light" : ""}${t.extra ? " extra" : ""}" role="tab" id="tab-${t.id}" aria-selected="${t.id === cur}" style="--c:${t.c || "var(--navy)"}" data-id="${t.id}"><span class="d1">${esc(t.b)}</span><span class="d2">${esc(t.a)}</span></button>`).join("");
  document.querySelectorAll(".daybtn").forEach(b => b.onclick = () => go(b.dataset.id));
  const sel = $("#tab-" + cur); if (sel) sel.scrollIntoView({ block: "nearest", inline: "center" });
}

function sidebar() {
  const n = RESA.filter(r => done[r[0]]).length;
  const oui = BUDGET.filter(b => b[3] === "oui");
  const lo = oui.reduce((a, b) => a + b[4], 0), hi = oui.reduce((a, b) => a + b[5], 0);
  return `<aside>
   <div class="panel"><h3>À réserver</h3>
    <div class="prog"><i style="width:${n / RESA.length * 100}%"></i></div>
    <div class="small cnt" style="margin-bottom:10px">${n} sur ${RESA.length} fait${n > 1 ? "s" : ""}</div>
    <div class="chk">${RESA.map(r => `<label for="r-${r[0]}"><input type="checkbox" id="r-${r[0]}" data-k="${r[0]}" ${done[r[0]] ? "checked" : ""}><span>${esc(r[1])}<em>${esc(r[2])}</em></span></label>`).join("")}</div>
   </div>
   <div class="panel"><h3>Mes billets</h3>
    <div class="big">${TICKETS.length}</div>
    <div class="small">billet${TICKETS.length > 1 ? "s" : ""} enregistré${TICKETS.length > 1 ? "s" : ""} sur cet appareil</div>
    <div style="margin-top:12px"><button class="btn" data-go="billets">Ouvrir mes billets</button></div>
   </div>
   <div class="panel"><h3>Budget activités</h3>
    <div class="big">${fmt(lo)} – ${fmt(hi)}</div>
    <div class="small">par personne, pour ce que tu as noté « Oui ». Hors repas, transports du quotidien et options.</div>
    <div style="margin-top:12px"><button class="btn" data-go="budget">Voir le détail</button></div>
   </div>
  </aside>`;
}

function stopHTML(d, s, i) {
  const prev = i === 0 ? T.hotel.q : d.stops[i - 1].q;
  const prevName = i === 0 ? "l'hôtel" : d.stops[i - 1].n;
  const key = stopKey(d, s), nt = ticketsFor(key).length;
  const how = (s.how || []).length ? `<details class="how"${i === 0 ? " open" : ""}>
     <summary><span>Comment y aller</span><span class="from">depuis ${esc(prevName)}</span></summary>
     <ol>${s.how.map(h => `<li>${esc(h)}</li>`).join("")}</ol>
     ${prev !== s.q ? `<a class="mini" href="${mapsDir(prev, s.q, s.mode === "walk")}" target="_blank" rel="noopener">${s.mode === "walk" ? "Itinéraire à pied" : "Itinéraire en transports"} dans Google Maps ↗</a>` : ""}
   </details>` : "";
  return `<li class="stop${s.major ? " major" : ""}">
    <div class="time">${esc(s.t)}</div><div class="tick"></div>
    <div class="card">
      <h3><a href="${mapsSearch(s.q)}" target="_blank" rel="noopener">${esc(s.n)}</a></h3>
      ${s.addr ? `<div class="addr">${esc(s.addr)}</div>` : ""}
      ${s.d ? `<p>${esc(s.d)}</p>` : ""}
      ${s.tags ? `<div class="tags">${s.tags.map(t => `<span class="tag ${t[1]}">${esc(t[0])}</span>`).join("")}</div>` : ""}
      ${s.warn ? `<div class="alert">${esc(s.warn)}</div>` : ""}
      ${s.adj ? `<div class="adj"><b>Ajusté</b>${esc(s.adj)}</div>` : ""}
      ${how}
      ${s.tk ? `<button class="tk${nt ? " has" : ""}" data-key="${esc(key)}" data-title="${esc(s.n)}">${nt ? `Billets (${nt})` : "Ajouter un billet"}</button>` : ""}
    </div></li>`;
}

function dayView(d, i) {
  return `<main><section aria-labelledby="h-${d.id}" style="--line:${d.c};min-width:0">
   <div class="dayhead"><div style="min-width:0">
     <div class="lineName"><i></i>${esc(d.dow)} ${esc(d.label)} 2027 · Jour ${i + 1}</div>
     <h2 id="h-${d.id}">${esc(d.title)}</h2>
     <div class="daysub">${esc(d.sub)}</div></div>
     <a class="btn" href="${dayRoute(d)}" target="_blank" rel="noopener">Carte de la journée ↗</a>
   </div>
   ${d.notes.length ? `<div class="notes">${d.notes.map(n => `<div class="note ${n[1]}">${esc(n[0])}</div>`).join("")}</div>` : ""}
   <ol class="route">${d.stops.map((s, k) => stopHTML(d, s, k)).join("")}
   ${d.back && d.back.length ? `<li class="stop home"><div class="time">Retour</div><div class="tick"></div><div class="card"><h3>Rentrer à l'hôtel</h3>
      <ol class="plain">${d.back.map(h => `<li>${esc(h)}</li>`).join("")}</ol>
      <a class="mini" href="${mapsDir(d.stops[d.stops.length - 1].q, T.hotel.q, false)}" target="_blank" rel="noopener">Itinéraire retour dans Google Maps ↗</a></div></li>` : ""}
   </ol>
   <div class="pager">
    ${i > 0 ? `<button class="btn" data-go="${DAYS[i - 1].id}">← ${esc(DAYS[i - 1].dow)} ${esc(DAYS[i - 1].label)}</button>` : "<span></span>"}
    ${i < DAYS.length - 1 ? `<button class="btn" data-go="${DAYS[i + 1].id}">${esc(DAYS[i + 1].dow)} ${esc(DAYS[i + 1].label)} →</button>` : ""}
   </div>
  </section>${sidebar()}</main>`;
}

function allStops() {
  const out = [["general", "Général (vol, hôtel, assurance…)"]];
  DAYS.forEach(d => d.stops.forEach(s => { if (s.tk) out.push([stopKey(d, s), d.dow + " " + d.label + " · " + s.n]); }));
  return out;
}
function labelFor(key) { const f = allStops().find(x => x[0] === key); return f ? f[1] : key; }

function billetsView() {
  const groups = {};
  TICKETS.slice().sort((a, b) => a.created - b.created).forEach(t => (groups[t.key] = groups[t.key] || []).push(t));
  const order = allStops().map(x => x[0]).filter(k => groups[k]);
  Object.keys(groups).forEach(k => { if (!order.includes(k)) order.push(k); });
  return `<main><section class="extra" style="margin-top:0;min-width:0">
   <h2 class="pageh">Mes billets</h2>
   <div class="daysub">Ajoute tes PDF, captures d'écran ou photos de billets. Ils restent sur cet appareil, dans ce navigateur, et marchent sans connexion.</div>
   ${dbOK ? "" : `<div class="note warn" style="margin-top:14px">Ce navigateur bloque le stockage (navigation privée ?). Ouvre le site dans une fenêtre normale pour enregistrer des billets.</div>`}
   <div class="toolbar">
     <button class="btn solid" id="addGeneral">+ Ajouter un billet</button>
     <button class="btn" id="exportT">Sauvegarder (fichier)</button>
     <label class="btn" for="importT">Restaurer une sauvegarde</label><input type="file" id="importT" accept="application/json,.json" hidden>
   </div>
   ${order.length ? order.map(k => `<div class="tgroup"><h3>${esc(labelFor(k))}</h3><div class="tlist">${groups[k].map(ticketCard).join("")}</div></div>`).join("")
     : `<div class="empty"><div class="emptyIcon" aria-hidden="true"></div><p><b>Aucun billet pour l'instant.</b><br>Clique sur « Ajouter un billet », ou sur le bouton « Ajouter un billet » d'une étape (London Eye, Harry Potter, Sky Garden…).</p></div>`}
   <div class="panel" style="margin-top:22px"><h3>Changer d'appareil</h3><p class="small" style="margin:0">Les billets ne sont pas envoyés sur GitHub (ton site est public, tes QR codes ne doivent pas l'être). Pour les avoir sur ton téléphone : « Sauvegarder » sur l'ordinateur, envoie-toi le fichier, puis « Restaurer une sauvegarde » sur le téléphone. Ou ajoute-les directement depuis le téléphone.</p></div>
  </section>${sidebar()}</main>`;
}

function ticketCard(t) {
  return `<div class="tcard"><div class="tthumbs">${(t.files || []).map((f, j) => f.type.startsWith("image/")
      ? `<button class="thumb" data-open="${t.id}" data-f="${j}" aria-label="Ouvrir ${esc(f.name)}"><img alt="" data-blob="${t.id}:${j}"></button>`
      : `<button class="thumb file" data-open="${t.id}" data-f="${j}"><span>${esc((f.name.split(".").pop() || "").toUpperCase())}</span><em>${esc(f.name)}</em></button>`).join("")}</div>
    <div class="tmeta"><b>${esc(t.title || "Billet")}</b>${t.ref ? `<div class="ref">Réf. <span>${esc(t.ref)}</span></div>` : ""}${t.note ? `<div class="small">${esc(t.note)}</div>` : ""}</div>
    <div class="tact"><button class="link" data-edit="${t.id}">Modifier</button><button class="link danger" data-del="${t.id}">Supprimer</button></div></div>`;
}

function budgetView() {
  const lab = { oui: "Oui", non: "Non", jsp: "Je sais pas" };
  const sum = k => { const r = BUDGET.filter(b => b[3] === k); return [r.reduce((a, b) => a + b[4], 0), r.reduce((a, b) => a + b[5], 0)]; };
  const [ol, oh] = sum("oui"), [jl, jh] = sum("jsp");
  return `<main><section class="extra" style="margin-top:0;min-width:0">
   <h2 class="pageh">Budget par personne</h2>
   <div class="daysub">Repris de ton tableau, avec ta colonne « On rentre ? ».</div>
   <div class="sum">
    <div><span class="small">Activités retenues</span><span class="big">${fmt(ol)} – ${fmt(oh)}</span></div>
    <div><span class="small">Si tu ajoutes les « Je sais pas »</span><span class="big">+ ${fmt(jl)} – ${fmt(jh)}</span></div>
   </div>
   <div class="tbl"><table><thead><tr><th>Activité</th><th>Prix / pers.</th><th>On rentre ?</th><th>Jour</th><th>Remarque</th></tr></thead><tbody>
    ${BUDGET.map(b => `<tr><td>${esc(b[0])}</td><td class="num">${esc(b[1])}</td><td><span class="st ${b[3]}">${lab[b[3]]}</span></td><td>${esc(b[6])}</td><td class="small">${esc(b[2])}</td></tr>`).join("")}
   </tbody></table></div>
   <p class="small">Prix relevés en 2026, ils peuvent augmenter d'ici mai 2027.</p>
   <div class="panel" style="margin-top:16px"><h3>Gratuit</h3>
    <p class="small" style="margin:0">British Museum, National Gallery, Natural History Museum, Science Museum, Tate Modern, National Maritime Museum · St James's Park, Hyde Park, Kensington Gardens, Regent's Park, Greenwich Park, Primrose Hill · Borough, Greenwich, Leadenhall, Columbia Road et Camden (achats en sus) · Big Ben, relève de la garde, Westminster Bridge, Tower Bridge à pied · Sky Garden, Horizon 22, The Garden at 120 · Outernet · Harrods, Hamleys, Disney Store, Selfridges, M&M's World, LEGO Store, Westfield.</p>
   </div>
  </section>${sidebar()}</main>`;
}

function infosView() {
  return `<main><section class="extra" style="margin-top:0;min-width:0">
   <h2 class="pageh">Infos pratiques</h2>
   <div class="grid2">
    <div class="panel"><h3>Payer les transports</h3><p class="small" style="margin:0">Métro, bus, Elizabeth line, Overground, DLR, téléphérique et bateaux Uber Boat : passe ta carte bancaire sans contact (ou ton téléphone) sur le lecteur jaune, à l'entrée <b>et</b> à la sortie. Utilise toujours la même carte : le plafond par jour et par semaine s'applique tout seul. L'hôtel est en zone 3.</p></div>
    <div class="panel"><h3>Hôtel</h3><p class="small" style="margin:0">À 2 min à pied d'<b>Acton Main Line</b> (Elizabeth line). Direct pour Paddington (7 min), Bond Street (12 min), Tottenham Court Road (14 min), Liverpool Street (20 min), Whitechapel et Canary Wharf.</p></div>
    <div class="panel"><h3>Aéroport</h3><p class="small" style="margin:0"><b>Aller :</b> Thameslink Gatwick → Farringdon (~50 min), puis Elizabeth line → Acton Main Line (~15 min).<br><b>Retour :</b> Uber ou taxi réservé à 4h15, 45 à 60 min jusqu'à Gatwick.</p></div>
    <div class="panel"><h3>Applis utiles</h3><p class="small" style="margin:0">Citymapper ou Google Maps pour les trajets en direct · TfL Go pour les perturbations · Uber pour le taxi du dernier jour et les bateaux Thames Clippers.</p></div>
    <div class="panel"><h3>À savoir</h3><p class="small" style="margin:0">Prise électrique britannique (type G) : prends un adaptateur. Passeport obligatoire, et autorisation de voyage électronique (ETA) à demander en ligne avant le départ. Le lundi 31 mai 2027 est férié au Royaume-Uni, mais tu seras déjà rentré.</p></div>
    <div class="panel"><h3>Options bonus</h3><ul class="bonus">${BONUS.map(b => `<li><a href="${mapsSearch(b[2])}" target="_blank" rel="noopener">${esc(b[0])}</a> <span class="small">${esc(b[1])}</span></li>`).join("")}</ul></div>
   </div>
  </section>${sidebar()}</main>`;
}

/* ---------- dialogue billet ---------- */
const dlg = $("#tdlg");
let editing = null, pendingFiles = [];
function openTicketDialog(key, title, existing) {
  editing = existing || null; pendingFiles = existing ? existing.files.slice() : [];
  $("#tKey").innerHTML = allStops().map(([k, l]) => `<option value="${esc(k)}"${k === (existing ? existing.key : key) ? " selected" : ""}>${esc(l)}</option>`).join("");
  $("#tTitle").value = existing ? existing.title : (title || "");
  $("#tRef").value = existing ? existing.ref || "" : "";
  $("#tNote").value = existing ? existing.note || "" : "";
  $("#tFile").value = "";
  $("#dlgTitle").textContent = existing ? "Modifier le billet" : "Ajouter un billet";
  const others = existing ? [] : ticketsFor(key);
  $("#tExisting").innerHTML = others.length ? `<div class="small" style="margin-bottom:6px">Déjà enregistrés pour cette étape :</div><div class="tlist">${others.map(ticketCard).join("")}</div>` : "";
  hydrateThumbs($("#tExisting"));
  renderPending();
  $("#tErr").textContent = "";
  if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
}
function renderPending() {
  $("#tFiles").innerHTML = pendingFiles.map((f, i) => `<li>${esc(f.name)} <span class="small">(${Math.max(1, Math.round(f.blob.size / 1024))} Ko)</span> <button type="button" class="link danger" data-rm="${i}">Retirer</button></li>`).join("");
  $("#tFiles").querySelectorAll("[data-rm]").forEach(b => b.onclick = () => { pendingFiles.splice(+b.dataset.rm, 1); renderPending(); });
}
$("#tFile").onchange = e => { [...e.target.files].forEach(f => pendingFiles.push({ name: f.name, type: f.type || "application/octet-stream", blob: f })); e.target.value = ""; renderPending(); };
$("#tCancel").onclick = () => dlg.close();
$("#tForm").onsubmit = async e => {
  e.preventDefault();
  if (!pendingFiles.length && !$("#tRef").value.trim()) { $("#tErr").textContent = "Ajoute au moins un fichier ou un numéro de réservation."; return; }
  const t = { id: editing ? editing.id : "t" + Date.now() + Math.random().toString(36).slice(2, 6), key: $("#tKey").value,
    title: $("#tTitle").value.trim() || labelFor($("#tKey").value).split(" · ").pop(), ref: $("#tRef").value.trim(), note: $("#tNote").value.trim(),
    files: pendingFiles, created: editing ? editing.created : Date.now() };
  try { await DB.put(t); } catch (err) { $("#tErr").textContent = "Impossible d'enregistrer sur cet appareil (navigation privée ou stockage plein)."; return; }
  await loadTickets(); dlg.close(); go(current, true); toast("Billet enregistré");
};

/* ---------- visionneuse ---------- */
const urls = {};
function blobURL(id, j) {
  const k = id + ":" + j; if (urls[k]) return urls[k];
  const t = TICKETS.find(x => x.id === id); if (!t || !t.files[j]) return "";
  return (urls[k] = URL.createObjectURL(t.files[j].blob));
}
function hydrateThumbs(root) { root.querySelectorAll("img[data-blob]").forEach(img => { const [id, j] = img.dataset.blob.split(":"); img.src = blobURL(id, +j); }); }
function openFile(id, j) {
  const t = TICKETS.find(x => x.id === id); if (!t) return; const f = t.files[j]; const u = blobURL(id, j);
  const v = $("#vdlg");
  $("#vTitle").textContent = (t.title || "Billet") + (t.ref ? " · Réf. " + t.ref : "");
  $("#vBody").innerHTML = f.type.startsWith("image/") ? `<img src="${u}" alt="${esc(f.name)}">`
    : f.type === "application/pdf" ? `<object data="${u}" type="application/pdf"><p class="small">Aperçu indisponible ici.</p></object>`
    : `<p class="small">${esc(f.name)}</p>`;
  $("#vOpen").href = u; $("#vOpen").setAttribute("download", f.name);
  v.showModal ? v.showModal() : v.setAttribute("open", "");
  try { navigator.wakeLock && navigator.wakeLock.request("screen").catch(() => {}); } catch (e) {}
}
$("#vClose").onclick = () => $("#vdlg").close();

/* ---------- sauvegarde / restauration ---------- */
const toB64 = blob => new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(blob); });
async function exportTickets() {
  const out = []; for (const t of TICKETS) out.push({ ...t, files: await Promise.all(t.files.map(async f => ({ name: f.name, type: f.type, data: await toB64(f.blob) }))) });
  const blob = new Blob([JSON.stringify({ app: "londres-2027", v: 1, tickets: out })], { type: "application/json" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "billets-londres-2027.json"; document.body.appendChild(a); a.click(); a.remove();
  toast("Sauvegarde téléchargée");
}
async function importTickets(file) {
  try {
    const j = JSON.parse(await file.text()); if (!j.tickets) throw 0;
    for (const t of j.tickets) { t.files = await Promise.all(t.files.map(async f => ({ name: f.name, type: f.type, blob: await (await fetch(f.data)).blob() }))); await DB.put(t); }
    await loadTickets(); go("billets", true); toast(j.tickets.length + " billet(s) restauré(s)");
  } catch (e) { toast("Ce fichier n'est pas une sauvegarde de billets valide"); }
}

function toast(msg) { const t = $("#toast"); t.textContent = msg; t.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => t.hidden = true, 2600); }

/* ---------- navigation ---------- */
let current = "j1";
function go(id, noScroll) {
  const i = DAYS.findIndex(d => d.id === id), v = $("#view");
  if (i >= 0) v.innerHTML = dayView(DAYS[i], i);
  else if (id === "billets") v.innerHTML = billetsView();
  else if (id === "budget") v.innerHTML = budgetView();
  else if (id === "infos") v.innerHTML = infosView();
  else return go("j1", noScroll);
  current = id; renderTabs(id); ls.set("ldn27-tab", id);
  try { history.replaceState(null, "", "#" + id); } catch (e) {}
  hydrateThumbs(v);
  v.querySelectorAll("[data-go]").forEach(b => b.onclick = () => go(b.dataset.go));
  v.querySelectorAll(".chk input").forEach(c => c.onchange = () => {
    done[c.dataset.k] = c.checked; ls.set("ldn27-resa", done);
    const n = RESA.filter(r => done[r[0]]).length, p = c.closest(".panel");
    p.querySelector(".prog i").style.width = (n / RESA.length * 100) + "%"; p.querySelector(".cnt").textContent = `${n} sur ${RESA.length} fait${n > 1 ? "s" : ""}`;
  });
  v.querySelectorAll(".tk").forEach(b => b.onclick = () => openTicketDialog(b.dataset.key, b.dataset.title));
  const ag = $("#addGeneral"); if (ag) ag.onclick = () => openTicketDialog("general", "");
  const ex = $("#exportT"); if (ex) ex.onclick = exportTickets;
  const im = $("#importT"); if (im) im.onchange = e => e.target.files[0] && importTickets(e.target.files[0]);
  if (!noScroll) { const nav = $("nav.days"); if (nav.getBoundingClientRect().top <= 1) window.scrollTo({ top: $("header.top").offsetHeight }); }
}
document.addEventListener("click", async e => {
  const o = e.target.closest("[data-open]"); if (o) return openFile(o.dataset.open, +o.dataset.f);
  const ed = e.target.closest("[data-edit]"); if (ed) { const t = TICKETS.find(x => x.id === ed.dataset.edit); if (dlg.open) dlg.close(); return openTicketDialog(t.key, t.title, t); }
  const dl = e.target.closest("[data-del]");
  if (dl) {
    if (dl.dataset.confirm !== "1") { dl.dataset.confirm = "1"; dl.textContent = "Confirmer ?"; setTimeout(() => { dl.dataset.confirm = ""; dl.textContent = "Supprimer"; }, 3000); return; }
    await DB.del(dl.dataset.del); await loadTickets(); if (dlg.open) dlg.close(); go(current, true); toast("Billet supprimé");
  }
});

(async () => {
  await loadTickets();
  header();
  const h = (location.hash || "").slice(1);
  go(h || todayId() || ls.get("ldn27-tab") || "j1", true);
})();

if ("serviceWorker" in navigator && location.protocol === "https:" && !/claude\.ai|claudeusercontent/.test(location.host)) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
})();
