# 0016 - Évaluer une pose depuis la vue d'un joueur

- Statut : Accepté
- Date : 2026-11-17

## Contexte

L'écran de pose (J2) doit signaler les sections interdites pendant la sélection (F-JEU-08), en appliquant la même exception que l'épreuve : quand le joueur n'a aucune pose entièrement permise, une pose refusée seulement par des bornes connues reste permise ([ADR 0011](0011-une-borne-connue-guide-sans-bloquer.md)). L'ADR 0011 annonce pour cela une fonction du moteur qui liste les poses permises d'un joueur, appelée par le client comme par l'épreuve.

Le client n'a pas l'état complet. Dans sa vue, une carte posée face cachée par un autre joueur n'a que sa famille ([modèle du domaine](../diagrams/domain-model.md), « Vue d'un joueur »). Or `evaluatePlacement` reçoit des `Placement`, qui exigent une valeur. L'[ADR 0009](0009-evaluer-une-pose-avant-de-l-accepter.md) a laissé ce point ouvert : passer un type de pose publique, ou une fonction qui ne reçoit que les informations publiques.

Les contraintes de pose ne lisent pourtant que des informations publiques. `firstPlacements` lit le rang et la section visée. Les bornes connues lisent la valeur d'une section seulement quand toutes ses cartes sont face visible (`knownValueAfter`). La candidate est une carte de la main du joueur, dont il connaît la valeur. Rien dans les règles n'a besoin de la valeur d'une carte cachée : c'est le type qui ne le dit pas.

## Options envisagées

### Fabriquer de faux placements côté client

Le client donne une valeur arbitraire (0 ou 1) aux cartes cachées des autres et appelle les fonctions existantes.

Aucun changement dans le moteur. Mais une valeur inventée qui se retrouve dans un calcul de somme passe inaperçue : le jour où une règle lit la valeur sans vérifier la face, le client affiche un résultat faux et aucun test ne le voit. On compte sur la discipline plutôt que sur le compilateur.

### Une fonction dédiée aux informations publiques

Une seconde fonction reçoit des données réduites (sections, faces, sommes visibles) et réimplémente les vérifications de la Pose pour le client.

Le type est honnête, mais la logique des règles existe deux fois. Le serveur et le client peuvent diverger, et c'est précisément ce que l'ADR 0009 voulait éviter en leur faisant appeler la même fonction.

### Un type de pose publique accepté par les fonctions de la Pose

`PublicPlacement` est une union discriminée sur `faceUp` : une carte face visible porte famille et valeur, une carte face cachée ne porte que sa famille. `evaluatePlacement` et les vérifications qu'il appelle reçoivent `readonly PublicPlacement[]` pour la pose déjà faite. La candidate reste un `Placement` complet.

Un `Placement` complet est compatible avec `PublicPlacement` : le serveur passe son état tel quel. Le compilateur refuse de lire `value` sur une carte dont on n'a pas vérifié la face, donc une future règle qui lirait une information cachée ne compilerait pas. Le changement élargit seulement le type d'un paramètre : aucun appelant existant n'est cassé.

## Décision

Un type de pose publique, `PublicPlacement`, accepté par toutes les fonctions de la Pose. La fonction qui liste les poses permises, `listPlacementOptions(clock, placements, hand)`, reçoit la pose publique et la main du joueur, et elle est la seule à porter l'exception de l'ADR 0011. `applyTrialAction` l'appelle au lieu de la réécrire.

## Conséquences

- La règle « pendant la Pose, on ne lit que des informations publiques » est vérifiée par le compilateur, plus seulement par la relecture.
- `PublicPlacement` vit dans `packages/rules`, à côté de `Placement`, parce que les fonctions du moteur le consomment. La vue d'un joueur décrite dans `packages/protocol` devra s'y conformer pour ses cartes posées.
- `PublicPlacement` n'a pas de schéma TypeBox. Le protocole en écrira un s'il doit valider une vue reçue du réseau.
- Une option ne précise pas la face. La face ne change pas l'évaluation, et poser face visible ne dépend que des bougies restantes, que le client lit avec `availableCandles`.
- Une pose permise par l'exception garde ses violations dans l'option. Le client peut prévenir le joueur que l'épreuve échouera à la Résolution.
- `applyTrialAction` évalue maintenant toutes les poses du joueur à chaque action (au plus 4 cartes sur 6 sections), là où il n'en évaluait qu'une dans le cas courant. Sur quelques règles par horloge, le coût est négligeable ; s'il devenait mesurable, l'optimisation se ferait dans `listPlacementOptions` sans toucher à son contrat.
