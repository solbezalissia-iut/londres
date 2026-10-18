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
  /* récap public : seulement les activités et les monuments, sans dates, horaires,
     adresses, trajets, repas ni réservations */
  const SKIP = /déjeuner|dîner|temps libre|soirée|balade libre|uber boat/i;
  function toPublic(t) {
    const seen = [], places = [];
    for (const d of t.days) for (const s of d.stops) {
      if (s.pub === 0 || LOGI.test(s.n) || SKIP.test(s.n)) continue;
      const low = s.n.toLowerCase();
      if (seen.some(x => x.startsWith(low) || low.startsWith(x))) continue;
      seen.push(low);
      const o = { n: s.n, q: s.q, k: d.id + "|" + s.n };
      if (s.major) o.major = 1; if (s.ic) o.ic = s.ic;
      places.push(o);
    }
    return { id: t.id, title: t.title, country: t.country, color: t.color, accent: t.accent, city: t.city, summary: t.pubsummary || t.summary, locked: true, places };
  }
  function publicFile(t) {
    return "/* Récap public de « " + t.title + " » : créé automatiquement par outils/index.html.\n   Les détails (dates, horaires, réservations, trajets) sont dans prive/" + t.id + ".enc.json, chiffrés. */\n" +
      "(self.TRIPS = self.TRIPS || {})[" + JSON.stringify(t.id) + "] = " + JSON.stringify(toPublic(t), null, 1) + ";\n";
  }
  /* clé dérivée une seule fois (synchronisation : beaucoup de petits fichiers) */
  async function deriveKey(code, saltB64, iter) { return keyFrom(code, unb64(saltB64), iter || ITER); }
  function newSalt() { return b64((root.crypto || globalThis.crypto).getRandomValues(new Uint8Array(16))); }
  async function seal(key, bytes) {
    const iv = (root.crypto || globalThis.crypto).getRandomValues(new Uint8Array(12));
    return { iv: b64(iv), data: b64(await subtle().encrypt({ name: "AES-GCM", iv }, key, bytes)) };
  }
  async function open(key, obj) { return new Uint8Array(await subtle().decrypt({ name: "AES-GCM", iv: unb64(obj.iv) }, key, unb64(obj.data))); }
  const sealText = async (key, text) => seal(key, enc.encode(text));
  const openText = async (key, obj) => dec.decode(await open(key, obj));
  root.CarnetBuild = { encrypt, decrypt, evalTrip, toPublic, publicFile, ITER, deriveKey, newSalt, seal, open, sealText, openText, b64, unb64 };
})(typeof self !== "undefined" ? self : globalThis);
