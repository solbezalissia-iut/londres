/* ============================================================
   Programme du voyage — modifie ce fichier pour changer le site.
   Chaque étape :
     t     heure          n    nom            addr  adresse
     d     description    q    recherche Google Maps
     how   comment y aller depuis l'étape précédente (liste d'étapes)
     mode  "walk" si le trajet se fait à pied (sinon transports)
     tags  [["texte","free|price|book|out|warn"]]
     major étape principale   adj  ajustement expliqué   warn  alerte
     tk    true = on peut y ranger des billets
   ============================================================ */
window.TRIP = {
  title: "Londres",
  start: "2027-05-21",
  end: "2027-05-30",
  hotel: { name: "Hôtel à Acton", station: "Acton Main Line", q: "Acton Main Line Station" },
  flights: { arr: "Ven 21 mai · atterrissage LGW 16h10", dep: "Dim 30 mai · décollage LGW 7h35" }
};

window.DAYS = [
{ id:"j1", date:"2027-05-21", dow:"Ven", label:"21 mai", title:"Arrivée", line:"Elizabeth line", c:"#6950a1",
  sub:"Atterrissage à Gatwick, installation à l'hôtel et petite balade au calme.",
  notes:[["Paie tous tes trajets avec la même carte bancaire sans contact (ou ton téléphone), dès la gare de Gatwick. Pas besoin d'acheter d'Oyster.","info"]],
  stops:[
   {t:"16h10",n:"Aéroport de Gatwick (LGW)",addr:"Gatwick Airport, Horley RH6 0NP",q:"Gatwick Airport",major:1,tk:1,
    d:"Atterrissage, récupération des bagages.",
    how:["Si tu arrives au North Terminal : prends la navette gratuite (Inter-terminal shuttle, 2 min) jusqu'au South Terminal, où se trouve la gare.","Suis les panneaux « Trains »."]},
   {t:"17h00",n:"Train Thameslink → Farringdon",addr:"Gatwick Airport station (South Terminal)",q:"Farringdon Station",tk:1,
    d:"Environ 45 à 55 min, sans changement.",tags:[["~£12 – £20 sans contact","price"]],
    how:["Valide ta carte sans contact au portique.","Prends un train Thameslink direction Bedford, Cambridge ou Peterborough (vérifie que Farringdon est affiché).","Descends à Farringdon.","Plus rapide mais plus cher : le Gatwick Express jusqu'à Victoria, puis Circle/District → Paddington et Elizabeth line."]},
   {t:"18h00",n:"Elizabeth line → Acton Main Line",addr:"Acton Main Line, Horn Lane, Acton W3",q:"Acton Main Line Station",
    d:"Environ 15 min, sans changement.",
    how:["À Farringdon, suis les panneaux violets « Elizabeth line ».","Quai direction ouest : Reading, Maidenhead ou Heathrow. Vérifie que « Acton Main Line » est affiché sur l'écran du quai.","Arrêts : Tottenham Court Road, Bond Street, Paddington, Acton Main Line.","L'hôtel est à 2 min à pied."]},
   {t:"18h30",n:"Check-in à l'hôtel",addr:"À 2 min d'Acton Main Line",q:"Acton Main Line Station",major:1,tk:1,mode:"walk",
    d:"Dépose les bagages, souffle un peu.",how:["2 min à pied depuis la gare."]},
   {t:"19h30",n:"Little Venice au coucher du soleil",addr:"Blomfield Road, Little Venice W9",q:"Little Venice London",tags:[["Gratuit","free"]],
    d:"Péniches colorées et canal. Ou simplement un dîner tranquille à Acton.",
    adj:"Ton fichier proposait la Central line via Notting Hill Gate. Par Paddington c'est plus simple et direct depuis l'hôtel.",
    how:["Elizabeth line direction est (Abbey Wood ou Shenfield) d'Acton Main Line à Paddington : 1 arrêt, ~7 min.","À Paddington, sors côté « Paddington Basin » / canal.","Longe le canal vers l'ouest : 10 min à pied jusqu'au bassin de Little Venice."]}
  ],
  back:["Little Venice → Paddington à pied (10 min).","Elizabeth line direction ouest (Reading / Heathrow) → Acton Main Line, 1 arrêt."]
},

{ id:"j2", date:"2027-05-22", dow:"Sam", label:"22 mai", title:"Notting Hill, Portobello & Kensington", line:"Circle line", c:"#ffd329", light:1,
  sub:"Le samedi, c'est le grand jour du marché de Portobello : antiquaires, fripes, street food.",
  notes:[["Le marché de Portobello est le plus complet le samedi. Arrive avant midi, ça se remplit vite.","info"]],
  stops:[
   {t:"09h00",n:"Statue de l'ours Paddington",addr:"Paddington Station, Praed Street W2 1HU (quai 1, sous l'horloge)",q:"Paddington Bear Statue Paddington Station",tags:[["Gratuit","free"]],
    d:"La statue en bronze de Paddington, plus la boutique Paddington juste à côté.",
    how:["Elizabeth line direction est (Abbey Wood / Shenfield) d'Acton Main Line à Paddington : 1 arrêt, ~7 min.","Monte dans la grande gare : la statue est sur le quai 1, sous l'horloge."]},
   {t:"09h45",n:"Little Venice",addr:"Blomfield Road, Little Venice W9",q:"Little Venice London",tags:[["Gratuit","free"]],mode:"walk",
    d:"Balade le long du canal. Option : bateau touristique vers Camden si tu préfères le faire aujourd'hui.",
    how:["Sors de la gare côté Paddington Basin.","Suis le canal vers l'ouest : 10 min à pied."]},
   {t:"11h00",n:"Notting Hill & Portobello Road Market",addr:"Portobello Road W11",q:"Portobello Road Market",tags:[["Gratuit","free"]],major:1,
    d:"Façades colorées, antiquaires au sud, fripes et food au nord.",
    how:["Reviens à pied à Paddington (10 min).","Circle line ou District line direction ouest (vers High Street Kensington / Wimbledon) : 2 arrêts jusqu'à Notting Hill Gate, ~5 min.","Sortie nord, puis Pembridge Road → Portobello Road : 5 min à pied. Remonte la rue vers le nord."]},
   {t:"13h00",n:"Déjeuner sur le marché",addr:"Portobello Road W11",q:"Portobello Road food market",mode:"walk",
    d:"Street food sur le marché ou café du quartier.",how:["Sur place."]},
   {t:"14h30",n:"Kensington Gardens puis Hyde Park",addr:"Kensington Palace, W8 4PX",q:"Kensington Palace",tags:[["Gratuit","free"]],mode:"walk",
    d:"Kensington Palace, le Round Pond, puis la Serpentine côté Hyde Park.",
    how:["Redescends Portobello Road jusqu'à Notting Hill Gate.","Traverse Notting Hill Gate et prends Kensington Church Street ou Palace Gardens Terrace vers le sud : 10-15 min à pied jusqu'à l'entrée du parc."]},
   {t:"16h00",n:"Natural History Museum",addr:"Cromwell Road, SW7 5BD",q:"Natural History Museum London",tags:[["Gratuit","free"],["Ferme 17h50","out"]],major:1,mode:"walk",
    d:"Le grand hall Hintze avec la baleine bleue, la galerie des dinosaures.",
    how:["Depuis la Serpentine, rejoins l'Albert Memorial puis descends Exhibition Road : 15-20 min à pied.","Entrée gratuite : réserver un créneau gratuit en ligne permet d'éviter la file."]},
   {t:"17h30",n:"Science Museum",addr:"Exhibition Road, SW7 2DD",q:"Science Museum London",tags:[["Gratuit","free"]],mode:"walk",
    d:"Si le temps le permet, il ferme à 18h.",how:["Juste à côté, 2 min à pied sur Exhibition Road."]},
   {t:"18h30",n:"Harrods",addr:"87-135 Brompton Road, SW1X 7XL",q:"Harrods",mode:"walk",
    d:"Le Food Hall et l'étage des jouets. Ferme vers 21h.",
    how:["Prends Cromwell Road puis Brompton Road vers l'est : 12 min à pied.","Ou Piccadilly line South Kensington → Knightsbridge, 1 arrêt."]}
  ],
  back:["Marche 10 min jusqu'à South Kensington (ou prends la Piccadilly line à Knightsbridge, 1 arrêt).","Circle line direction Edgware Road (via High Street Kensington) → Paddington, ~12 min.","Elizabeth line direction ouest → Acton Main Line, 1 arrêt."]
},

{ id:"j3", date:"2027-05-23", dow:"Dim", label:"23 mai", title:"East London & la City", line:"Windrush line", c:"#ee7c0e",
  sub:"Marché aux fleurs le matin, les rooftops gratuits de la City, la Tour, Borough Market et la Tate.",
  notes:[["Columbia Road : uniquement le dimanche, de 8h à 14h.","info"],["À réserver : Horizon 22 (gratuit, ferme à 16h le dimanche) et Sky Garden (gratuit, ouvert jusqu'à 21h le week-end). Les créneaux sortent le lundi, environ 3 semaines avant.","warn"],["Ordre réorganisé pour coller aux horaires du dimanche (Horizon 22 ferme tôt, St Paul's ne se visite pas le dimanche).",""]],
  stops:[
   {t:"08h00",n:"Columbia Road Flower Market",addr:"Columbia Road, E2 7RG",q:"Columbia Road Flower Market",tags:[["Gratuit","free"]],major:1,
    d:"Le marché aux fleurs, les petites boutiques et cafés de la rue.",
    how:["Pars de l'hôtel vers 7h15.","Elizabeth line direction est (Abbey Wood / Shenfield) d'Acton Main Line à Whitechapel : ~25 min.","À Whitechapel, prends le London Overground, Windrush line (orange), direction Highbury & Islington : 2 arrêts jusqu'à Hoxton.","Depuis la gare, 10 min à pied vers l'est jusqu'à Columbia Road (suis Google Maps)."]},
   {t:"10h00",n:"Horizon 22",addr:"22 Bishopsgate, EC2N 4AJ",q:"Horizon 22 Bishopsgate",tags:[["Gratuit","free"],["À réserver","book"]],major:1,tk:1,
    d:"La plus haute terrasse panoramique gratuite d'Europe, au 58e étage. Compter 45 min.",
    how:["Columbia Road → Shoreditch High Street, 10 min à pied.","Descends tout droit vers le sud par Shoreditch High Street puis Bishopsgate : 20-25 min à pied. Ou un bus direction Liverpool Street / Bank (le lien Maps te donne le numéro).","Prends ton QR code et une pièce d'identité."]},
   {t:"11h00",n:"The Garden at 120",addr:"120 Fenchurch Street, EC3M 5BA",q:"The Garden at 120 Fenchurch Street",tags:[["Gratuit","free"],["Accès libre","out"]],mode:"walk",
    d:"Jardin sur le toit, sans réservation. Vérifie l'ouverture du dimanche avant.",
    how:["Bishopsgate → Fenchurch Street vers le sud : 7 min à pied."]},
   {t:"11h30",n:"St Dunstan in the East",addr:"St Dunstan's Hill, EC3R 5DD",q:"St Dunstan in the East",tags:[["Gratuit","free"]],mode:"walk",
    d:"Église en ruine envahie par un jardin.",how:["Descends vers la Tamise par Mincing Lane puis St Dunstan's Hill : 6 min à pied."]},
   {t:"12h00",n:"Tour de Londres",addr:"Tower Hill, EC3N 4AB",q:"Tower of London",tags:[["Extérieur","out"]],mode:"walk",
    d:"Vue sur la forteresse et les remparts depuis l'extérieur et le quai.",
    adj:"Dans ton tableau tu as mis « Non » pour entrer (~£37), donc visite de l'extérieur.",
    how:["Longe Lower Thames Street vers l'est : 7 min à pied."]},
   {t:"12h30",n:"Tower Bridge",addr:"Tower Bridge Road, SE1 2UP",q:"Tower Bridge",tags:[["Gratuit","free"]],major:1,mode:"walk",
    d:"Traversée à pied du pont, vue sur la Tamise et la City.",
    adj:"Exposition (~£12 – £13,50) notée « Non » : on traverse simplement le pont.",
    how:["Depuis les douves de la Tour, monte l'escalier vers Tower Bridge : 5 min.","Traverse vers la rive sud."]},
   {t:"13h00",n:"Borough Market",addr:"8 Southwark Street, SE1 1TL",q:"Borough Market",tags:[["Gratuit","free"]],mode:"walk",
    d:"Déjeuner. Le dimanche, le marché ouvre de 10h à 16h, certains stands sont fermés.",
    how:["Sur la rive sud, prends le Thames Path vers l'ouest (Hay's Galleria, London Bridge) : 15-20 min à pied."]},
   {t:"14h30",n:"Tate Modern",addr:"Bankside, SE1 9TG",q:"Tate Modern",tags:[["Gratuit","free"]],mode:"walk",
    d:"La Turbine Hall et la vue depuis le 10e étage du Blavatnik Building.",
    how:["Continue le long de la Tamise vers l'ouest (Clink Street, Bankside) : 12 min à pied."]},
   {t:"15h45",n:"Millennium Bridge & St Paul's Cathedral",addr:"St Paul's Churchyard, EC4M 8AD",q:"St Paul's Cathedral",tags:[["Extérieur","out"]],mode:"walk",
    d:"Le dimanche, la cathédrale est ouverte seulement pour les offices : on admire l'extérieur.",
    adj:"St Paul's était « JSP ». Un dimanche on ne peut pas le visiter, donc vue extérieure seulement.",
    how:["Traverse le Millennium Bridge juste devant la Tate : 5 min jusqu'à St Paul's."]},
   {t:"17h00",n:"Sky Garden",addr:"20 Fenchurch Street, EC3M 8AF",q:"Sky Garden London",tags:[["Gratuit","free"],["À réserver","book"]],major:1,tk:1,
    d:"Jardin intérieur au 35e étage avec terrasse. Ouvert jusqu'à 21h le week-end.",
    how:["Central line St Paul's → Bank, 1 arrêt, puis 8 min à pied par Lombard Street et Fenchurch Street.","Ou 20 min à pied par Cheapside et Cornhill.","Pièce d'identité avec photo et QR code demandés à l'entrée."]},
   {t:"18h30",n:"Leadenhall Market",addr:"Gracechurch Street, EC3V 1LT",q:"Leadenhall Market",tags:[["Gratuit","free"]],mode:"walk",
    d:"Le marché couvert victorien, décor du Chaudron Baveur dans Harry Potter. Boutiques fermées le dimanche, mais l'architecture est là.",
    how:["Remonte Gracechurch Street : 5 min à pied."]}
  ],
  back:["Leadenhall → Liverpool Street, 8 min à pied.","Elizabeth line direction ouest (Reading / Heathrow) → Acton Main Line, ~20 min, sans changement."]
},

{ id:"j4", date:"2027-05-24", dow:"Lun", label:"24 mai", title:"Westminster & St James's", line:"District line", c:"#00782a",
  sub:"La relève de la garde, Big Ben, le London Eye, et Westminster illuminé le soir.",
  notes:[["Relève de la garde : lundi, mercredi et vendredi, début à 10h45. Elle peut être annulée au dernier moment (pluie) : vérifie le calendrier de la Household Division la veille.","info"]],
  stops:[
   {t:"10h00",n:"Relève de la garde, Buckingham Palace",addr:"Buckingham Palace, SW1A 1AA",q:"Buckingham Palace",tags:[["Gratuit","free"]],major:1,
    d:"Place-toi contre les grilles du palais ou sur les marches du Victoria Memorial. Cérémonie à 10h45, environ 45 min.",
    how:["Pars vers 9h20.","Elizabeth line direction est d'Acton Main Line à Bond Street : ~12 min.","Jubilee line direction Stratford : 1 arrêt jusqu'à Green Park.","Sortie « Green Park », traverse le parc vers le sud-ouest : 10 min à pied jusqu'au palais."]},
   {t:"11h30",n:"Promenade dans St James's Park",addr:"St James's Park, SW1A 2BJ",q:"St James's Park London",tags:[["Gratuit","free"]],mode:"walk",
    d:"Les pélicans, le lac et la vue sur le palais depuis le Blue Bridge.",how:["Juste devant le palais, de l'autre côté du Mall."]},
   {t:"12h30",n:"Peggy Porschen Cakes",addr:"116 Ebury Street, SW1W 9QQ",q:"Peggy Porschen Belgravia",mode:"walk",
    d:"Pause gâteau dans le salon rose de Belgravia.",
    how:["Buckingham Palace Road vers le sud-ouest puis Ebury Street : 15-20 min à pied."]},
   {t:"14h00",n:"Big Ben & Palais de Westminster",addr:"Parliament Square, SW1A 0AA",q:"Big Ben",tags:[["Gratuit","free"],["Extérieur","out"]],major:1,
    d:"Extérieur et photos depuis Parliament Square.",
    how:["Ebury Street → gare de Victoria, 8 min à pied.","District ou Circle line direction est (Upminster / Tower Hill) : 2 arrêts jusqu'à Westminster.","Sortie « Houses of Parliament » : Big Ben est en face."]},
   {t:"14h30",n:"Westminster Bridge",addr:"Westminster Bridge, SE1 7PB",q:"Westminster Bridge",tags:[["Gratuit","free"]],mode:"walk",
    d:"La meilleure vue sur Big Ben en traversant.",how:["Au pied de Big Ben, traverse le pont vers la rive sud."]},
   {t:"15h00",n:"London Eye",addr:"Riverside Building, County Hall, SE1 7PB",q:"London Eye",tags:[["~£29 – £33","price"],["Fast track ~£44+","out"],["À réserver","book"]],major:1,tk:1,mode:"walk",
    d:"Un tour dure environ 30 min. Présente-toi un peu avant ton créneau.",
    how:["Au bout du pont, tourne à gauche le long de la Tamise : 3 min à pied."]},
   {t:"16h00",n:"Leake Street Arches",addr:"Leake Street, SE1 7NN",q:"Leake Street Arches",tags:[["Gratuit","free"]],mode:"walk",
    d:"Tunnel de street art sous la gare de Waterloo.",
    how:["Passe derrière County Hall, direction gare de Waterloo (York Road) : 7 min à pied."]},
   {t:"17h00",n:"Temps libre / shopping",addr:"Southbank / Waterloo",q:"Southbank Centre",mode:"walk",
    d:"Option : Sea Life London à County Hall, juste à côté du London Eye (~£23 – £28, tu avais mis « JSP »).",how:["Retour vers la Tamise, 5 min."]},
   {t:"21h30",n:"Westminster de nuit",addr:"Westminster Bridge",q:"Westminster Bridge",tags:[["Gratuit","free"]],major:1,mode:"walk",
    d:"Big Ben et le Parlement illuminés, depuis le pont ou la Southbank (coucher du soleil vers 21h).",how:["Le long de la Southbank jusqu'au pont."]}
  ],
  back:["Westminster → Jubilee line direction Stanmore : 2 arrêts jusqu'à Bond Street.","Elizabeth line direction ouest → Acton Main Line, ~12 min."]
},

{ id:"j5", date:"2027-05-25", dow:"Mar", label:"25 mai", title:"Covent Garden, Soho & Piccadilly", line:"Piccadilly line", c:"#003688",
  sub:"Musées gratuits le matin, puis tout se fait à pied : Covent Garden, Chinatown, Leicester Square, Soho.",
  notes:[],
  stops:[
   {t:"09h45",n:"British Museum",addr:"Great Russell Street, WC1B 3DG",q:"British Museum",tags:[["Gratuit","free"]],major:1,
    d:"Ouvre à 10h. Pierre de Rosette, momies égyptiennes, frises du Parthénon.",
    how:["Elizabeth line direction est d'Acton Main Line à Tottenham Court Road : ~14 min.","Sortie « Oxford Street (east) / Centre Point ».","Prends New Oxford Street puis Bloomsbury Street : 7 min à pied jusqu'à l'entrée de Great Russell Street."]},
   {t:"11h45",n:"Neal's Yard & Covent Garden",addr:"Neal's Yard, WC2H 9DP · Covent Garden Piazza, WC2E 8RF",q:"Neal's Yard London",tags:[["Gratuit","free"]],mode:"walk",
    d:"La petite cour colorée, Seven Dials, puis la Piazza et ses artistes de rue.",
    how:["Descends Museum Street, traverse Shaftesbury Avenue puis Monmouth Street : 10 min jusqu'à Neal's Yard.","Covent Garden Piazza est à 5 min au sud par Neal Street."]},
   {t:"12h45",n:"Déjeuner à Covent Garden",addr:"Covent Garden",q:"Covent Garden Market",mode:"walk",
    d:"Le marché couvert ou les rues autour.",
    warn:"Barbie Dreamhouse : c'était une animation temporaire à Covent Garden en 2024. Elle ne sera sûrement plus là en 2027. Le Jellycat de Londres est chez Selfridges (journée de jeudi).",
    how:["Sur place."]},
   {t:"14h00",n:"National Gallery",addr:"Trafalgar Square, WC2N 5DN",q:"National Gallery London",tags:[["Gratuit","free"]],major:1,mode:"walk",
    d:"Les Tournesols de Van Gogh, les Nymphéas de Monet.",
    how:["Prends King Street puis New Row et St Martin's Lane vers le sud : 10 min à pied jusqu'à Trafalgar Square."]},
   {t:"15h30",n:"Chinatown",addr:"Gerrard Street, W1D",q:"Chinatown London",tags:[["Gratuit","free"]],mode:"walk",
    d:"Les lanternes de Gerrard Street, une pâtisserie au passage.",
    how:["Charing Cross Road vers le nord puis Lisle Street : 7 min à pied."]},
   {t:"16h00",n:"Leicester Square : M&M's World & LEGO Store",addr:"Swiss Court, Leicester Square, W1D 6AP",q:"M&M's World London",tags:[["Gratuit","free"]],mode:"walk",
    d:"Les deux grandes boutiques sont côte à côte.",how:["Juste au sud de Chinatown, 2 min."]},
   {t:"17h00",n:"Piccadilly Circus",addr:"Piccadilly Circus, W1J",q:"Piccadilly Circus",tags:[["Gratuit","free"]],mode:"walk",
    d:"Les écrans géants et la fontaine d'Éros.",how:["Coventry Street vers l'ouest : 4 min à pied."]},
   {t:"17h30",n:"Soho, balade libre",addr:"Carnaby Street, W1F",q:"Carnaby Street",mode:"walk",
    d:"Carnaby Street, Kingly Court, Berwick Street.",how:["Remonte Regent Street, Carnaby est sur la droite : 7 min."]},
   {t:"19h00",n:"Dîner à Soho",addr:"Soho",q:"Soho London",mode:"walk",d:"",how:["Sur place."]}
  ],
  back:["Soho → Tottenham Court Road, 8 min à pied.","Elizabeth line direction ouest → Acton Main Line, ~14 min."]
},

{ id:"j6", date:"2027-05-26", dow:"Mer", label:"26 mai", title:"Camden & Regent's Park", line:"Northern line", c:"#14182b",
  sub:"Le marché de Camden, le parc, et le coucher de soleil sur Primrose Hill.",
  notes:[],
  stops:[
   {t:"10h00",n:"Camden Market & Camden Town",addr:"Camden Lock Place, NW1 8AF",q:"Camden Market",tags:[["Gratuit","free"]],major:1,
    d:"Les stands, les boutiques alternatives, l'écluse de Camden Lock.",
    how:["Elizabeth line direction est d'Acton Main Line à Tottenham Court Road : ~14 min.","Northern line direction nord (Edgware ou High Barnet, branche Charing Cross) : 5 arrêts jusqu'à Camden Town, ~8 min.","Remonte Camden High Street puis Chalk Farm Road : 5 min jusqu'au marché."]},
   {t:"11h30",n:"Babylon Park",addr:"Hawley Wharf, Camden Market, NW1",q:"Babylon Park Camden",tags:[["dès ~£8,75","price"],["À décider","out"]],tk:1,mode:"walk",
    d:"Parc d'attractions couvert sur 3 étages : mini-golf, auto-tamponneuses, arcade.",
    adj:"Déplacé ici depuis la journée immersive : c'est dans Camden Market. Bracelet illimité ~£25.",
    how:["Dans Hawley Wharf, côté canal du marché : 3 min à pied."]},
   {t:"13h00",n:"Déjeuner au marché",addr:"Camden Market",q:"Camden Market food",mode:"walk",d:"La street food de Camden Market.",how:["Sur place."]},
   {t:"14h30",n:"Regent's Park",addr:"Queen Mary's Gardens, Inner Circle, NW1",q:"Queen Mary's Gardens Regent's Park",tags:[["Gratuit","free"]],major:1,mode:"walk",
    d:"Queen Mary's Gardens et la roseraie, en pleine floraison fin mai.",
    how:["Depuis Camden Lock, prends le chemin le long du Regent's Canal vers l'ouest (Regent's Canal towpath) : 20 min.","Sors au niveau de Gloucester Gate ou du zoo et traverse le parc vers le sud : 15 min jusqu'à l'Inner Circle."]},
   {t:"16h00",n:"Marylebone",addr:"Marylebone High Street, W1U",q:"Marylebone High Street",mode:"walk",
    d:"Rue de boutiques et cafés, avec la librairie Daunt Books.",
    warn:"La boutique Totoro (Studio Ghibli) de Londres était temporaire et a fermé en janvier 2026. Remplacée ici par une balade à Marylebone, juste au sud du parc.",
    how:["Sors du parc par York Gate, au sud : 10 min à pied jusqu'à Marylebone High Street."]},
   {t:"17h30",n:"Temps libre / café",addr:"Marylebone",q:"Marylebone London",mode:"walk",d:"",how:["Sur place."]},
   {t:"20h30",n:"Primrose Hill",addr:"Primrose Hill, NW1",q:"Primrose Hill",tags:[["Gratuit","free"]],major:1,
    d:"Coucher de soleil vers 21h, vue sur toute la skyline.",
    how:["Bus 274 depuis Baker Street direction Angel, ~15 min (vérifie l'arrêt dans le lien Maps).","Ou 25 min à pied à travers Regent's Park vers le nord."]}
  ],
  back:["Primrose Hill → Chalk Farm, 10 min à pied.","Northern line direction sud via Charing Cross : 6 arrêts jusqu'à Tottenham Court Road.","Elizabeth line direction ouest → Acton Main Line, ~14 min."]
},

{ id:"j7", date:"2027-05-27", dow:"Jeu", label:"27 mai", title:"Oxford Street & expériences", line:"Central line", c:"#e1251b",
  sub:"Outernet, les grands magasins d'Oxford Street, puis l'expo Pixar à Wembley si elle est encore ouverte.",
  notes:[["Twist Museum, Paradox Museum et Serial Killer sont notés « Non » dans ton tableau. Babylon Park passe mercredi (à Camden).","info"],["Mundo Pixar a été prolongé « jusqu'en janvier 2027 ». Il sera probablement fermé en mai 2027 : vérifie avant de réserver. Sinon, l'après-midi est libre.","warn"]],
  stops:[
   {t:"10h00",n:"Outernet London",addr:"Denmark Street, WC2H",q:"Outernet London",tags:[["Gratuit","free"]],major:1,
    d:"Les écrans géants immersifs à 360°.",
    how:["Elizabeth line direction est d'Acton Main Line à Tottenham Court Road : ~14 min.","Sortie « Dean Street » ou « Centre Point » : Outernet est juste en face."]},
   {t:"11h00",n:"Hamleys",addr:"188-196 Regent Street, W1B 5BT",q:"Hamleys Regent Street",tags:[["Gratuit","free"]],mode:"walk",
    d:"Sept étages de jouets avec démonstrations.",
    how:["Remonte Oxford Street vers l'ouest jusqu'à Oxford Circus : 10 min.","Descends Regent Street : 4 min, Hamleys est sur la gauche."]},
   {t:"12h00",n:"Disney Store",addr:"350-352 Oxford Street, W1C 1JH",q:"Disney Store Oxford Street",tags:[["Gratuit","free"]],mode:"walk",
    d:"Le grand Disney Store de Londres.",how:["Remonte vers Oxford Circus puis Oxford Street vers l'ouest : 12 min à pied, près de Bond Street."]},
   {t:"12h30",n:"Selfridges : Jellycat",addr:"400 Oxford Street, W1A 1AB",q:"Selfridges London",tags:[["À vérifier","warn"]],mode:"walk",
    d:"Le stand Jellycat « Fish & Chips » (peluches servies comme au comptoir). Vérifie qu'il est toujours là en 2027.",
    adj:"Ton fichier parlait d'un Jellycat Diner à Covent Garden. Le Diner existe à New York. À Londres, c'est chez Selfridges, d'où l'ajout ici.",
    how:["Juste en face, 3 min vers l'ouest sur Oxford Street."]},
   {t:"13h15",n:"Déjeuner",addr:"Autour de Bond Street",q:"St Christopher's Place London",mode:"walk",
    d:"St Christopher's Place, petite rue piétonne pleine de restos, juste en face de Selfridges.",how:["2 min à pied."]},
   {t:"14h30",n:"Mundo Pixar Experience",addr:"Fulton Road, Wembley Park, HA9 0TF",q:"Mundo Pixar Experience Wembley Park",tags:[["~£24 – £31","price"],["À vérifier","warn"]],major:1,tk:1,
    d:"14 univers Pixar grandeur nature, environ 1h de visite.",
    adj:"Déplacé l'après-midi pour regrouper le trajet vers Wembley.",
    how:["Bond Street → Jubilee line direction Stanmore : ~15 min jusqu'à Wembley Park.","Sortie vers Olympic Way puis Fulton Road : 5 min à pied."]},
   {t:"17h00",n:"Soirée libre",addr:"Westfield London, Shepherd's Bush",q:"Westfield London",
    d:"Westfield London est à 10 min de l'hôtel si tu veux le caser ici.",
    how:["Depuis Wembley Park : Jubilee → Bond Street, puis Central line direction ouest → Shepherd's Bush (~35 min au total)."]}
  ],
  back:["Depuis Westfield : Central line Shepherd's Bush → North Acton / East Acton puis bus, ou Uber (~10 min).","Depuis le centre : Elizabeth line → Acton Main Line."]
},

{ id:"j8", date:"2027-05-28", dow:"Ven", label:"28 mai", title:"Greenwich & Canary Wharf", line:"DLR", c:"#00a4a7",
  sub:"La Tamise en bateau, le méridien, le téléphérique et les tours de Canary Wharf.",
  notes:[["Bateaux Uber Boat by Thames Clippers : paie avec ta carte sans contact au portique du ponton, c'est moins cher qu'au guichet.","info"]],
  stops:[
   {t:"09h30",n:"Croisière Westminster → Greenwich",addr:"Westminster Pier, Victoria Embankment, SW1A 2JH",q:"Westminster Pier",tags:[["~£10 – £13,50","price"]],major:1,tk:1,
    d:"Ligne RB1, environ 50 min, avec la Tour, Tower Bridge et Canary Wharf depuis l'eau.",
    how:["Elizabeth line direction est d'Acton Main Line à Bond Street : ~12 min.","Jubilee line direction Stratford : 2 arrêts jusqu'à Westminster.","Sortie « Westminster Pier » : le ponton est au pied de Westminster Bridge.","Prends un bateau RB1 direction Greenwich / Barking Riverside. Installe-toi dehors à l'arrière."]},
   {t:"11h00",n:"Greenwich Market",addr:"Greenwich Market, SE10 9HZ",q:"Greenwich Market",tags:[["Gratuit","free"]],mode:"walk",
    d:"Artisans et street food. Option : le Cutty Sark juste à côté du ponton (~£18, « JSP »).",
    how:["Depuis Greenwich Pier, passe devant le Cutty Sark : 3 min à pied."]},
   {t:"12h00",n:"Greenwich Park",addr:"Blackheath Avenue, SE10 8XJ",q:"Greenwich Park",tags:[["Gratuit","free"]],mode:"walk",
    d:"Montée jusqu'à l'Observatoire pour la vue sur Canary Wharf et la City.",
    adj:"Royal Observatory (~£18 – £22) noté « Non » : on profite du parc et de la vue.",
    how:["Prends King William Walk vers le sud jusqu'à l'entrée du parc, puis monte la colline : 15 min."]},
   {t:"13h30",n:"National Maritime Museum",addr:"Romney Road, SE10 9NF",q:"National Maritime Museum",tags:[["Gratuit","free"]],mode:"walk",
    d:"Musée de la marine, en bas du parc.",how:["Redescends la colline vers le nord : 10 min."]},
   {t:"15h00",n:"Téléphérique IFS Cloud Cable Car",addr:"Greenwich Peninsula Terminal, Edmund Halley Way, SE10 0FR",q:"IFS Cloud Cable Car Greenwich Peninsula",tags:[["~£6 aller","price"]],major:1,
    d:"Traversée de la Tamise en cabine, de l'O2 jusqu'aux Royal Docks, environ 10 min.",
    adj:"Le téléphérique part du côté de l'O2 (North Greenwich) et arrive aux Royal Docks.",
    how:["Bus 188 ou 129 depuis Greenwich (arrêt Cutty Sark) jusqu'à North Greenwich : ~15-20 min.","Le terminal du téléphérique est à 5 min à pied de la station, côté O2.","Paie avec ta carte sans contact au portique."]},
   {t:"16h00",n:"Canary Wharf",addr:"Crossrail Place Roof Garden, E14 5AR",q:"Crossrail Place Roof Garden",tags:[["Gratuit","free"]],
    d:"Le jardin tropical sur le toit de la station Elizabeth line. Bubble Planet et F1 Experience à vérifier.",
    how:["Depuis le terminal Royal Docks : 10 min à pied jusqu'à Custom House.","Elizabeth line direction ouest : 1 arrêt jusqu'à Canary Wharf.","Le Roof Garden est au-dessus de la station."]},
   {t:"18h30",n:"Uber Boat Canary Wharf → Westminster",addr:"Canary Wharf Pier, E14",q:"Canary Wharf Pier",tags:[["~£10 – £13,50","price"]],
    d:"Belle lumière sur la Tamise en fin de journée.",
    how:["Canary Wharf Pier est à 7 min à pied à l'ouest de la station.","Ligne RB6 vers l'ouest (Westminster / Putney), ~35-40 min."]},
   {t:"19h30",n:"Dîner sur la Southbank",addr:"Southbank Centre, Belvedere Road, SE1 8XX",q:"Southbank Centre",mode:"walk",
    d:"Les restos et le food market derrière le Royal Festival Hall.",
    how:["Descends à London Eye Pier ou Westminster, puis longe la rive sud : 5 min."]}
  ],
  back:["Southbank → Waterloo, 5 min à pied.","Jubilee line direction Stanmore : 3 arrêts jusqu'à Bond Street.","Elizabeth line direction ouest → Acton Main Line."]
},

{ id:"j9", date:"2027-05-29", dow:"Sam", label:"29 mai", title:"Harry Potter Studio Tour", line:"Bakerloo line", c:"#b36305",
  sub:"Journée complète aux studios Warner Bros. à Leavesden. Le soir, préparation des bagages.",
  notes:[["Réservation obligatoire des semaines à l'avance, aucun billet vendu sur place. Le samedi part en premier.","warn"],["Le vol est à 7h35 demain : couche-toi tôt et réserve ton taxi ce soir.","info"]],
  stops:[
   {t:"07h15",n:"Hôtel → Euston",addr:"Euston Station, NW1 2RT",q:"Euston Station",
    d:"Environ 35 min.",
    how:["Elizabeth line direction est d'Acton Main Line à Tottenham Court Road : ~14 min.","Northern line direction nord (branche Charing Cross, vers Edgware / High Barnet) : 3 arrêts jusqu'à Euston."]},
   {t:"08h00",n:"Train Euston → Watford Junction",addr:"Euston Station",q:"Watford Junction",tags:[["~£10 A/R","price"]],tk:1,
    d:"Train direct London Northwestern Railway, environ 20 min.",
    how:["Regarde le grand tableau des départs et prends un train direct pour Watford Junction.","Carte sans contact et Oyster acceptées jusqu'à Watford Junction.","Évite les trains omnibus de l'Overground (Lioness line), beaucoup plus lents."]},
   {t:"08h30",n:"Navette officielle Warner Bros.",addr:"Watford Junction, sortie gare routière",q:"Watford Junction",
    d:"Navette électrique incluse dans le billet, environ 15 min. Départs dès 8h15 si le premier tour est à 9h, puis au moins toutes les 30 min.",
    how:["Sors de la gare côté gare routière : les bus aux couleurs Harry Potter sont garés devant.","Montre ta réservation au chauffeur."]},
   {t:"09h30",n:"Warner Bros. Studio Tour",addr:"Studio Tour Drive, Leavesden WD25 7LR",q:"Warner Bros Studio Tour London",tags:[["~£53 – £65","price"],["À réserver","book"]],major:1,tk:1,
    d:"Compter 3h30 à 5h. Grande Salle, Poudlard Express, Chemin de Traverse, Bièraubeurre.",
    how:["Présente-toi 20 min avant ton créneau."]},
   {t:"15h00",n:"Retour vers Londres",addr:"Watford Junction → Euston",q:"Euston Station",
    d:"Navette puis train direct vers Euston.",how:["Navette jusqu'à Watford Junction.","Train direct vers Euston, ~20 min."]},
   {t:"17h00",n:"Soirée : bagages & dernières boutiques",addr:"Westfield London",q:"Westfield London",
    d:"Westfield London est près de l'hôtel. Prépare tout ce soir : départ à 4h15.",how:["Euston → hôtel par la Northern line et l'Elizabeth line, ~35 min."]}
  ],
  back:["Couche-toi tôt, le réveil sonne vers 3h45."]
},

{ id:"j10", date:"2027-05-30", dow:"Dim", label:"30 mai", title:"Départ", line:"Retour", c:"#d4231e",
  sub:"Vol à 7h35, la nuit sera courte.",
  notes:[["À 4h du matin il n'y a pas de train pour Gatwick depuis l'hôtel : prévois un Uber réservé à l'avance ou un taxi commandé la veille.","warn"]],
  stops:[
   {t:"04h15",n:"Départ de l'hôtel en Uber / taxi",addr:"Hôtel, Acton",q:"Acton Main Line Station",major:1,tk:1,
    d:"Trajet de 45 à 60 min vers Gatwick, avec une marge.",how:["Programme la course dans l'app Uber (« Réserver ») la veille."]},
   {t:"05h30",n:"Arrivée à Gatwick",addr:"Gatwick Airport, RH6 0NP",q:"Gatwick Airport",tk:1,
    d:"2h avant le vol : dépôt des bagages et sécurité. Vérifie ton terminal (North ou South) sur ta carte d'embarquement.",how:["Le chauffeur te dépose devant le bon terminal."]},
   {t:"07h35",n:"Décollage",addr:"LGW",q:"Gatwick Airport",major:1,tk:1,mode:"walk",d:"",how:[]}
  ],
  back:[]
}
];

