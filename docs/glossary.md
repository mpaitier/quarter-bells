# Glossaire

Vocabulaire du domaine. Le même terme est utilisé partout : règles, diagrammes, code, interface. La colonne « Code » donne le nom à utiliser dans le code source.

> Les termes marqués _(provisoire)_ sont à valider. Le projet étant une version inspirée, aucun terme propre au jeu original ne doit être repris.

## Matériel

| Terme                | Code                  | Définition                                                                                                                                                     |
| -------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Carte                | `Card`                | Carte numérotée de 1 à 12, appartenant à une famille. Le jeu en compte 24.                                                                                     |
| Famille              | `CardFamily`          | L'une des deux catégories de cartes, identifiable par sa couleur et son icône.                                                                                 |
| Instant              | `"instant"`           | Famille de 12 cartes. Couleur ambre, symbole éclair.                                                                                                           |
| Éternité             | `"eternity"`          | Famille de 12 cartes. Couleur violette, symbole infini.                                                                                                        |
| Valeur               | `value`               | Nombre inscrit sur une carte, de 1 à 12.                                                                                                                       |
| Dos                  | —                     | Face cachée d'une carte. Il montre la famille mais pas la valeur.                                                                                              |
| Main                 | `Hand`                | Cartes qu'un joueur détient et n'a pas encore posées.                                                                                                          |
| Réserve              | `Reserve`             | En partie à 2, lot de 2 cartes mis de côté face cachée et ajouté à la main en cours de pose.                                                                   |
| Horloge              | `Clock`               | Plateau d'une épreuve, composé de 6 sections et éventuellement d'une règle centrale.                                                                           |
| Section              | `Section`             | L'une des 6 zones d'une horloge, devant laquelle on pose des cartes. Indexée de 0 à 5.                                                                         |
| Section de départ    | `startSection`        | Section à partir de laquelle on vérifie l'ordre croissant et on révèle les cartes. Section 0 par défaut.                                                       |
| Valeur d'une section | `sectionSum`          | Somme des valeurs des cartes posées devant une section.                                                                                                        |
| Aiguille             | `Pointer`             | Élément visuel qui parcourt les sections pendant la résolution. Ne pas la nommer `Hand` (traduction littérale) : le terme est déjà pris par la main du joueur. |

## Règles

| Terme                 | Code                  | Définition                                                                                                                           |
| --------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Règle                 | `Rule`                | Contrainte propre à une horloge. Elle s'applique à une section ou à toute l'horloge.                                                 |
| Règle de section      | `SectionRule`         | Règle qui ne concerne qu'une section.                                                                                                |
| Règle centrale        | `ClockRule`           | Règle qui concerne toute l'horloge.                                                                                                  |
| Contrainte de pose    | `PlacementConstraint` | Règle vérifiée au moment où une carte est posée. Une pose qui la viole est refusée. Ne porte que sur des informations publiques.     |
| Violation             | `RuleViolation`       | Description structurée d'une règle non respectée : type, section, paramètres.                                                        |
| Condition de réussite | `ResolutionCondition` | Règle vérifiée à la résolution. Si elle n'est pas remplie, l'épreuve échoue.                                                         |
| Règles générales      | `BaseRules`           | Conditions communes à toutes les épreuves : chaque section a au moins une carte, les valeurs sont croissantes, aucune ne dépasse 24. |
| Plafond               | `maxSectionSum`       | Valeur maximale d'une section, 24 par défaut. Certaines horloges la suppriment.                                                      |

## Déroulement

