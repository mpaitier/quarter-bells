# 0010 - Faire jouer une épreuve avec un reducer

- Statut : Accepté
- Date : 2026-10-31

## Contexte

Le moteur doit faire jouer une épreuve complète : distribution, poses à tour de rôle, dépense des yeux, Résolution et conséquences sur les yeux bonus (issue #12). Plusieurs contraintes pèsent sur la forme de ce code :

- **Un serveur qui fait autorité.** Chaque commande d'un joueur est acceptée ou refusée, et une commande refusée ne doit rien changer ([cycle de vie d'une partie](../diagrams/game-state.md)).
- **La reconnexion.** Un joueur qui revient reçoit l'état complet de la partie (NF-REL-01) : l'état doit pouvoir être sauvegardé et renvoyé tel quel.
- **Un package pur** (NF-QUA-04), sans entrée/sortie ni hasard non maîtrisé. La seule dépendance d'exécution est TypeBox (ADR 0008).
- **Des épreuves rejouables dans un test**, à partir d'une graine et d'une suite de poses ([stratégie de tests](../testing.md)).

## Options envisagées

### Une classe Trial avec des méthodes

`trial.placeCard(...)` modifie l'objet en place. C'est la forme la plus familière.

Un refus en cours de méthode peut laisser l'objet à moitié modifié si une vérification arrive après une première écriture. Comparer l'état avant et après une action, ou le sauvegarder, demande de le copier ou de le sérialiser à la main, et les méthodes ne passent pas en JSON.

### Une bibliothèque de machines à états (XState)

Les états et les transitions sont déclarés, et la machine peut être visualisée.

Elle ajoute une dépendance au package pur, et une API à apprendre, pour une seule action aujourd'hui (poser une carte). Les règles du jeu resteraient de toute façon dans nos fonctions : la bibliothèque ne ferait que les appeler.

### Un reducer

L'épreuve est une donnée. Une fonction pure `applyTrialAction(trial, action)` renvoie soit une nouvelle épreuve, soit un refus, sans jamais modifier celle qu'elle reçoit. C'est le « reducer pattern » de Redux, sans Redux.

Un refus ne peut rien abîmer, puisque rien n'est modifié. L'état se sauvegarde et se compare tel quel. En contrepartie, chaque action doit recopier les parties qui changent, et ne jamais modifier les autres : aucun outil ne l'impose, seuls les tests le vérifient.

## Décision

Un reducer. `createTrial(setup)` distribue les cartes à partir de la graine et ouvre la Pose ; `applyTrialAction(trial, action)` renvoie `{ accepted: true, trial }` ou `{ accepted: false, rejection }`.

## Conséquences

- L'état ne contient que des données sérialisables en JSON, horloge comprise. Ce qui se déduit n'est pas stocké : le joueur dont c'est le tour vient du nombre de poses, les yeux disponibles des yeux dépensés.
- Un refus est un résultat, pas une exception. Sa raison est structurée (`notYourTurn`, `cardNotInHand`, `unknownSection`, `noEyeLeft`, `ruleViolation` avec ses violations, `trialOver`) et deviendra la `reason` de `CommandRejected`. Les exceptions restent réservées aux erreurs de l'appelant, comme une configuration d'épreuve incohérente.
- Les parties qui ne changent pas sont partagées entre l'ancienne et la nouvelle épreuve, pas copiées. Les tests gèlent l'état en profondeur (`deepFreeze`) pour prouver qu'une action ne le modifie pas.
- Le moteur couvre l'épreuve de la Distribution à la Résolution. L'annonce, la Discussion, la pause, les décisions de l'hôte et la progression du groupe restent au serveur, qui crée l'épreuve et reporte `bonusEyesAfter` dans la progression.
- Le premier joueur de l'ordre de passage reçoit la première carte de la distribution et pose en premier.
- La dernière pose déclenche la Résolution dans la même action : il n'existe pas d'état « toutes les cartes posées, pas encore résolue ».
- Le reducer ne produit pas d'événements (`CardPlayed`, `ReserveTaken`, `TrialResolved`). Le serveur les déduira de l'action et du résultat ; la forme exacte sera fixée avec le protocole, au J3.
- `EYES_PER_PLAYER` vaut 1 en attendant les parties de test (question ouverte des [règles du jeu](../game-rules.md)).
