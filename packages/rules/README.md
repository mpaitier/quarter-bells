# rules

Moteur de règles du jeu : cartes, horloges, sections, contraintes de pose et conditions de réussite.

Ce package est pur. Il ne fait aucun accès réseau, disque ou base de données, ne lit pas l'heure système et ne tire pas de hasard sans graine fournie de l'extérieur. Toute la logique y est testable unitairement.

Aucun module n'agit au simple chargement : pas d'enregistrement global, pas d'état partagé. Le `package.json` le déclare avec `"sideEffects": false`, ce qui permet au bundler du client web d'écarter les modules qu'il n'importe pas. Un module qui ferait quelque chose à son chargement devrait retirer cette déclaration.

## Dépendances autorisées

Aucune, hormis la bibliothèque standard du langage.

## Commandes

Depuis la racine du dépôt :

```sh
pnpm --filter @quarter-bells/rules typecheck
pnpm test --project @quarter-bells/rules
```
