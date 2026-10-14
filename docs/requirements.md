# Exigences

Ce document liste les exigences du projet. Chaque exigence a un identifiant stable, une priorité et doit pouvoir être vérifiée. Un identifiant n'est jamais réutilisé, même si l'exigence est supprimée.

Priorités (méthode MoSCoW) :

- **M** (Must) : indispensable à la première version jouable.
- **S** (Should) : attendu, mais la version peut sortir sans.
- **C** (Could) : bonus si le temps le permet.
- **W** (Won't) : écarté pour l'instant, consigné pour mémoire.

## Exigences fonctionnelles

### Profil joueur

| ID | Exigence | Priorité |
|----|----------|----------|
| F-PRF-01 | Au premier lancement, le joueur crée un profil avec un nom et une icône. | M |
| F-PRF-02 | Le joueur choisit son icône parmi une liste fournie. | M |
| F-PRF-03 | Le joueur peut importer sa propre image comme icône. | C |
| F-PRF-04 | Le joueur peut modifier son nom et son icône depuis les paramètres. | S |
| F-PRF-05 | Le joueur peut régler le volume sonore depuis les paramètres. | S |

### Salle d'attente

| ID | Exigence | Priorité |
|----|----------|----------|
| F-LOB-01 | Un joueur peut créer une salle et obtient un code à partager. | M |
| F-LOB-02 | Un joueur peut rejoindre une salle en saisissant son code. | M |
| F-LOB-03 | Une salle accueille de 2 à 4 joueurs. | M |
| F-LOB-04 | Un code invalide, une salle complète ou une partie déjà commencée affichent un message explicite. | M |
| F-LOB-05 | Chaque joueur peut se déclarer prêt ou annuler. Le statut de tous est visible. | M |
| F-LOB-06 | La partie démarre quand au moins 2 joueurs sont présents et tous prêts. | M |
| F-LOB-07 | Un joueur peut quitter la salle d'attente. | M |
| F-LOB-08 | Le départ de l'hôte ne ferme pas la salle. | S |

### Déroulement d'une épreuve

| ID | Exigence | Priorité |
|----|----------|----------|
| F-JEU-01 | Une animation annonce le chapitre et le numéro d'horloge (x / 4) au début de chaque épreuve. | S |
| F-JEU-02 | Une épreuve enchaîne les phases Discussion, Pose et Résolution. | M |
| F-JEU-03 | Pendant la Discussion, chaque joueur voit uniquement la couleur du dos de ses cartes. | M |
| F-JEU-04 | La Discussion se termine quand tous les joueurs ont cliqué sur « Prêt ». | M |
| F-JEU-05 | Au début de la partie, le groupe fixe l'ordre de passage en désignant les joueurs ou en le tirant au hasard. | M |
| F-JEU-06 | Les 12 cartes sont distribuées selon le nombre de joueurs : 4 chacun à 3 joueurs, 3 chacun à 4 joueurs, 4 puis 2 chacun à 2 joueurs. | M |
| F-JEU-07 | Le joueur dont c'est le tour sélectionne une carte puis un quartier pour la poser. Le tour du joueur actif est clairement signalé à tous. | M |
| F-JEU-08 | Les quartiers où la pose est interdite par une règle sont signalés visuellement pendant la sélection. | S |
| F-JEU-09 | Le joueur peut dépenser un œil pour poser sa carte face visible. Le nombre d'yeux disponibles dépend du nombre de joueurs et des yeux bonus. | M |
| F-JEU-10 | Pendant la Pose, aucun moyen de communication n'est disponible entre joueurs. | M |
| F-JEU-11 | Un joueur peut revoir la valeur des cartes qu'il a lui-même posées face cachée. | S |
| F-JEU-12 | À la Résolution, les cartes se révèlent quartier par quartier à partir du quartier de départ, dans le sens horaire. La somme de chaque quartier s'affiche en vert si elle respecte l'ordre croissant, en rouge sinon. | M |
| F-JEU-13 | L'épreuve est réussie si chaque quartier a au moins une carte, si les sommes sont croissantes, si aucune ne dépasse 24 (sauf exception de l'horloge) et si toutes les règles spéciales sont respectées. | M |
| F-JEU-14 | En cas d'échec, le groupe gagne un œil bonus, signalé par une animation. Les yeux bonus sont remis à zéro après une réussite. | M |
| F-JEU-15 | En cas d'échec, le groupe peut retenter l'épreuve ou la mettre de côté pour y revenir plus tard. | S |

### Règles et contenu

| ID | Exigence | Priorité |
|----|----------|----------|
| F-REG-01 | Les horloges et leurs règles sont décrites sous forme de données, sans code spécifique à chaque horloge. | M |
| F-REG-02 | Le jeu propose 10 chapitres de 4 horloges à difficulté croissante. | S |
| F-REG-03 | Le contenu (noms, visuels, épreuves) est original et ne reprend pas celui du jeu dont le projet s'inspire. | M |

