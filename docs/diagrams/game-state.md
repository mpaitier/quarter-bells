# Cycle de vie d'une partie

Machine à états de la partie côté serveur. Chaque état répond à la question « la partie est actuellement… ». Les transitions sont étiquetées par l'événement qui les déclenche, avec une garde entre crochets quand une condition s'applique.

Les décisions après une épreuve (continuer, retenter, mettre en suspens, arrêter) sont des commandes réservées à l'hôte.

```mermaid
stateDiagram-v2
    [*] --> SessionSetup : partie lancée

    state SessionSetup {
        [*] --> ChapterSelection
        ChapterSelection --> TurnOrderSelection : chapitre validé par l'hôte
        TurnOrderSelection --> [*] : ordre validé
    }

    SessionSetup --> Announcing

    Announcing --> Discussion : annonce terminée
    Announcing --> Announcing : mettre en suspens avant de jouer

    state Discussion {
        [*] --> WaitingForReady
        WaitingForReady --> WaitingForReady : joueur prêt / pas prêt [pas tous prêts]
        WaitingForReady --> WaitingForReady : section de départ choisie [chapitre 3 ou plus]
    }

    Discussion --> Dealing : joueur prêt [tous prêts]
    Dealing --> Placement : cartes distribuées

    state Placement {
        [*] --> AwaitingCard
        AwaitingCard --> AwaitingCard : carte posée [cartes restantes]
        AwaitingCard --> ReserveTaken : carte posée [2 joueurs et 4 cartes posées]
        ReserveTaken --> AwaitingCard
        AwaitingCard --> Paused : joueur actif déconnecté
        Paused --> AwaitingCard : joueur actif reconnecté
    }

    Placement --> Ended : sauvegarder et arrêter [en pause]

    Placement --> Succeeded : dernière carte posée [conditions remplies]
    Placement --> Failed : dernière carte posée [condition non remplie et moins de 3 yeux bonus]
    Placement --> RunLost : dernière carte posée [condition non remplie et 3 yeux bonus]

    Succeeded --> Announcing : continuer [horloge suivante dans le chapitre]
    Succeeded --> ChapterCompleted : [4e horloge du chapitre réussie]
    Succeeded --> Completed : [dernière horloge du jeu réussie]

    state ChapterCompleted {
        [*] --> WaitingForReadyNext
        WaitingForReadyNext --> WaitingForReadyNext : joueur prêt / pas prêt [pas tous prêts]
    }

    ChapterCompleted --> Announcing : joueur prêt [tous prêts]

    Failed --> Announcing : retenter
    Failed --> Announcing : mettre en suspens

    Succeeded --> Ended : arrêter
    Failed --> Ended : arrêter
    ChapterCompleted --> Ended : arrêter

    RunLost --> Announcing : retenter l'horloge
    RunLost --> Announcing : recommencer le chapitre
    RunLost --> [*] : mettre fin à la progression
    Completed --> [*]
    Ended --> [*]
```

## Effets attachés aux transitions

| Transition                    | Effets                                                                                                                               |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Vers `ChapterSelection`       | Calcul du chapitre maximum autorisé : le plus petit des chapitres maximum atteints par les joueurs présents.                         |
| Vers `Announcing`             | Calcul des yeux disponibles. Statuts « prêt » remis à zéro. Section de départ fixée par l'horloge jusqu'au chapitre 2.               |
| `section de départ choisie`   | Section de départ enregistrée dans l'épreuve. Statuts « prêt » remis à zéro.                                                         |
| Vers `Dealing`                | Mélange avec une graine, distribution selon le nombre de joueurs. Chaque joueur reçoit sa main, et la famille des cartes des autres. |
| Vers `Placement`              | Le tour passe au premier joueur de l'ordre de passage.                                                                               |
| `carte posée`                 | Validation des contraintes de pose, décompte de l'œil si face visible, passage au joueur suivant.                                    |
| Vers `ReserveTaken`           | En partie à 2, chaque joueur reçoit la valeur de sa réserve.                                                                         |
| Vers `Paused`                 | Message à tous indiquant le joueur absent.                                                                                           |
| Vers `Succeeded`              | Yeux bonus remis à zéro, progression sauvegardée, chapitre maximum des joueurs mis à jour.                                           |
| Vers `Failed`                 | Un œil bonus gagné.                                                                                                                  |
| Vers `RunLost`                | L'hôte choisit la suite.                                                                                                             |
| `recommencer le chapitre`     | Retour à la première horloge du chapitre, yeux bonus remis à zéro.                                                                   |
| `mettre fin à la progression` | Progression du groupe supprimée.                                                                                                     |
| `mettre en suspens`           | Horloge ajoutée aux horloges en suspens, yeux bonus remis à zéro, progression sauvegardée.                                           |
| Vers `Ended`                  | Progression sauvegardée.                                                                                                             |

## Ce que ce diagramme ne montre pas

- **Les commandes refusées.** Une commande invalide dans l'état courant (poser une carte pendant la Discussion, une décision d'hôte envoyée par un autre joueur) est rejetée sans changer l'état.
- **La présence des joueurs.** Les vérifications d'inactivité sont gérées au niveau de la salle (voir [le cycle de vie d'une salle](lobby-state.md)).
- **La Résolution.** Côté serveur, elle est instantanée : la dernière carte posée déclenche l'évaluation et le passage direct à `Succeeded`, `Failed` ou `RunLost`. La révélation section par section n'est qu'une animation du client.
- **Les déconnexions hors du tour du joueur.** Un joueur déconnecté pendant la Discussion ou pendant le tour d'un autre ne met pas la partie en pause. Elle ne s'arrête que quand son tour arrive.
