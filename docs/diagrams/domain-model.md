# Modèle du domaine

Entités du jeu et leurs relations. Ce diagramme décrit le métier, pas l'implémentation : pas de base de données, pas de réseau, pas de méthodes techniques. Les noms suivent le [glossaire](../glossary.md).

## Définition du contenu

Ce qui décrit le jeu lui-même. Ces données sont fixes et identiques pour tous les groupes.

```mermaid
classDiagram
    direction LR

    class Chapter {
        +int number
        +List~Clock~ clocks
    }

    class Clock {
        +ClockId id
        +int indexInChapter
        +StartSectionMode startSectionMode
        +int defaultStartSection
        +bool noMaxSum
        +List~ClockRule~ clockRules
        +List~Section~ sections
    }

    class Section {
        +int index
        +List~SectionRule~ rules
    }

    class Rule {
        <<abstract>>
        +RuleKind kind
        +Map parameters
    }

    class ClockRule
    class SectionRule

    class RuleNature {
        <<enumeration>>
        placementConstraint
        resolutionCondition
        modifier
    }

    class StartSectionMode {
        <<enumeration>>
        fixed
        chosenByPlayers
    }

    class Card {
        +CardId id
        +CardFamily family
        +int value
    }

    class CardFamily {
        <<enumeration>>
        instant
        eternity
    }

    Chapter "1" *-- "4" Clock
    Clock "1" *-- "6" Section
    Clock "1" *-- "0..*" ClockRule
    Section "1" *-- "0..*" SectionRule
    Rule <|-- ClockRule
    Rule <|-- SectionRule
    Rule --> RuleNature
    Clock --> StartSectionMode
    Card --> CardFamily
```

## État d'une épreuve

Ce qui change pendant qu'un groupe joue.

```mermaid
classDiagram
    direction LR

    class GameSession {
        +List~PlayerId~ turnOrder
        +Trial currentTrial
    }

    class Trial {
        +ClockId clock
        +Phase phase
        +int startSection
        +int baseEyes
        +int eyesSpent
        +int currentTurn
    }

    class Phase {
        <<enumeration>>
        discussion
        dealing
        placement
        resolution
        succeeded
        failed
        paused
    }

    class Seat {
        +PlayerId player
        +bool ready
        +bool connected
        +Hand hand
        +Reserve reserve
    }

    class Hand {
        +List~Card~ cards
    }

    class Reserve {
        +List~Card~ cards
    }

    class Placement {
        +int placementIndex
        +int sectionIndex
        +PlayerId player
        +Card card
        +bool faceUp
    }

    GameSession "1" *-- "1" Trial
    Trial --> Phase
    Trial "1" *-- "2..4" Seat
    Seat "1" *-- "1" Hand
    Seat "1" *-- "0..1" Reserve
    Trial "1" *-- "0..12" Placement
```

## Progression

Ce qui est conservé entre deux parties.

```mermaid
classDiagram
    direction LR

    class Group {
        +LobbyId lobby
        +Set~PlayerId~ members
    }

    class Progress {
        +int startChapter
        +int currentChapter
        +int currentClockIndex
        +int bonusEyes
        +List~ClockId~ completedClocks
        +List~ClockId~ suspendedClocks
    }

    class Player {
        +PlayerId id
        +Profile profile
        +int maxChapterReached
    }

    class Profile {
        +String name
        +String icon
    }

    Group "1" *-- "1" Progress
    Group "1" o-- "2..4" Player
    Player "1" *-- "1" Profile
```

## Décisions de modélisation

- **Le groupe** est identifié par sa salle. Ses membres forment un ensemble fixe : une progression ne reprend qu'avec exactement les mêmes joueurs.
- **Les yeux bonus** survivent aux épreuves et aux sessions sauvegardées : ils font partie de la progression du groupe, pas de l'épreuve.
- **Le chapitre maximum** d'un joueur vit sur le joueur, puisqu'il se calcule toutes salles confondues.
- **L'identifiant de carte** (`CardId`) est tiré au hasard à chaque distribution. Un identifiant stable comme `instant-12` donnerait la valeur à quiconque le lit.
- **La section de départ** est une donnée de l'épreuve, puisqu'elle peut être choisie par les joueurs à partir du chapitre 3. L'horloge ne fournit que sa valeur par défaut.

## Vue d'un joueur

Les classes ci-dessus décrivent l'état complet, que seul le serveur connaît. Chaque joueur reçoit une projection de cet état, où les informations qu'il n'a pas le droit de connaître sont absentes : une `Placement` posée face cachée par un autre joueur n'y contient que la famille de la carte, pas sa valeur. Les classes de cette vue appartiennent à `packages/protocol`, pas au domaine.
