# 0005 - Outillage TypeScript

- Statut : Accepté
- Date : 2026-10-15

## Contexte

L'[ADR 0003](0003-choix-de-la-stack.md) retient TypeScript pour `apps/web`, `apps/server`, `packages/rules` et `packages/protocol`. Avant d'écrire du code, il faut choisir :

- le gestionnaire de paquets et de workspaces, qui relie les paquets locaux du monorepo ;
- le framework de tests ;
- le lint et le formatage.

L'exigence NF-QUA-02 impose que le lint, le formatage et les tests bloquent la fusion d'une pull request. Ces outils doivent donc tourner en CI.

## Options envisagées

### Gestionnaire de workspaces

| Option | Avantages | Inconvénients |
|--------|-----------|---------------|
| npm workspaces | Fourni avec Node, rien à installer | Plus lent ; un paquet peut importer une dépendance qu'il n'a pas déclarée |
| pnpm workspaces | Rapide ; dépendances strictes (un paquet n'accède qu'à ce qu'il déclare) ; filtrage par paquet (`--filter`) | Un outil de plus à installer |
| Yarn | Workspaces matures | Deux versions très différentes coexistent, documentation dispersée |

### Framework de tests

| Option | Avantages | Inconvénients |
|--------|-----------|---------------|
| Jest | Très répandu | Configuration supplémentaire pour TypeScript et les modules ES |
| Vitest | TypeScript et modules ES sans configuration ; API compatible avec Jest ; rapide | Plus récent |

### Lint et formatage

| Option | Avantages | Inconvénients |
|--------|-----------|---------------|
| ESLint + typescript-eslint + Prettier | Standard en entreprise ; règles qui utilisent les types (promesses non attendues, etc.) | Deux outils à configurer |
| Biome | Un seul outil, très rapide | Moins de règles qui s'appuient sur les types ; moins répandu en entreprise |

## Décision

- **pnpm workspaces** pour le monorepo. Les dépendances strictes protègent les règles de dépendance de l'ADR 0002.
- **Vitest** pour les tests de tous les paquets TypeScript.
- **ESLint avec typescript-eslint, et Prettier** pour le formatage. ESLint vérifie la qualité du code, Prettier ne s'occupe que de sa forme.
- **TypeScript en mode `strict`** dans tous les paquets.

Les versions de Node.js et de pnpm sont fixées dans le dépôt : Node dans un fichier `.nvmrc` (version LTS active au moment de l'installation), pnpm dans le champ `packageManager` du `package.json` racine. Les versions des dépendances sont figées par le fichier `pnpm-lock.yaml`, qui est versionné.

## Conséquences

- La CI installe les dépendances avec `pnpm install --frozen-lockfile` : une dépendance modifiée sans mise à jour du fichier de verrouillage fait échouer la CI.
- Une règle ESLint interdit les imports entre applications et les imports de `packages/rules` vers d'autres paquets (exigence NF-QUA-04). Cherche `import/no-restricted-paths` ou `no-restricted-imports`.
- Les règles de formatage sont celles de Prettier, sans débat : la configuration reste minimale.
- Le `.editorconfig` reste en place pour les fichiers que Prettier ne traite pas.