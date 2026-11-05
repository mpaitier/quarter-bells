# 0013 - Logo et génération des icônes

- Statut : Accepté
- Date : 2026-11-05

## Contexte

Le projet a besoin d'un logo pour l'onglet du navigateur, le manifeste de l'application web, l'écran d'accueil des téléphones, et plus tard l'application mobile. Le logo est une cloche dont le corps sert de cadran : six sections, une section en laiton pointée par le battant. Il est dessiné à la main dans Krita, comme les autres assets du jeu ([ADR 0012](0012-framework-web-et-rendu-de-l-horloge.md)), avec des visuels propres au projet.

Contraintes :

- **Un même logo de 16 px à 1024 px.** À 16 et 32 px, le cadran devient illisible : les séparations et le moyeu disparaissent, il ne reste qu'une tache. Une variante simplifiée est nécessaire pour les petites tailles.
- **Des formats imposés par les plateformes**, que le dessin ne choisit pas :

| Usage                          | Taille            | Contrainte                                                                       |
| ------------------------------ | ----------------- | -------------------------------------------------------------------------------- |
| Favicon de l'onglet            | 16 et 32 px       | aucune marge                                                                     |
| `apple-touch-icon`             | 180 × 180         | iOS remplace la transparence par du noir : fond opaque obligatoire               |
| Manifeste de l'application     | 192 et 512 px     | —                                                                                |
| Icône « maskable » (manifeste) | 512 px            | le contenu doit tenir dans un cercle de 80 % du côté, le reste peut être découpé |
| Icône adaptative Android       | calques de 108 dp | le contenu doit tenir dans le cercle central de 66 dp                            |
| Icône iOS                      | 1024 × 1024       | transparence interdite                                                           |

- **Les deux dernières versions de Chrome, Firefox, Safari et Edge** (NF-CMP-01). Safari accepte les favicons SVG depuis sa version 26 : les quatre navigateurs les affichent.
- **Un seul développeur, débutant sur Krita.** Une retouche du logo ne doit pas obliger à refaire chaque format à la main.
- **Un fichier source binaire et lourd** (`.kra`), que Git versionne mal : chaque version est stockée en entier dans l'historique.

## Options envisagées

### Format de la source

#### Un fichier par usage

Chaque format du tableau est dessiné ou composé à la main dans Krita.

Chaque format est réglé au pixel près. En contrepartie, une retouche du logo se répète sur sept fichiers, et les versions finissent par diverger : une marge oubliée ici, une couleur mal reprise là.

#### Une source aux proportions du logo

