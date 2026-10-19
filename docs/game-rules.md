# Règles du jeu

Règles de Quarter Bells telles qu'elles sont implémentées. Ce document fait référence : en cas de doute, c'est lui qui tranche, et toute différence avec le code est un bug de l'un ou de l'autre.

Les écarts volontaires avec le jeu de société dont le projet s'inspire sont signalés par la mention **Choix de design**.

## But du jeu

De 2 à 4 joueurs coopèrent pour réussir des épreuves. Le jeu ne se joue pas seul. Une épreuve consiste à poser 12 cartes autour d'une horloge de façon à respecter les règles générales et les règles propres à cette horloge. Le groupe gagne ou perd ensemble.

Le jeu comporte 10 chapitres de 4 horloges, de difficulté croissante.

## Matériel

- 24 cartes : 12 de la famille Instant et 12 de la famille Éternité, numérotées de 1 à 12 dans chaque famille.

Les deux familles se distinguent par leur couleur (ambre pour Instant, violet pour Éternité) et par leur symbole (un éclair pour Instant, le signe infini pour Éternité). Le symbole suffit à les distinguer sans la couleur.

- Des horloges de 6 sections, chacune avec ses règles propres.

## Mise en place d'une épreuve

Le nombre d'yeux disponibles est fixé : yeux de base, plus les yeux bonus gagnés.

Les yeux de base sont proportionnels au nombre de joueurs : `yeux de base = nombre de joueurs × yeux par joueur`.

> **À définir** : valeur de `yeux par joueur` (1 par défaut, à ajuster en playtest).

### Options de la salle

À la création de la salle, l'hôte peut durcir la partie :

| Option                 | Effet                                               | Valeur par défaut |
| ---------------------- | --------------------------------------------------- | ----------------- |
| Plafond d'yeux de base | Les yeux de base ne dépassent pas cette valeur.     | aucun plafond     |
| Yeux bonus maximum     | Nombre maximum d'yeux bonus, de 0 (désactivés) à 3. | 3                 |

Avec un maximum de yeux bonus réduit, la run est perdue dès qu'un échec survient alors que ce maximum est atteint.

## Déroulement d'une épreuve

### Annonce

Le chapitre, le numéro d'horloge et les règles de l'horloge sont présentés à tous.

### Choix de l'ordre de passage

Au début de la partie uniquement, le groupe fixe l'ordre dans lequel les joueurs poseront leurs cartes. Chaque position est attribuée en désignant un joueur ou en laissant le hasard choisir. L'ordre reste le même pour toutes les épreuves de la partie.

> **Choix de design.** Dans le jeu original, n'importe quel joueur peut poser la première carte, puis le tour passe au voisin de gauche. L'hésitation avant la première pose fait partie du jeu et transmet de l'information. Fixer l'ordre à l'avance supprime cette mécanique, mais évite d'avoir à gérer en ligne une course pour poser en premier.

### Phase de Discussion

Les cartes ne sont pas encore distribuées. Les joueurs ne connaissent que les règles de l'horloge.

Ils discutent librement de leur stratégie. Ils n'ont pas le droit de convenir de codes sans lien avec les actions de jeu (« si je pose vite, c'est un 12 »).

À partir du chapitre 3, la section de départ n'est plus imposée par l'horloge : les joueurs la choisissent pendant la Discussion, et l'hôte la valide. Changer la section de départ remet à zéro les statuts « prêt ».

Chaque joueur se déclare prêt quand il a fini. Un joueur prêt peut annuler tant que tous ne le sont pas. Quand tous les joueurs sont prêts, la Discussion se termine.

> **Choix de design.** Dans le jeu original, les cartes sont distribuées avant la Discussion et leur dos est visible de tous : chacun sait combien de cartes de chaque famille possèdent les autres, et peut en tenir compte dans la stratégie, notamment pour les règles portant sur les familles. Ici, la distribution a lieu après la Discussion. La stratégie doit donc rester générale, ce qui rend le jeu plus difficile. Ce choix est à confirmer par des parties de test, en particulier sur les horloges qui imposent une famille.

### Distribution

1. Les 24 cartes sont mélangées.
2. 12 cartes sont distribuées selon le nombre de joueurs :

   | Joueurs | Distribution                                        |
   | ------- | --------------------------------------------------- |
   | 2       | 6 cartes chacun : une main de 4 et une réserve de 2 |
   | 3       | 4 cartes chacun                                     |
   | 4       | 3 cartes chacun                                     |

3. Les 12 cartes restantes ne sont pas utilisées.

Chaque joueur voit la famille et la valeur des cartes de sa main. Il voit le dos des cartes des autres, donc leur famille, sans leur valeur.

En partie à 2, la réserve reste cachée, valeur comprise, jusqu'à ce qu'elle rejoigne la main.

### Phase de Pose

Toute communication est interdite.

Les joueurs jouent dans l'ordre de passage. À son tour, un joueur choisit une carte de sa main et la pose devant l'une des 6 sections, quel que soit le nombre de cartes déjà présentes.

La carte est posée face cachée par défaut. Le joueur peut dépenser un œil pour la poser face visible : sa valeur est alors connue de tous. Les yeux sont communs au groupe.

Une pose qui viole une contrainte de pose de l'horloge est refusée, et le joueur doit choisir une autre carte ou une autre section. Les contraintes de pose portent sur des informations publiques (famille, rang de pose, nombre de cartes).

