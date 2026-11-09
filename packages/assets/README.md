# Assets

Sources des visuels du projet et palette de couleurs. Les décisions sont dans l'[ADR 0013](../../docs/adr/0013-logo-et-generation-des-icones.md).

## Contenu

| Chemin                                   | Contenu                                                            |
| ---------------------------------------- | ------------------------------------------------------------------ |
| `palettes/quarter-bells.gpl`             | Palette des couleurs du projet, à importer dans Krita              |
| `src/logo/quarter-bells-logo.kra`        | Source du logo, stockée par Git LFS                                |
| `src/logo/quarter-bells-logo-master.png` | Master du logo exporté depuis Krita, 2400 × 2400, fond transparent |
| `src/logo/quarter-bells-logo-small.svg`  | Variante D du logo, pour les favicons de 16 et 32 px               |
| `scripts/generate-icons.ts`              | Génération des icônes du site à partir du master                   |
| `src/table/table-background.kra`         | Source du fond de la table de jeu, stockée par Git LFS             |

## Fond de la table de jeu

Exporté depuis `src/table/table-background.kra` directement dans `apps/web/src/assets/table-background.webp` : tuile répétable de 2048 × 2048, affichée sur 1024 px CSS. Le document Krita contient la texture d'origine et un calque bleu nuit en mode Multiplier qui l'assombrit.

## Provenance des sources externes

| Fichier                          | Source                                                                          | Auteurs                                       | Licence |
| -------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------- | ------- |
| `src/table/table-background.kra` | [Dark Wood](https://polyhaven.com/a/dark_wood), Poly Haven, carte Diffuse en 2K | Dario Barresi, Dimitrios Savva, Rico Cilliers | CC0     |

Une ressource externe n'entre dans le repo qu'avec une licence qui autorise l'usage, la modification et la redistribution, et une ligne dans ce tableau.

## Règles

- Les `.kra` passent par Git LFS (voir `.gitattributes`). Avant de commiter un nouveau `.kra`, `git lfs ls-files` doit le lister.
- Le master PNG est commité : la CI n'a pas Krita et ne peut pas l'exporter elle-même.
- Les formats d'icônes sont générés depuis le master par un script. Aucun ne se retouche à la main.
- Les couleurs viennent de la palette. Après une modification de `quarter-bells.gpl`, réimporter la palette dans Krita.

## Générer les icônes

```
pnpm --filter assets icons
```

Le script lit le master, la variante D et la palette, puis écrit dans `apps/web` :

| Fichier                               | Taille   | Rôle                                       |
| ------------------------------------- | -------- | ------------------------------------------ |
| `public/favicon.svg`                  | —        | favicon, variante D                        |
| `public/favicon-32.png`               | 32       | favicon de secours, variante D             |
| `public/apple-touch-icon.png`         | 180      | écran d'accueil iOS                        |
| `public/icon-192.png`, `icon-512.png` | 192, 512 | manifeste de l'application                 |
| `public/icon-maskable-512.png`        | 512      | manifeste, icône découpable par le système |
| `src/assets/logo-header.png`          | 96       | en-tête du site, affiché à 48 px           |

Les icônes à fond opaque et le logo de l'en-tête utilisent le fond ardoise de la palette (ADR 0013). Le résultat est identique d'un lancement à l'autre : relancer le script sans avoir modifié les sources ne change aucun fichier.

La variante D a été dessinée une fois, en vectorisant le contour du corps de la cloche depuis le master. Elle ne se régénère pas : si la silhouette du master change, la redessiner.

## Retoucher le logo

1. Modifier `quarter-bells-logo.kra` dans Krita.
2. Réexporter `quarter-bells-logo-master.png` : PNG, canal alpha, profil sRGB inclus.
3. Relancer `pnpm --filter assets icons`.
4. Commiter les trois dans le même commit.
