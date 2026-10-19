# Quarter Bells

Jeu coopératif de cartes en ligne, de 2 à 4 joueurs. Les joueurs posent ensemble
12 cartes autour d'une horloge en respectant les règles de chaque épreuve, sans
communiquer pendant la pose.

Le projet comprend un serveur de jeu, un client web et, plus tard, un client mobile.

## Prérequis

- **Node.js** : la version indiquée dans [`.nvmrc`](.nvmrc).
  Un gestionnaire de versions est recommandé, par exemple [fnm](https://github.com/Schniz/fnm),
  qui lit `.nvmrc` et change de version automatiquement en entrant dans le dossier.
- **pnpm** : la version est fixée par le champ `packageManager` du `package.json`
  et fournie par Corepack, livré avec Node 24.

Le champ `engines` du `package.json` indique la plage de versions de Node attendue.
Il est seulement indicatif : pnpm ne bloque pas l'installation si la version ne
correspond pas. La version de référence reste celle de `.nvmrc`.

## Installation

1. Installer et activer la version de Node du projet :

```sh
   fnm install
   fnm use
```

2. Activer pnpm via Corepack (une seule fois par machine et par version de Node) :

```sh
   corepack enable pnpm
```

3. Installer les dépendances :

```sh
   pnpm install
```

## Vérifier

```sh
pnpm check
```

Lance dans l'ordre les vérifications de la CI. Chacune existe aussi séparément :

| Commande            | Rôle                                                                           |
| ------------------- | ------------------------------------------------------------------------------ |
| `pnpm format:check` | Vérifie le formatage (Prettier). `pnpm format` corrige.                        |
| `pnpm lint`         | Analyse le code (ESLint), dont l'isolation de `packages/rules`.                |
| `pnpm typecheck`    | Vérifie les types (TypeScript) de tous les paquets.                            |
| `pnpm test`         | Lance les tests (Vitest). `pnpm test:watch` les relance à chaque modification. |

## Versions bloquées

- **TypeScript reste en 6.0.** TypeScript 7 n'est pas encore pris en charge par
  typescript-eslint, qui n'accepte que les versions inférieures à 6.1.0. À revoir
  quand typescript-eslint annoncera la prise en charge de TypeScript 7.

## Organisation du dépôt

```text
apps/      applications exécutables (server, web, mobile)
packages/  code partagé (rules, protocol)
docs/      documentation, décisions d'architecture, diagrammes
```

Les règles de dépendance entre ces dossiers sont décrites dans
[l'ADR 0002](docs/adr/0002-organiser-le-code-en-monorepo.md).

## Documentation

Tout part de [`docs/README.md`](docs/README.md) : règles du jeu, exigences,
conception et décisions d'architecture.

## Contribuer

Branches, format des commits et pull requests : voir [CONTRIBUTING.md](CONTRIBUTING.md).

## Licence

Tous droits réservés. Aucune licence n'est accordée pour le moment.
