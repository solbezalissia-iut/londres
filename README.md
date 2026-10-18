# Mes voyages

Site de carnets de voyage : une page d'accueil avec tous tes voyages, puis pour chacun le programme jour par jour (horaires, trajets, réservations), les photos de chaque endroit, les billets, le budget et les infos pratiques.

- Fonctionne sur ordinateur et téléphone.
- **Hors connexion** : après une première visite avec du réseau, tout le site s'ouvre sans connexion (métro, avion, à l'étranger sans forfait). Seuls les liens Google Maps demandent du réseau.
- Adresse : https://solbezalissia-iut.github.io/londres/

## Sur ton téléphone

Ouvre l'adresse dans Safari (iPhone) ou Chrome (Android), puis **Partager → Sur l'écran d'accueil**. Le site s'ouvre alors comme une appli, avec la barre d'onglets en bas : Programme, Photos, Billets, Budget, Infos.

## Photos

- Sur chaque étape du programme : bouton **« Ajouter des photos »**. Sur téléphone, tu peux prendre la photo directement ou la choisir dans ta galerie.
- Touche une photo pour l'agrandir, glisse pour passer à la suivante, ajoute une légende, partage-la, télécharge-la ou supprime-la.
- L'onglet **Photos** les range par jour et par endroit.
- Les photos sont réduites automatiquement (1800 px) pour prendre peu de place.

## Billets

- Sur chaque étape payante ou réservée : bouton **« Ajouter un billet »**, ou onglet **Billets**.
- PDF, photos ou captures d'écran, avec le numéro de réservation.

## Convertisseur

En accès privé, dans Budget, Comptes, Infos et sur le côté du programme : tape un montant en euros ou en livres, l'autre se calcule. Le taux du jour est récupéré dès qu'il y a du réseau (sinon le dernier connu), et les prix des activités affichent aussi leur équivalent en euros.

## Comptes (comme Tricount)

Onglet **Comptes** : entre les prénoms des voyageurs, puis ajoute chaque dépense (quoi, combien, en € ou en £, qui a payé, pour qui). Chaque dépense est partagée en parts égales entre les personnes cochées, et le site calcule les soldes et qui doit combien à qui. « Marquer comme remboursé » enregistre le remboursement.

Les réservations (vols, hôtel, transferts) sont proposées en haut : choisis qui les a payées, ou **« Pas encore payé »**. Une dépense pas encore payée compte dans le total mais pas dans les remboursements ; quand quelqu'un la paie, modifie-la et choisis qui a payé.

Deux façons de rembourser :
- **Par dépense** : sous chaque dépense, « Léa doit X € à Alissia » avec **Marquer remboursé** (et un second appui pour annuler).
- **Au total** : « Pour être quittes » calcule le minimum de virements pour tout solder, avec **Marquer comme remboursé**.

Le taux livre → euro est modifiable.

Les comptes sont enregistrés sur l'appareil où tu les saisis (comme les photos) et inclus dans la sauvegarde : tiens-les sur un seul téléphone, ou passe la sauvegarde à l'autre.

## Où sont stockés photos et billets ?

**Uniquement dans le navigateur de l'appareil où tu les ajoutes.** Ils ne sont jamais mis sur GitHub, parce qu'un site GitHub Pages est public et que tes QR codes et photos perso ne doivent pas l'être.

Pour les garder en sécurité ou les passer de l'ordinateur au téléphone : onglet **Photos** ou **Billets** → **Télécharger une sauvegarde**, envoie-toi le fichier, puis **Restaurer une sauvegarde** sur l'autre appareil.

Les billets déjà enregistrés avec l'ancienne version du site sont repris automatiquement, et les anciennes sauvegardes (`billets-londres-2027.json`) se restaurent aussi.

⚠️ Ne mets jamais tes billets ou photos dans le dépôt GitHub.

## Récap public et accès privé

- **Sans code**, tout le monde voit un récap tout simple : les activités et les monuments de chaque voyage, rangés par thème, et les photos que tu as choisi de publier. Aucune date, aucun horaire, ni hôtel, vols, trajets, prix ou réservations.
- **Avec le code** (bouton « Accès privé »), tu retrouves tout : programme détaillé, billets, budget, comptes, convertisseur, infos. Coche « Rester déverrouillé sur cet appareil » pour ne pas le retaper (bouton cadenas pour verrouiller).
- Les détails sont dans `prive/<voyage>.enc.json`, **chiffrés avec le code** (AES-256, clé dérivée par PBKDF2). Le code n'est écrit nulle part dans le dépôt.

### Publier des photos dans le récap

Accès privé → ouvre une photo → **Récap public**. Puis onglet Photos → **Préparer l'envoi sur GitHub** : décompresse le zip et dépose le dossier `photos` sur GitHub (« Add file » → « Upload files »). Les photos publiées sont visibles par tout le monde.

## Modifier un voyage

Le programme étant chiffré, on ne le modifie plus directement sur GitHub. Utilise la page **Modifier un voyage** (`/outils/` sur ton site, lien depuis l'accueil en accès privé) :

1. **Télécharger le fichier modifiable** avec le code : tu obtiens `londres.prive.js`.
2. Modifie-le avec un éditeur de texte (jours, horaires, adresses, trajets, prix).
3. **Créer le fichier à envoyer** : choisis ton fichier, entre le code, tu obtiens un zip.
4. Décompresse-le et dépose les dossiers `voyages` et `prive` sur GitHub (« Add file » → « Upload files » → « Commit changes »).

Ne mets jamais le fichier `.prive.js` lui-même sur GitHub.

## Ajouter un voyage

Page **Modifier un voyage** → « Partir du modèle », remplis le fichier, crée le zip comme ci-dessus et dépose-le, puis ajoute le nom du voyage dans `voyages.js`.

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | page et styles |
| `app.js` | fonctionnement du site |
| `voyages.js` | liste des voyages |
| `voyages/*.js` | récap public de chaque voyage (créé par l'outil) |
| `prive/*.enc.json` | détails de chaque voyage, chiffrés avec le code |
| `photos/<voyage>/` | photos du récap public |
| `outils/` | page pour modifier un voyage, chiffrement |
| `lib/`, `fonts/`, `icons.js` | bibliothèque zip, police et icônes (pour marcher hors ligne) |
| `sw.js` | mise en cache pour l'usage hors connexion |
| `manifest.webmanifest`, `icon*` | installation sur l'écran d'accueil |

## Londres : à vérifier avant de réserver

- **Transfert retour** : le chauffeur arrive à 5h00 devant l'hôtel et n'attend que 15 min.
- **Vol retour 7h35** : arrivée à Gatwick vers 6h08, faire l'enregistrement British Airways en ligne la veille.
- **Mundo Pixar** (Wembley) ferme définitivement le 3 janvier 2027 : retiré du programme et remplacé par la Wallace Collection (gratuite) le jeudi 27.
- **Jellycat chez Selfridges** et **Babylon Park** (entrée gratuite, jeux payants) : vérifier qu'ils sont toujours là.
- **Sky Garden** et **Horizon 22** : billets gratuits mis en ligne le lundi, environ 3 semaines avant. Le dimanche, Horizon 22 ferme à 16h et la terrasse du Sky Garden à 18h.
- **Harry Potter** le samedi 29 mai : week-end férié au Royaume-Uni (lundi 31), réserver dès l'ouverture des ventes.
- **Relève de la garde** : le lundi 24 mai à 10h45. Vérifier le calendrier la veille, elle peut être annulée.
- Prix relevés en 2026.