| Terme            | Code               | Définition                                                                                                                   |
| ---------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Partie           | `GameSession`      | Période de jeu continue d'un groupe, du lancement jusqu'à l'arrêt. Une partie enchaîne plusieurs épreuves.                   |
| Épreuve          | `Trial`            | Tentative de réussir une horloge. Une épreuve ratée peut être retentée : chaque nouvelle tentative est une nouvelle épreuve. |
| Phase            | `Phase`            | Étape d'une épreuve : Discussion, Distribution, Pose, Résolution.                                                            |
| Discussion       | `Phase.discussion` | Phase où les joueurs élaborent leur stratégie avant la distribution des cartes.                                              |
| Distribution     | `Phase.dealing`    | Phase où les cartes sont mélangées et distribuées. Chaque joueur découvre sa main.                                           |
| Pose             | `Phase.placement`  | Phase silencieuse où chaque joueur pose ses cartes à tour de rôle.                                                           |
| Résolution       | `Phase.resolution` | Phase où les cartes sont révélées et où l'épreuve est déclarée réussie ou ratée.                                             |
| Ordre de passage | `turnOrder`        | Ordre dans lequel les joueurs posent leurs cartes, fixé par vote en début de partie.                                         |
| Tour             | `Turn`             | Moment où un joueur doit poser une carte.                                                                                    |
| Pose d'une carte | `Placement`        | Une carte posée devant une section, face visible ou cachée, par un joueur, à un rang donné.                                  |
| Rang de pose     | `placementIndex`   | Position d'une pose dans l'ordre global des poses de l'épreuve (0 pour la première).                                         |

## Yeux

| Terme            | Code            | Définition                                                                                                                                                                    |
| ---------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Œil              | `Eye`           | Ressource collective qui permet de poser une carte face visible.                                                                                                              |
| Yeux de base     | `baseEyes`      | Nombre d'yeux disponible à chaque épreuve, proportionnel au nombre de joueurs et plafonnable par l'hôte.                                                                      |
| Options de salle | `LobbySettings` | Réglages de difficulté choisis par l'hôte à la création de la salle.                                                                                                          |
| Œil bonus        | `bonusEye`      | Œil supplémentaire gagné après un échec, 3 au maximum. Un échec avec 3 yeux bonus met fin à la run. Remis à zéro après une réussite ou quand une horloge est mise en suspens. |

## Progression

| Terme                             | Code                | Définition                                                                                                      |
| --------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------- |
| Chapitre                          | `Chapter`           | Groupe de 4 horloges de difficulté croissante. Le jeu en compte 10.                                             |
| Groupe                            | `Group`             | Ensemble de joueurs qui partagent une progression.                                                              |
| Progression                       | `Progress`          | Chapitre et horloge en cours d'un groupe, plus ses horloges en suspens.                                         |
| Invité                            | `guest`             | Joueur sans compte. Sa présence dans une salle désactive la sauvegarde de la progression.                       |
| Jeton de relance                  | `retryToken`        | Ressource du groupe qui permet de retenter une horloge ou de recommencer un chapitre après une run perdue.      |
| Run                               | `Run`               | Progression d'un groupe depuis son chapitre de départ. Elle prend fin quand le groupe échoue avec 3 yeux bonus. |
| Chapitre maximum                  | `maxChapterReached` | Chapitre le plus avancé atteint par un joueur, toutes salles confondues.                                        |
| Horloge en suspens _(provisoire)_ | `suspendedClocks`   | Horloge sautée par le groupe, qu'il pourra retenter plus tard.                                                  |

## Plateforme

| Terme                    | Code            | Définition                                                                                                 |
| ------------------------ | --------------- | ---------------------------------------------------------------------------------------------------------- |
| Joueur                   | `Player`        | Personne identifiée par un profil (nom et icône).                                                          |
| Profil                   | `Profile`       | Nom et icône d'un joueur, conservés sur son appareil et sur le serveur.                                    |
| Salle                    | `Lobby`         | Espace où les joueurs se réunissent avant une partie. Identifiée par un code.                              |
| Code de salle            | `lobbyCode`     | Code court partagé pour rejoindre une salle.                                                               |
| Hôte                     | `host`          | Joueur qui administre la salle et prend les décisions entre les épreuves. Le rôle est transféré s'il part. |
| Guidage                  | `guidance`      | Aide visuelle montrée au seul joueur dont la pose est refusée. Désactivable.                               |
| Vérification de présence | `PresenceCheck` | Demande faite à tous les joueurs de confirmer leur présence après une période d'inactivité.                |
| Commande                 | `Command`       | Message envoyé par un client pour demander une action.                                                     |
| Événement                | `Event`         | Message diffusé par le serveur pour signaler un fait accompli.                                             |
