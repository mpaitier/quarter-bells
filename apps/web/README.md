# web

Client web, prioritaire. Affiche l'état reçu du serveur, envoie les intentions du joueur et joue les animations.

Ce client ne décide jamais du résultat d'une action : il peut prévisualiser une règle pour l'interface (lueur rouge sur une section interdite), mais seul le serveur valide.

## Dépendances autorisées

- `packages/rules`
- `packages/protocol`

Aucune dépendance vers `apps/server` ni `apps/mobile`.

## Statut

Stack non choisie (voir `docs/adr/`).
