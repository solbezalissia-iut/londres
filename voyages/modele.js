/* ============================================================
   MODÈLE DE VOYAGE — copie ce fichier pour créer un nouveau voyage.
   1. Renomme la copie, ex. voyages/rome.js
   2. Remplace "modele" par "rome" sur la ligne (self.TRIPS…).modele
      et dans id: "modele"
   3. Ajoute "rome" dans voyages.js
   Les champs marqués (facultatif) peuvent être supprimés.
   ============================================================ */
(self.TRIPS = self.TRIPS || {}).modele = {
  id: "modele",
  title: "Rome",                       // nom affiché
  country: "Italie",
  color: "#7a1f2b",                    // couleur principale du voyage
  accent: "#e0a526",                   // couleur secondaire
  start: "2028-04-10",                 // AAAA-MM-JJ
  end: "2028-04-14",
  city: "Roma",                        // ajouté aux recherches Google Maps
  currency: "€",
  people: 2,                           // nombre de voyageurs
  summary: "Cinq jours entre ruines antiques et gelato.",
  hotel: { name: "Hôtel", station: "Termini", q: "Roma Termini" },
  facts: [                             // (facultatif) petites infos sous le titre
    ["Hôtel", "Près de Termini"],
    ["Arrivée", "lun. 10 avril, FCO 10h"]
  ],

  days: [
    { id:"j1", date:"2028-04-10", dow:"Lun", label:"10 avril", title:"Arrivée", line:"Ligne A", c:"#e8641b",
      sub:"Installation et première balade.",
      notes:[],                        // [["texte","info|warn|"]]
      stops:[
        {t:"10h00", n:"Aéroport de Fiumicino", addr:"Fiumicino", q:"Aeroporto di Fiumicino", major:1, tk:1,
         d:"Atterrissage.", how:["Suis les panneaux « Treni »."]},
        {t:"15h00", n:"Fontaine de Trevi", addr:"Piazza di Trevi", q:"Fontana di Trevi", tags:[["Gratuit","free"]], mode:"walk",
         d:"Lance une pièce.", how:["15 min à pied depuis l'hôtel."]}
      ],
      back:["Retour à pied, 15 min."] }
  ],

  paid: [],     // (facultatif) déjà payé : [quoi, détail, montant en euros]
  budget: [],   // (facultatif) [activité, prix, remarque, "oui|non|jsp", min, max, jour]
  resa: [],     // (facultatif) [identifiant, nom, détail]
  bonus: [],    // (facultatif) [nom, description, recherche Maps]
  infos: [],    // (facultatif) [titre, texte]
  footer: "Horaires et prix indicatifs."
};
