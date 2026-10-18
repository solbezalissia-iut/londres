/* Outils communs : chiffrement du fichier privé et création du récap public.
   Utilisé par outils/index.html (dans le navigateur) et par l'application. */
(function (root) {
  "use strict";
  const ITER = 600000;
  const enc = new TextEncoder(), dec = new TextDecoder();
  const b64 = buf => { let s = ""; const a = new Uint8Array(buf); for (let i = 0; i < a.length; i += 0x8000) s += String.fromCharCode.apply(null, a.subarray(i, i + 0x8000)); return btoa(s); };
  const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const subtle = () => (root.crypto || globalThis.crypto).subtle;
  async function keyFrom(code, salt, iter) {
    const base = await subtle().importKey("raw", enc.encode(String(code)), "PBKDF2", false, ["deriveKey"]);
    return subtle().deriveKey({ name: "PBKDF2", salt, iterations: iter, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  }
  async function encrypt(text, code) {
    const c = root.crypto || globalThis.crypto;
    const salt = c.getRandomValues(new Uint8Array(16)), iv = c.getRandomValues(new Uint8Array(12));
    const key = await keyFrom(code, salt, ITER);
    const data = await subtle().encrypt({ name: "AES-GCM", iv }, key, enc.encode(text));
    return { v: 1, kdf: "PBKDF2-SHA256", iter: ITER, salt: b64(salt), iv: b64(iv), data: b64(data) };
  }
  async function decrypt(obj, code) {
    const key = await keyFrom(code, unb64(obj.salt), obj.iter || ITER);
    const out = await subtle().decrypt({ name: "AES-GCM", iv: unb64(obj.iv) }, key, unb64(obj.data));
    return dec.decode(out);
  }
  /* exécute le texte d'un fichier de voyage et renvoie l'objet voyage */
  function evalTrip(text) {
    const box = { TRIPS: {} };
    new Function("self", text)(box);
    const ids = Object.keys(box.TRIPS);
    if (!ids.length) throw new Error("Aucun voyage trouvé dans ce fichier.");
    return box.TRIPS[ids[0]];
  }
  /* récap public : uniquement les activités, sans horaires, adresses, trajets ni réservations */
  const LOGI = /aéroport|transfert|check-in|hôtel →|→ hôtel|train euston|navette|retour vers londres|arrivée à gatwick|décollage|bagages/i;
  const PRIVATE_WORDS = /hôtel|acton|\d{1,2}h\d{0,2}|réserv|billet|créneau|qr code|£|jsp|vérifie/i;
  const clean = d => (d || "").split(/(?<=[.!?])\s+/).filter(x => x && !PRIVATE_WORDS.test(x)).join(" ");
  function toPublic(t) {
    return {
      id: t.id, title: t.title, country: t.country, color: t.color, accent: t.accent,
      start: t.start, end: t.end, city: t.city, summary: t.summary, locked: true,
      days: t.days.map(d => ({
        id: d.id, date: d.date, dow: d.dow, label: d.label, title: d.title, c: d.c, light: d.light,
        sub: d.pubsub || clean(d.sub),
        stops: d.stops.filter(s => s.pub !== 0 && !LOGI.test(s.n)).map(s => {
          const o = { n: s.n, q: s.q };
          const dd = clean(s.d); if (dd) o.d = dd;
          if (s.major) o.major = 1; if (s.ic) o.ic = s.ic;
          return o;
        })
      }))
    };
  }
  function publicFile(t) {
    return "/* Récap public de « " + t.title + " » : créé automatiquement par outils/index.html.\n   Les détails (horaires, réservations, trajets) sont dans prive/" + t.id + ".enc.json, chiffrés. */\n" +
      "(self.TRIPS = self.TRIPS || {})[" + JSON.stringify(t.id) + "] = " + JSON.stringify(toPublic(t), null, 1) + ";\n";
  }
  root.CarnetBuild = { encrypt, decrypt, evalTrip, toPublic, publicFile, ITER };
})(typeof self !== "undefined" ? self : globalThis);
