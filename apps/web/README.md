# web

Client web, prioritaire. Affiche l'état reçu du serveur, envoie les intentions du joueur et joue les animations.

Ce client ne décide jamais du résultat d'une action : il peut prévisualiser une règle pour l'interface (lueur rouge sur une section interdite), mais seul le serveur valide.

## Dépendances autorisées

- `packages/rules`
- `packages/protocol`

Aucune dépendance vers `apps/server` ni `apps/mobile`.

## Stack

React, TypeScript en mode `strict`, rendu de l'horloge en SVG et build par Vite ([ADR 0012](../../docs/adr/0012-framework-web-et-rendu-de-l-horloge.md)).

## Commandes

Depuis la racine du dépôt :

| Commande                      | Rôle                                                       |
| ----------------------------- | ---------------------------------------------------------- |
| `pnpm --filter web dev`       | serveur de développement, rechargement à chaud             |
| `pnpm --filter web build`     | site statique dans `apps/web/dist/`                        |
| `pnpm --filter web preview`   | sert le contenu de `dist/` pour vérifier le build en local |
| `pnpm --filter web typecheck` | vérification des types                                     |
