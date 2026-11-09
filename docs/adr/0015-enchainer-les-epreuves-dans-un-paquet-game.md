# 0015 - Enchaîner les épreuves dans un paquet game

- Statut : Accepté
- Date : 2026-11-09

## Contexte

Le reducer de l'[ADR 0010](0010-faire-jouer-une-epreuve-avec-un-reducer.md) fait jouer une épreuve, de la distribution à la Résolution. Tout ce qui l'entoure manque encore : l'annonce de l'horloge, la Discussion, les décisions après un échec ou une run perdue, le passage à l'horloge suivante et la fin de chapitre (issue #33). L'ADR 0010 confiait ces responsabilités au serveur.

Deux consommateurs en ont besoin, à deux moments différents :

- **le mode local du J2**, qui fait jouer le chapitre 1 dans le navigateur, sans serveur ([feuille de route](../roadmap.md)) ;
- **le serveur du J3**, qui fait autorité sur chaque commande ([cycle de vie d'une partie](../diagrams/game-state.md)).

Les contraintes de l'ADR 0010 s'appliquent toujours : un état sérialisable en JSON pour la reconnexion (NF-REL-01), du code pur (NF-QUA-04), des parties rejouables dans un test à partir d'une graine.

## Options envisagées

### Dans le serveur, comme le prévoyait l'ADR 0010

Le serveur n'existe pas encore. Le mode local devrait attendre le J3, ou réécrire l'enchaînement dans le client et le garder ensuite identique à celui du serveur. Deux implémentations des mêmes règles finissent par diverger, et chaque correction doit être faite deux fois.

### Dans `packages/rules`

Rien à créer, et le code est partagé d'office. Mais le paquet mélangerait deux choses qui n'évoluent pas au même rythme : les règles d'une épreuve changent avec le contenu (nouveaux types de règles, nouvelles horloges), l'enchaînement change avec le produit (décisions de l'hôte, mise en suspens, mode hors sauvegarde). Plus rien n'indiquerait où ranger une nouvelle fonction.

### Un nouveau paquet `packages/game`

Le code est partagé comme celui de `rules`, et la séparation se lit dans l'arborescence et dans les imports. Il faut configurer un paquet de plus et fixer une règle simple pour décider de ce qui va dans l'un ou dans l'autre.

## Décision

Un nouveau paquet `packages/game`, sur le modèle du reducer de l'ADR 0010 : `createGame(setup)` ouvre la partie, `applyGameAction(game, action)` renvoie `{ accepted: true, game }` ou `{ accepted: false, rejection }`.

Une seule règle sépare les deux paquets : ce qui se passe **pendant une épreuve**, de la distribution à la Résolution, appartient à `rules` ; ce qui se passe **entre deux épreuves** appartient à `game`. Le reducer d'épreuve reste dans `rules`, et `game` l'appelle.

## Conséquences

- Les règles de dépendance de l'[ADR 0002](0002-organiser-le-code-en-monorepo.md) sont complétées :
  - `packages/rules` ne dépend d'aucun autre paquet du dépôt ;
  - `packages/game` ne dépend que de `packages/rules` ;
  - `packages/protocol` peut dépendre de `packages/rules` et de `packages/game`, pour transporter l'état d'une partie sans en maintenir une copie ;
  - `apps/web` peut dépendre de `packages/game` pour le mode local.

  NF-QUA-04 s'étend à `game`. ESLint vérifiera ces règles comme il vérifie déjà l'isolation de `rules`.

- La conséquence de l'ADR 0010 qui laissait au serveur l'annonce, la Discussion et les décisions de l'hôte ne vaut plus : elles passent dans `game`. L'ADR 0001 interdit de modifier un ADR accepté, donc les ADR 0002 et 0010 restent tels quels ; l'[index de la documentation](../README.md) les signale comme complétés par celui-ci.
- La configuration d'une partie contient une seule graine. Celle de chaque épreuve en est dérivée, avec le nombre d'épreuves déjà jouées dans la partie. Une partie se rejoue donc à partir de sa graine et de la liste de ses actions, et une nouvelle tentative de la même horloge distribue d'autres mains. La graine dérivée doit rester une graine valide pour `createSeededRng`.
- `game` ne lit aucun fichier. La configuration fournit les chapitres et leurs horloges, déjà validées par `parseClock`.
- Entre deux épreuves, la partie garde le nombre de bougies bonus du groupe. Après une Résolution, ce nombre se lit dans `bonusCandlesAfter` de l'épreuve résolue, sans être recopié. `rules` décide de la remise à zéro après une réussite, `game` de celles qui suivent une décision de l'hôte.
- Chaque action porte le joueur qui l'envoie, et la configuration désigne l'hôte : le premier joueur de l'ordre de passage au J2, l'hôte de la salle au J3. La forme des actions reste la même d'un jalon à l'autre.
- Les refus forment une seule union : les raisons de refus d'une épreuve, plus celles de la partie (action envoyée dans la mauvaise phase, décision envoyée par un autre joueur que l'hôte…). Elles deviendront la `reason` de `CommandRejected`.
- Le serveur garde les salles, la présence des joueurs et la pause pour déconnexion, la sauvegarde de la progression, le tirage de la graine de partie, et les événements envoyés aux clients, qu'il déduira de l'action et du résultat comme pour l'épreuve.
- Au J2, le client web branche `game` derrière un adaptateur qui joue le rôle du serveur. L'écran de jeu ne connaît que l'état reçu, comme l'exige le critère de sortie du jalon.
- La mise en suspens (F-JEU-15) et le mode hors sauvegarde (F-JEU-23) arrivent au J4. Ce sont des décisions prises entre deux épreuves : elles iront dans `game`.
