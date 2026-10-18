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

## Où sont stockés photos et billets ?

**Uniquement dans le navigateur de l'appareil où tu les ajoutes.** Ils ne sont jamais mis sur GitHub, parce qu'un site GitHub Pages est public et que tes QR codes et photos perso ne doivent pas l'être.

Pour les garder en sécurité ou les passer de l'ordinateur au téléphone : onglet **Photos** ou **Billets** → **Télécharger une sauvegarde**, envoie-toi le fichier, puis **Restaurer une sauvegarde** sur l'autre appareil.

Les billets déjà enregistrés avec l'ancienne version du site sont repris automatiquement, et les anciennes sauvegardes (`billets-londres-2027.json`) se restaurent aussi.

⚠️ Ne mets jamais tes billets ou photos dans le dépôt GitHub.

## Modifier un voyage

Chaque voyage a son fichier dans le dossier **`voyages/`** (ex. `voyages/londres.js`) : jours, horaires, adresses, trajets, prix.
Sur GitHub, ouvre le fichier → icône crayon ✏️ → modifie → **Commit changes**. Le site se met à jour en 1 à 2 minutes.

Ne renomme pas une étape où tu as déjà mis des photos ou des billets : ils y sont rattachés par son nom (sinon ils passent dans « Autres photos »).

## Ajouter un voyage

1. Dans le dossier `voyages/`, ouvre `modele.js`, copie son contenu et crée un nouveau fichier, par exemple `voyages/rome.js`.
2. Dans ce nouveau fichier, remplace `modele` par `rome` aux deux endroits indiqués, puis remplis le programme.
3. Ouvre `voyages.js` et ajoute le nom : `self.VOYAGES = ["londres", "rome"];`
4. **Commit changes** : le voyage apparaît sur la page d'accueil.

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | page et styles |
| `app.js` | fonctionnement du site |
| `voyages.js` | liste des voyages |
| `voyages/*.js` | contenu de chaque voyage |
| `sw.js` | mise en cache pour l'usage hors connexion |
| `manifest.webmanifest`, `icon*` | installation sur l'écran d'accueil |

## Londres : à vérifier avant de réserver

- **Mundo Pixar** (Wembley) ferme définitivement le 3 janvier 2027 : retiré du programme et remplacé par la Wallace Collection (gratuite) le jeudi 27.
- **Jellycat chez Selfridges** et **Babylon Park** (entrée gratuite, jeux payants) : vérifier qu'ils sont toujours là.
- **Sky Garden** et **Horizon 22** : billets gratuits mis en ligne le lundi, environ 3 semaines avant. Le dimanche, Horizon 22 ferme à 16h et la terrasse du Sky Garden à 18h.
- **Harry Potter** le samedi 29 mai : week-end férié au Royaume-Uni (lundi 31), réserver dès l'ouverture des ventes.
- **Relève de la garde** : le lundi 24 mai à 10h45. Vérifier le calendrier la veille, elle peut être annulée.
- Prix relevés en 2026.
