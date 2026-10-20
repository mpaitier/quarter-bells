# Format des horloges

Format de données qui décrit une horloge. Les 40 horloges du jeu sont des fichiers JSON qui respectent ce format (exigence F-REG-01). Ajouter une horloge ne demande aucune ligne de code, tant qu'elle n'utilise que des types de règles du [catalogue](rule-catalog.md).

## Contenu et état

Le format sépare deux niveaux qu'il ne faut jamais mélanger.

|                                 | Définition d'une horloge                       | État d'une épreuve                                      |
| ------------------------------- | ---------------------------------------------- | ------------------------------------------------------- |
| Ce que c'est                    | Le contenu du jeu                              | Une partie en train de se jouer                         |
| Change pendant la partie        | jamais                                         | à chaque action                                         |
| Identique pour tous les groupes | oui                                            | non                                                     |
| Où il vit                       | fichiers JSON dans `packages/rules`            | mémoire du serveur, sauvegardes                         |
| Exemples                        | sections, règles, section de départ par défaut | cartes posées, section de départ choisie, yeux dépensés |

L'état d'une épreuve référence l'horloge par son `uid`, et chaque carte posée référence sa section par son `index`. Pour connaître les règles d'une section où une carte a été posée, le moteur charge l'horloge à partir de l'`uid` de l'épreuve, puis lit `sections[sectionIndex]`.

## Disposition des sections

Les sections sont indexées de 0 à 5 dans le sens horaire. La section 0 est centrée sur 12 h, la section 1 sur 2 h, la section 2 sur 4 h, et ainsi de suite : la section `i` est centrée sur l'angle `i × 60°`, mesuré depuis 12 h dans le sens horaire.

L'aiguille pointe toujours le milieu de la section de départ. L'ordre de révélation et de vérification de l'ordre croissant part de cette section et suit le sens horaire. L'index d'une section ne dit donc rien de l'ordre de révélation.

## Définition d'une horloge

```json
{
  "formatVersion": 1,
  "uid": "ch01-clk2",
  "chapter": 1,
  "indexInChapter": 2,
  "noMaxSum": false,
  "startSectionMode": "fixed",
  "defaultStartSection": 4,
  "clockRules": [],
  "sections": [
    { "index": 0, "rules": [] },
    {
      "index": 1,
      "rules": [{ "kind": "sumInRange", "params": { "min": 6, "max": 10 } }]
    },
    { "index": 2, "rules": [] },
    { "index": 3, "rules": [] },
    {
      "index": 4,
      "rules": [{ "kind": "minCardCount", "params": { "min": 2 } }]
    },
    {
      "index": 5,
      "rules": [{ "kind": "exactCardCount", "params": { "count": 3 } }]
    }
  ]
}
```

Cette horloge est un exemple inventé, elle n'est pas destinée au jeu.

### Champs de l'horloge

| Champ                 | Type              | Contrainte                   | Rôle                                                                                                              |
| --------------------- | ----------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `formatVersion`       | entier            | ≥ 1                          | Version du format. Permet de le faire évoluer sans casser les horloges existantes.                                |
| `uid`                 | texte             | unique dans tout le jeu      | Identifiant stable de l'horloge, référencé par l'état des épreuves et par la progression.                         |
| `chapter`             | entier            | 1 à 10                       | Chapitre de l'horloge.                                                                                            |
| `indexInChapter`      | entier            | 0 à 3                        | Position de l'horloge dans son chapitre. Le couple (`chapter`, `indexInChapter`) est unique.                      |
| `noMaxSum`            | booléen           |                              | `true` supprime le plafond de 24.                                                                                 |
| `startSectionMode`    | texte             | `fixed` ou `chosenByPlayers` | `chosenByPlayers` laisse les joueurs choisir la section de départ pendant la Discussion (à partir du chapitre 3). |
| `defaultStartSection` | entier            | 0 à 5                        | Section de départ en mode `fixed`, valeur proposée en mode `chosenByPlayers`.                                     |
| `clockRules`          | liste de règles   | peut être vide               | Règles qui s'appliquent à toute l'horloge.                                                                        |
| `sections`            | liste de sections | exactement 6                 | Les sections, dans l'ordre de leur index.                                                                         |

### Champs d'une section

| Champ   | Type            | Contrainte                              | Rôle                                  |
| ------- | --------------- | --------------------------------------- | ------------------------------------- |
| `index` | entier          | 0 à 5, égal à sa position dans la liste | Position de la section sur le cadran. |
| `rules` | liste de règles | peut être vide                          | Règles propres à cette section.       |

### Champs d'une règle

| Champ    | Type  | Contrainte           | Rôle                    |
| -------- | ----- | -------------------- | ----------------------- |
| `kind`   | texte | un type du catalogue | Type de règle.          |
| `params` | objet | dépend du type       | Paramètres de la règle. |

La nature d'une règle (contrainte de pose ou condition de réussite) n'est pas écrite dans l'horloge : elle découle de son type, défini une fois pour toutes dans le catalogue.

## Ce que le format interdit

Le format est conçu pour qu'une horloge invalide ne puisse pas s'écrire, ou soit rejetée au chargement :

- **Une seule aiguille.** La section de départ est une valeur unique au niveau de l'horloge. Il est impossible d'en déclarer deux, ou aucune.
- **Six sections exactement**, avec des index de 0 à 5, chacun à sa place.
- **Des règles connues.** Seuls les types connus du catalogue sont acceptés : un type candidat, un `kind` absent du catalogue ou des `params` qui ne correspondent pas à son type rendent l'horloge invalide.
- **Aucune donnée de partie.** Les cartes posées, les yeux et la section de départ choisie n'ont pas de champ dans ce format.

Ces contraintes seront vérifiées par un JSON Schema, dans `packages/rules`, et par un test qui charge toutes les horloges du jeu. Le schéma est écrit avec TypeBox, voir l'[ADR 0008](adr/0008-validation-des-horloges.md).

## État d'une épreuve

Pour mémoire, la partie de l'état qui fait le lien avec l'horloge. Le détail est dans le [modèle du domaine](diagrams/domain-model.md).

```json
{
  "clockUid": "ch01-clk2",
  "startSection": 4,
  "placements": [
    {
      "placementIndex": 0,
      "sectionIndex": 5,
      "player": "p1",
      "cardId": "a8f3",
      "faceUp": false
    }
  ]
}
```

`startSection` vaut `defaultStartSection` en mode `fixed`, et la valeur choisie par les joueurs en mode `chosenByPlayers`.

## Questions ouvertes

- Faut-il un nom ou un titre par horloge, affiché à l'annonce ? Si oui, il passe par une clé de traduction, pas par un texte en dur.
- Le format des `params` de chaque type de règle doit être décrit dans le catalogue, type par type.