Le document a les proportions de la cloche (2000 × 2150, soit le `viewBox` de l'esquisse multiplié par 10). Les formats carrés sont composés à partir de lui.

Les coordonnées de l'esquisse se convertissent sans calcul. Mais tous les usages du tableau sont carrés : chaque export demande une composition supplémentaire, avec les mêmes risques de dérive que l'option précédente.

#### Un master carré et des exports générés

Un seul document carré, à fond transparent, qui ne contient que le logo. Fonds, marges et tailles sont ajoutés par un script, à partir de règles écrites une fois.

Une retouche se fait à un seul endroit, et le script la propage à tous les formats. Le coût : écrire et maintenir le script, et convertir les coordonnées de l'esquisse avec un décalage (×10, puis + 200 en x et + 125 en y).

### Silhouette de référence

#### L'esquisse SVG

Le chemin SVG de l'esquisse fait référence. Le dessin Krita le suit au pixel près.

Les variantes vectorielles se génèrent sans effort. Mais le dessin à la main se réduit à un décalque, ce qui retire l'intérêt de le faire.

#### Le dessin Krita

La silhouette dessinée fait référence. Les variantes vectorielles en dérivent.

Le logo garde le trait du dessinateur. Le chemin SVG de la variante simplifiée doit être refait d'après le dessin.

### Stockage du fichier source

- **Hors du repo** : rien à configurer, mais aucune trace des versions, et la source se perd avec un disque.
- **Dans Git, sans extension** : chaque version du `.kra` est ajoutée en entier à l'historique, et chaque clone la télécharge, pour toujours.
- **Avec Git LFS** : le repo ne garde qu'un pointeur, le fichier vit sur le stockage LFS de GitHub. Chaque machine doit installer Git LFS, et le stockage gratuit a un quota.

## Décision

- **Un master carré unique** : `quarter-bells-logo.kra`, 2400 × 2400 px, RVB 8 bits, sRGB, fond transparent, logo seul. Il est exporté une fois en PNG (`quarter-bells-logo-master.png`). Tous les formats sont générés à partir de ce PNG par un script.
- **Le dessin Krita fait référence** pour la silhouette. La variante simplifiée en SVG est redessinée d'après lui.
- **Deux variantes** :
  - **C, le logo complet**, de 64 px et au-delà : cloche bleu nuit, contour et séparations en laiton, section du bas en laiton, battant, moyeu et boule en crème, anneau en laiton ;
  - **D, la variante simplifiée**, pour 16 et 32 px : silhouette pleine en laiton, séparations épaisses en bleu nuit, sans moyeu ni battant. Elle est livrée en SVG, avec un PNG de 32 px en secours.
- **Git LFS** pour les fichiers `.kra`.
- **Une règle d'emploi** : le master transparent s'utilise sur fond sombre. Sur fond clair, on utilise la version posée sur une pastille bleu nuit, parce que la boule et le moyeu crème disparaissent sur du blanc.

### Spécification du master

Couleurs, reprises dans la palette `quarter-bells.gpl` et, à terme, dans les tokens partagés par le web et le mobile :

| Nom       | Hexadécimal | RVB           |
| --------- | ----------- | ------------- |
| bleu-nuit | `#1f2a44`   | 31, 42, 68    |
| laiton    | `#b08d57`   | 176, 141, 87  |
| creme     | `#f3ead8`   | 243, 234, 216 |

Épaisseurs, dans un rapport fixe pour que le cadran ne se confonde pas avec le contour :

| Élément         | Épaisseur |
| --------------- | --------- |
| Contour         | 40 px     |
| Séparations     | 24 px     |
| Tige du battant | 48 px     |
| Anneau          | 40 px     |

Repères : axe de symétrie à x = 1200, sommet du corps à y = 445, centre du cadran à y = 1205, lèvre à y = 1905. Les six séparations font 60° entre elles. La section en laiton est à 90 % d'opacité.

Organisation des calques :

```
quarter-bells-logo.kra
├── anneau
├── battant
├── contour
└── cloche (groupe)
    ├── separations      [alpha hérité]
    ├── section-laiton   [alpha hérité, 90 %]
    └── silhouette
```

## Conséquences

- Un paquet `packages/assets` accueille la source, le master, la palette et le script de génération. Le scope `assets` s'ajoute à la liste des scopes de commit dans `CONTRIBUTING.md`.
- `.gitattributes` envoie les `.kra` vers Git LFS. Cette règle doit être commitée **avant** le premier `.kra` : un fichier commité sans LFS reste dans l'historique, même supprimé ensuite. Le `.gitignore` exclut les fichiers de sauvegarde et d'enregistrement automatique que Krita crée à côté du document.
- Chaque contributeur installe Git LFS (`git lfs install`), ce que `CONTRIBUTING.md` doit indiquer. Le quota de stockage LFS gratuit de GitHub est à surveiller si le nombre d'assets `.kra` grossit.
- Le master PNG est commité : la CI ne peut pas l'exporter depuis le `.kra`, Krita n'y est pas installé. Une retouche du logo suit donc toujours le même ordre : modifier le `.kra`, réexporter le master, relancer le script, commiter les trois.
- Le script de génération est la seule source des formats du tableau. Aucun de ces fichiers ne se retouche à la main.
- La variante D, aujourd'hui tirée du chemin SVG de l'esquisse, est redessinée d'après la silhouette Krita avant d'être publiée.
- Les icônes de l'application mobile seront générées par `flutter_launcher_icons` à partir du même master, dans une issue séparée.
- Le master est un raster : il couvre les usages jusqu'à 2400 px. Un usage plus grand (affiche, impression) demanderait de vectoriser la silhouette.
