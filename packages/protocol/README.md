# protocol

Contrat entre l'écran de jeu et la partie ([ADR 0017](../../docs/adr/0017-brancher-l-ecran-sur-une-passerelle-de-jeu.md)) :

- les **commandes** envoyées par un joueur (poser une carte, se déclarer prêt, décisions de l'hôte), et leur traduction en action du moteur, `toGameAction` ;
- la **vue d'un joueur** (`PlayerView`), tout ce que l'écran reçoit, et sa projection depuis l'état complet, `projectPlayerView`.

La projection est la barrière de l'exigence NF-SEC-01 : une vue ne contient jamais la valeur d'une carte que son joueur n'a pas le droit de connaître. Au J2, l'adaptateur local de `apps/web` l'appelle ; au J3, le serveur l'appellera.

Comme `rules` et `game`, ce paquet est pur : ni réseau, ni disque, ni heure système, ni hasard.

Le protocole sera versionné au J3, avec l'enveloppe des messages et les schémas de validation décrits dans [protocol.md](../../docs/protocol.md). Tout changement incompatible incrémentera alors la version majeure et fera l'objet d'un ADR.

## Dépendances autorisées

- `@quarter-bells/rules`, par son API publique, pour les types du domaine (carte, horloge, pose publique).
- `@quarter-bells/game`, par son API publique, pour l'état d'une partie et ses actions.

## Commandes

Depuis la racine du dépôt :

```sh
pnpm --filter @quarter-bells/protocol typecheck
pnpm test --project @quarter-bells/protocol
```
