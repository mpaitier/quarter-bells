# 0009 - Évaluer une pose avant de l'accepter

- Statut : Accepté
- Date : 2026-10-31

## Contexte

Le [catalogue des règles](../rule-catalog.md) distingue deux moments d'évaluation. Les contraintes de pose sont vérifiées à chaque pose, et une pose qui en viole une est refusée. Les conditions de réussite sont vérifiées à la Résolution, sur toutes les cartes. `firstPlacements` est la première contrainte de pose implémentée. D'autres suivront : les bornes hautes connues (F-JEU-21) donneront à `maxSum` et à `sumInRange` une évaluation à chacun des deux moments.

La nature d'une règle n'est pas écrite dans l'horloge : elle découle de son type ([format des horloges](../clock-format.md)). Le code doit donc la porter quelque part, et un nouveau type de règle ne doit pas pouvoir oublier de la déclarer.

Deux appelants ont besoin de l'évaluation pendant la Pose :

- le serveur, qui fait autorité, refuse la pose et renvoie la violation dans `CommandRejected` ([protocole](../protocol.md)) ;
- le client signale les sections interdites pendant la sélection (F-JEU-08) et guide le joueur après un refus (F-JEU-20).

## Options envisagées

### Une table des natures

Un objet associe à chaque `kind` sa nature (`placementConstraint` ou `resolutionCondition`), et une fonction unique choisit quoi évaluer selon le moment demandé.

La table ne dit que si une règle est évaluée, pas comment : il faut quand même un aiguillage vers la bonne fonction. Elle doit aussi accepter deux natures pour `maxSum` et `sumInRange`. On maintient alors deux structures (la table et l'aiguillage) qui peuvent se contredire.

### Des objets règle avec une méthode par moment

Chaque type de règle devient une classe avec `atPlacement()` et `atResolution()`, et le moteur appelle la méthode sans connaître le type.

Les horloges sont des données JSON validées par TypeBox, et leur type est dérivé du schéma (ADR 0008). Il faudrait convertir chaque règle en instance de classe après le chargement, et garder deux représentations de la même règle. Une future version Dart du moteur (ADR 0003) devrait reproduire la hiérarchie de classes, alors que les cas de test JSON ne décrivent que des données.

### Un point d'entrée par moment, avec un switch exhaustif

`evaluatePlacement` évalue une pose proposée. L'évaluation de la Résolution aura son propre point d'entrée. Chacun aiguille sur le `kind` avec un `switch` sans `default`, et la règle de lint `switch-exhaustiveness-check` refuse tout `kind` non traité. La nature d'un type se lit dans les `case` : un type qui n'a rien à vérifier à un moment donné y a quand même son `case`, qui ne renvoie rien.

Les règles restent des données. Ajouter un type oblige à le classer à chaque moment, sinon le lint échoue. En contrepartie, chaque point d'entrée liste explicitement les types sans évaluation à ce moment-là.

## Décision

Un point d'entrée par moment d'évaluation, chacun avec un `switch` exhaustif sur le `kind`. Pendant la Pose : `evaluatePlacement(clock, placements, candidate)`, fonction pure qui renvoie toutes les violations, triées par règle puis par section. Une liste vide signifie que la pose est acceptée.

## Conséquences

- La pose proposée n'a pas de champ de rang : son rang est la longueur de la pose déjà faite, puisque les placements sont rangés dans l'ordre des poses.
- `evaluatePlacement` ne vérifie ni le tour, ni la main du joueur, ni la phase. C'est le rôle de l'épreuve, qui l'appelle avant d'ajouter la pose.
- Une pose refusée n'entre jamais dans la pose. Une contrainte de pose pure comme `firstPlacements` n'a donc pas d'évaluation à la Résolution.
- Le serveur et le client appellent la même fonction. Pour F-JEU-08, le client l'appelle une fois par section avec la carte sélectionnée : six appels sur quelques règles, un coût négligeable.
- Côté client, la vue d'un joueur ne contient pas la valeur des cartes cachées des autres ([modèle du domaine](../diagrams/domain-model.md), « Vue d'un joueur »), alors que `Placement` exige une valeur. Les contraintes de pose ne lisent que des informations publiques, mais le type ne le traduit pas encore. La façon de les appeler depuis la vue (type de pose publique, ou fonction qui ne reçoit que les informations publiques) sera tranchée au J2 avec l'écran de jeu. D'ici là, seul le serveur a les données complètes.
- `evaluatePlacement` renvoie une liste, alors que `CommandRejected` ne prévoit qu'une `violation`. Le protocole devra choisir entre envoyer la première (l'ordre est stable) et passer à une liste.
- Une horloge où deux sections exigent le même rang ne peut pas être jouée : toute pose de ce rang est refusée quelque part. `parseClock` ne le détecte pas encore.