window.BUDGET=[
 ["Harry Potter Studio Tour","~£53 – £65","Navette incluse","oui",53,65,"Sam 29"],
 ["London Eye","~£29 – £33","Fast track ~£44+","oui",29,33,"Lun 24"],
 ["Mundo Pixar Experience","~£24 – £31","Probablement fermé en mai 2027","oui",24,31,"Jeu 27"],
 ["Croisière Westminster → Greenwich","~£10 – £13,50","Moins cher en sans contact","oui",10,13.5,"Ven 28"],
 ["Uber Boat Canary Wharf → Westminster","~£10 – £13,50","Retour du vendredi","oui",10,13.5,"Ven 28"],
 ["Téléphérique de Greenwich","~£6","Aller simple, ~£12 A/R","oui",6,6,"Ven 28"],
 ["Train Euston–Watford","~£10","Aller-retour, sans contact","oui",10,10,"Sam 29"],
 ["Sky Garden · Horizon 22 · Garden at 120","Gratuit","Réservation en ligne","oui",0,0,"Dim 23"],
 ["National Maritime Museum","Gratuit","Expos temporaires parfois payantes","oui",0,0,"Ven 28"],
 ["St Paul's Cathedral","~£25 – £30","Pas de visite le dimanche","jsp",25,30,"Dim 23"],
 ["Sea Life London","~£23 – £28","Prix selon affluence","jsp",23,28,"Lun 24"],
 ["Babylon Park","~£8,75 – £25","Bracelet illimité ~£25","jsp",8.75,25,"Mer 26"],
 ["Cutty Sark","~£18","À Greenwich","jsp",18,18,"Ven 28"],
 ["Tour de Londres","~£37","Joyaux de la Couronne, Beefeaters","non",37,37,"Dim 23"],
 ["Tower Bridge Exhibition","~£12 – £13,50","Passerelle vitrée","non",12,13.5,"Dim 23"],
 ["Royal Observatory Greenwich","~£18 – £22","Ligne du méridien","non",18,22,"Ven 28"],
 ["Twist Museum","~£19 – £26","Oxford Street","non",19,26,"—"],
 ["Paradox Museum","~£24 – £25,50","Face à Harrods","non",24,25.5,"—"],
 ["Serial Killer Experience","~£23 – £30","18+","non",23,30,"—"]
];

window.RESA=[
 ["hp","Harry Potter Studio Tour","Sam 29 · des semaines à l'avance"],
 ["eye","London Eye","Lun 24 · créneau 15h"],
 ["h22","Horizon 22","Dim 23 · 10h · sortie des billets le lundi"],
 ["sky","Sky Garden","Dim 23 · 17h · sortie des billets le lundi"],
 ["pix","Mundo Pixar (si encore ouvert)","Jeu 27 · 14h30"],
 ["uber","Uber / taxi pour Gatwick à 4h15","Dim 30 · à réserver la veille"]
];

window.BONUS=[
 ["Richmond Park","Demi-journée au sud-ouest, les cerfs en liberté.","Richmond Park"],
 ["God's Own Junkyard","Néons à Walthamstow, à combiner avec Walthamstow Market.","God's Own Junkyard"],
 ["Hampstead Pergola & Kenwood House","Jolie balade au nord de Londres.","Hampstead Pergola"],
 ["Sea Life London","À coupler avec le London Eye le lundi 24.","Sea Life London Aquarium"],
 ["Life-Size Monopoly","Pop-up éphémère, adresse à confirmer selon la saison.","Monopoly Lifesized London"]
];
