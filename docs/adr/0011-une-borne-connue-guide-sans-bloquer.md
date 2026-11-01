# 0011 - Une borne connue guide sans bloquer

- Statut : Accepté
- Date : 2026-11-01

## Contexte

F-JEU-21 ajoute au jeu de plateau une aide : quand la valeur d'une section est connue (toutes ses cartes face visible, ou section vide), une pose qui ferait dépasser une borne haute de cette section est refusée ([ADR 0009](0009-evaluer-une-pose-avant-de-l-accepter.md), « Bornes hautes connues » dans le [catalogue](../rule-catalog.md)). Le joueur connaît la valeur de sa propre carte même posée face cachée.

Les tests de propriétés de l'issue #14 jouent des épreuves complètes sur des horloges générées. Ils ont montré qu'une épreuve peut se bloquer : le joueur dont c'est le tour n'a plus aucune pose acceptée, l'épreuve ne peut ni réussir ni échouer. Le serveur attendrait alors indéfiniment une pose qu'il refuse à chaque fois.

Le blocage ne demande pas une horloge absurde. Une horloge avec le plafond général de 24 et la 3e pose imposée en section 1, sans aucune autre règle, suffit. Avec la graine 6 à 3 joueurs, ana puis ben posent face visible leur 11 et leur 10 en section 1, qui vaut alors 21 aux yeux de tous. cleo doit poser la 3e carte en section 1, et ses cartes (5, 6, 9, 11) dépassent toutes 24. La section 1 refuse chacune par la borne connue, les autres sections par la pose imposée. La suite de coups est légale, et un joueur pourrait même la jouer exprès pour bloquer la table. Les horloges du chapitre 1 y échappent parce que le plafond y est levé. À partir du chapitre 2, toute pose imposée après la 2e carte y est exposée.

Le jeu de plateau ne connaît pas ce blocage : il ne refuse jamais une pose. Le problème vient de l'aide.

Deux causes de blocage sont traitées au chargement, et cet ADR ne les concerne pas :

- un même rang imposé à deux sections, qui rend l'horloge injouable par construction ;
- une borne de valeur (`maxSum`, `sumInRange`) sur une section qui impose une pose. C'est une règle de conception du jeu, la fausse difficulté est exclue ([format des horloges](../clock-format.md)).

Le plafond général de 24 et un `maxSum` au niveau de l'horloge s'appliquent à toutes les sections, y compris à celles qui imposent une pose. Le chargement ne peut pas les écarter.

## Options envisagées

### Refuser davantage d'horloges au chargement

`parseClock` refuserait toute horloge où une pose imposée peut rencontrer une borne connue.

Le plafond général s'applique partout dès le chapitre 2 : il faudrait interdire les poses imposées sur toutes ces horloges, ou les limiter aux deux premiers rangs. Le blocage dépend aussi de ce que les joueurs posent face visible, pas seulement de l'horloge. Une combinaison oubliée, aujourd'hui ou avec un futur type de règle, passerait.

### Échec anticipé

Quand le joueur dont c'est le tour n'a aucune pose permise, l'épreuve est résolue en échec immédiatement.

Le blocage disparaît, mais l'épreuve se termine avant que toutes les cartes soient posées. Le rapport de Résolution porterait sur une pose incomplète, et le client devrait gérer une transition de plus. Pour les joueurs, l'épreuve s'arrête sans qu'ils aient joué.

### Une borne connue guide sans bloquer

Une pose refusée seulement par des bornes hautes connues est acceptée quand le joueur n'a aucune pose entièrement permise. La borne franchie fera échouer l'épreuve à la Résolution. Les contraintes de pose (`firstPlacements`) restent strictes.

Le joueur peut toujours poser : une pose face cachée ne dépense pas d'œil, et une fois le rang en double refusé au chargement, chaque rang imposé l'est sur une seule section. L'épreuve va jusqu'au bout et se résout normalement. Le prix : quand l'exception joue, le moteur essaie les poses possibles du joueur (au plus 4 cartes sur 6 sections).

## Décision

Une borne connue guide sans bloquer. `applyTrialAction` accepte une pose dont toutes les violations sont des bornes hautes connues quand aucune carte de la main du joueur ne peut être posée sans violation. `evaluatePlacement` ne change pas.

## Conséquences

- Une épreuve jouée jusqu'au bout se termine toujours par une réussite ou un échec. Un test de propriétés le vérifie sur des horloges générées (issue #14).
- `isKnownBoundViolation` classe chaque type de violation, avec un `switch` exhaustif : un nouveau type de règle doit déclarer s'il peut céder. Une future contrainte de pose (`familyOnly`, `faceUpForbidden`) ne cédera pas.
- Le client qui signale les sections interdites (F-JEU-08) devra appliquer la même exception : si toutes les poses du joueur sont refusées par des bornes connues seulement, aucune section ne doit apparaître interdite pour cette raison. Une fonction du moteur qui liste les poses permises d'un joueur évitera de dupliquer la règle. Elle sera écrite avec l'écran de jeu (J2).
- Une pose acceptée de cette façon ne porte aucune marque dans le résultat. Le client peut la reconnaître (la pose aurait des violations), et le joueur verra l'échec à la Résolution.
- F-JEU-21 est une aide. Si elle devient désactivable par une option de salle (piste de la roadmap), les bornes connues ne seront plus vérifiées pendant la Pose dans ce mode, et cette exception n'aura plus lieu de jouer.
