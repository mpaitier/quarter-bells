# server

Serveur de jeu faisant autorité. Il gère les lobbys et les parties, valide chaque action reçue des clients et envoie à chaque joueur uniquement les informations qu'il a le droit de connaître.

## Dépendances autorisées

- `packages/rules`
- `packages/protocol`

Aucune dépendance vers `apps/web` ni `apps/mobile`.

## Statut

Stack non choisie (voir `docs/adr/`).
