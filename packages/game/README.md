# game

Moteur de partie : enchaînement des épreuves d'une run, de l'annonce de l'horloge à la fin du chapitre, et décisions de l'hôte après un échec ou une run perdue ([ADR 0015](../../docs/adr/0015-enchainer-les-epreuves-dans-un-paquet-game.md)).

Une épreuve elle-même, de la distribution à la Résolution, se joue dans [`packages/rules`](../rules/README.md). Ce paquet l'appelle et gère tout ce qui se passe entre deux épreuves.

Comme `rules`, ce package est pur. Il ne fait aucun accès réseau, disque ou base de données, ne lit pas l'heure système et ne tire pas de hasard sans graine fournie de l'extérieur. Le `package.json` déclare `"sideEffects": false` pour la même raison.

## Dépendances autorisées

`@quarter-bells/rules`, par son API publique uniquement.

## Commandes

Depuis la racine du dépôt :

```sh
pnpm --filter @quarter-bells/game typecheck
pnpm test --project @quarter-bells/game
```