Les conditions sur les valeurs ne sont évaluées qu'à la Résolution, avec une exception : quand toutes les cartes déjà posées devant une section sont face visible, leur somme est connue de tous. Une pose qui ferait alors dépasser une borne haute de cette section (le plafond de 24 ou le maximum d'une règle de plage) est refusée, que la nouvelle carte soit posée face visible ou cachée. Par exemple, sur une section qui doit rester entre 12 et 18 et qui porte un 10 visible, poser un 9 est refusé. Si au moins une carte de la section est face cachée, y compris une carte que le joueur a posée lui-même, aucune limite n'est appliquée. Les bornes basses ne sont jamais vérifiées pendant la Pose, puisque d'autres cartes peuvent encore être ajoutées.

Si le guide est activé dans ses paramètres, le joueur dont la pose est refusée voit la règle concernée mise en avant et les cartes de sa main qui la respectent. Les autres joueurs ne voient rien de ce refus.

À tout moment, un joueur peut revoir la valeur des cartes qu'il a lui-même posées face cachée. Il ne peut pas voir celles des autres.

En partie à 2, quand chaque joueur a posé 2 cartes, chacun ajoute sa réserve à sa main.

La phase se termine quand toutes les cartes ont été posées.

Si le joueur dont c'est le tour est déconnecté, la partie est mise en pause pour tous, avec un message qui indique quel joueur est absent. Elle reprend à son retour. Pendant la pause, l'hôte peut sauvegarder et arrêter la partie.

### Phase de Résolution

Les cartes sont révélées section par section, en partant de la section de départ et dans le sens horaire. La valeur de chaque section est la somme des cartes posées devant elle.

L'épreuve est réussie si toutes les conditions suivantes sont remplies :

1. Chaque section a au moins une carte.
2. En partant de la section de départ et dans le sens horaire, la valeur de chaque section est supérieure ou égale à celle de la précédente.
3. Aucune section ne dépasse 24, sauf si l'horloge supprime ce plafond.
4. Toutes les conditions de réussite propres à l'horloge sont remplies.

## Après une épreuve

Les décisions de cette section (continuer, retenter, mettre en suspens, arrêter) appartiennent à l'hôte.

### En cas de réussite

- Les yeux bonus sont remis à zéro.
- Le groupe passe à l'horloge suivante.
- Après la 4e horloge d'un chapitre, un message félicite le groupe et annonce le chapitre suivant. Chaque joueur se déclare prêt pour lancer la première horloge du nouveau chapitre.

### En cas d'échec

- Si le groupe avait moins de 3 yeux bonus, il en gagne un.
- Si le groupe avait déjà 3 yeux bonus, la run est perdue. L'hôte choisit alors entre retenter l'horloge, recommencer le chapitre en cours depuis sa première horloge, ou mettre fin à la progression du groupe. Retenter et recommencer consomment un jeton de relance (voir ci-dessous).
- Sinon, l'hôte choisit entre retenter l'horloge et la mettre en suspens.
- Retenter relance une nouvelle épreuve sur la même horloge, avec une nouvelle distribution.
- Mettre en suspens remet les yeux bonus à zéro et passe à l'horloge suivante. L'horloge pourra être retentée plus tard.

> **Choix de design.** Dans le jeu original, les yeux bonus plafonnent à 3 et le groupe peut retenter indéfiniment. Ici, un échec avec 3 yeux bonus met fin à la run.

L'hôte peut aussi mettre une horloge en suspens avant de l'avoir tentée.

### Horloges en suspens

Au début de chaque partie, les horloges en suspens sont proposées avant l'horloge en cours, dans l'ordre choisi par l'hôte. Une horloge en suspens réussie en sort définitivement.

### Jetons de relance

Après une run perdue, retenter l'horloge ou recommencer le chapitre coûte un jeton de relance. Le groupe en gagne régulièrement en progressant, par exemple un tous les deux chapitres terminés. Sans jeton, la seule option est de mettre fin à la progression.

> **À définir** : nombre de jetons au départ et rythme de gain. Ces valeurs sont des paramètres de configuration, à ajuster après les parties de test.

## Comptes

Un joueur peut créer un compte avec une adresse e-mail ou un compte Google. Le profil (nom, icône) et le chapitre maximum atteint sont rattachés au compte.

Un joueur peut aussi jouer en invité, sans compte. Une salle qui compte au moins un invité ne sauvegarde aucune progression, et ses parties commencent toujours au chapitre 1, sans choix possible.

## Progression

La progression (chapitre et horloge en cours, horloges en suspens, yeux bonus) appartient au groupe, c'est-à-dire à la salle. Pour reprendre une progression, la salle doit réunir exactement les mêmes joueurs. Si un joueur rejoint le groupe, une nouvelle progression commence, au chapitre 1 ou au chapitre choisi par l'hôte dans la limite décrite ci-dessous.

Chaque joueur conserve aussi le chapitre le plus avancé qu'il a atteint, toutes salles confondues. Au lancement d'une partie, l'hôte peut choisir le chapitre de départ, jusqu'au plus petit de ces maximums parmi les joueurs présents. Par exemple, si trois joueurs ont atteint les chapitres 7, 2 et 5, l'hôte peut choisir entre les chapitres 1 et 2.

## Fin du jeu

Le jeu est terminé quand les 40 horloges ont été réussies.

> **À définir** : épreuve finale éventuelle après la dernière horloge.

## Questions ouvertes

- Après une run perdue, les yeux bonus restent-ils à 3 si l'hôte retente l'horloge ?
- Combien de jetons de relance au départ, et à quel rythme le groupe en gagne-t-il ?
- Les horloges en suspens comptent-elles comme atteintes pour le chapitre maximum d'un joueur ?