### Progression

| ID | Exigence | Priorité |
|----|----------|----------|
| F-PRG-01 | La progression d'un groupe (chapitre, horloge, épreuves mises de côté) est sauvegardée entre deux sessions. | S |

### Tutoriel

| ID | Exigence | Priorité |
|----|----------|----------|
| F-TUT-01 | Un tutoriel fait jouer une épreuve guidée à un joueur seul, avec des coéquipiers simulés. | S |

### Communication

| ID | Exigence | Priorité |
|----|----------|----------|
| F-COM-01 | Un chat écrit est disponible pendant la Discussion et désactivé pendant la Pose. | C |
| F-COM-02 | Chat vocal intégré. | W |

## Exigences non fonctionnelles

### Sécurité

| ID | Exigence | Priorité |
|----|----------|----------|
| NF-SEC-01 | Aucun client ne reçoit la valeur d'une carte qu'il n'a pas le droit de connaître à l'instant présent. | M |
| NF-SEC-02 | Toute action est validée par le serveur, indépendamment de la validation faite par le client. | M |
| NF-SEC-03 | Les images importées sont limitées en taille et en format, vérifiées sur leur contenu réel et réencodées par le serveur. | S |
| NF-SEC-04 | Le nombre de messages accepté par client est limité dans le temps. | S |
| NF-SEC-05 | Aucun secret n'est stocké dans le dépôt. | M |

### Fiabilité

| ID | Exigence | Priorité |
|----|----------|----------|
| NF-REL-01 | Un joueur déconnecté depuis moins de 60 secondes retrouve sa partie dans l'état exact où elle se trouvait. | M |
| NF-REL-02 | Une même commande reçue plusieurs fois ne produit son effet qu'une seule fois. | M |
| NF-REL-03 | Un redémarrage du serveur ne fait pas perdre la progression sauvegardée des groupes. | S |

### Performance

| ID | Exigence | Priorité |
|----|----------|----------|
| NF-PERF-01 | Le délai entre l'action d'un joueur et sa réception par les autres reste sous 300 ms au 95e percentile, sur une connexion domestique en France. | S |
| NF-PERF-02 | Le premier affichage du client web prend moins de 3 secondes sur une connexion 4G. | S |

### Qualité

| ID | Exigence | Priorité |
|----|----------|----------|
| NF-QUA-01 | Chaque règle du moteur est couverte par au moins un test de réussite et un test d'échec. | M |
| NF-QUA-02 | Le lint, le formatage et les tests bloquent la fusion d'une pull request. | M |
| NF-QUA-03 | Chaque décision d'architecture structurante fait l'objet d'un ADR. | M |
| NF-QUA-04 | Le package `rules` ne dépend d'aucun autre package du dépôt ni d'aucune bibliothèque d'entrée/sortie. | M |

### Accessibilité

| ID | Exigence | Priorité |
|----|----------|----------|
| NF-ACC-01 | Les deux familles de cartes se distinguent sans la couleur, par une icône ou un motif. | M |
| NF-ACC-02 | Les animations peuvent être réduites ou désactivées, et respectent la préférence système de réduction des mouvements. | S |
| NF-ACC-03 | Les contrastes de texte respectent le niveau AA des WCAG. | S |

### Internationalisation

| ID | Exigence | Priorité |
|----|----------|----------|
| NF-I18N-01 | Aucun texte affiché n'est écrit en dur dans le code. Le français est disponible, l'anglais est prévu. | S |

### Compatibilité

| ID | Exigence | Priorité |
|----|----------|----------|
| NF-CMP-01 | Le client web fonctionne sur les deux dernières versions de Chrome, Firefox, Safari et Edge. | M |
| NF-CMP-02 | Le protocole est versionné ; le serveur refuse explicitement un client dont la version est incompatible. | S |

### Observabilité

| ID | Exigence | Priorité |
|----|----------|----------|
| NF-OBS-01 | Les logs du serveur sont structurés et portent l'identifiant de la partie et du joueur concernés. | S |

### Données personnelles

| ID | Exigence | Priorité |
|----|----------|----------|
| NF-RGPD-01 | Seules les données nécessaires au jeu sont collectées (nom, icône, progression). | M |
| NF-RGPD-02 | Un joueur peut supprimer son profil et son icône. | S |
| NF-RGPD-03 | La durée de conservation des profils inactifs est définie et appliquée. | S |

### Exploitation

| ID | Exigence | Priorité |
|----|----------|----------|
| NF-OPS-01 | Le serveur tourne dans un conteneur et lit sa configuration dans des variables d'environnement. | S |
| NF-OPS-02 | L'hébergement est gratuit. | M |