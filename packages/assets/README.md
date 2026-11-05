# Assets

Sources des visuels du projet et palette de couleurs. Les décisions sont dans l'[ADR 0013](../../docs/adr/0013-logo-et-generation-des-icones.md).

## Contenu

| Chemin                                   | Contenu                                                            |
| ---------------------------------------- | ------------------------------------------------------------------ |
| `palettes/quarter-bells.gpl`             | Palette des couleurs du projet, à importer dans Krita              |
| `src/logo/quarter-bells-logo.kra`        | Source du logo, stockée par Git LFS                                |
| `src/logo/quarter-bells-logo-master.png` | Master du logo exporté depuis Krita, 2400 × 2400, fond transparent |

Les fichiers de `src/logo/` arrivent dans un commit séparé, après la configuration de Git LFS.

## Règles

- Les `.kra` passent par Git LFS (voir `.gitattributes`). Avant de commiter un nouveau `.kra`, `git lfs ls-files` doit le lister.
- Le master PNG est commité : la CI n'a pas Krita et ne peut pas l'exporter elle-même.
- Les formats d'icônes sont générés depuis le master par un script. Aucun ne se retouche à la main.
- Les couleurs viennent de la palette. Après une modification de `quarter-bells.gpl`, réimporter la palette dans Krita.

## Retoucher le logo

1. Modifier `quarter-bells-logo.kra` dans Krita.
2. Réexporter `quarter-bells-logo-master.png` : PNG, canal alpha, profil sRGB inclus.
3. Relancer le script de génération des icônes.
4. Commiter les trois dans le même commit.
