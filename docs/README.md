# Documentation

Point d'entrée de la documentation. À ouvrir en premier en revenant sur le projet.

## Comprendre le jeu

| Document | Contenu | État |
|----------|---------|------|
| [Règles du jeu](game-rules.md) | Règles implémentées, choix de design | brouillon |
| [Glossaire](glossary.md) | Vocabulaire du domaine et noms dans le code | brouillon |
| [Catalogue des règles](rule-catalog.md) | Types de règles que le moteur sait évaluer | brouillon |
| [Format des horloges](clock-format.md) | Données d'une horloge, disposition des sections | brouillon |

## Exigences et planning

| Document | Contenu | État |
|----------|---------|------|
| [Exigences](requirements.md) | Exigences fonctionnelles et non fonctionnelles | à jour |
| [Feuille de route](roadmap.md) | Jalons et critères de sortie | brouillon |

## Conception

| Document | Contenu | État |
|----------|---------|------|
| [Modèle du domaine](diagrams/domain-model.md) | Entités et relations | brouillon |
| [Cycle de vie d'une partie](diagrams/game-state.md) | Machine à états de la partie | brouillon |
| [Cycle de vie d'une salle](diagrams/lobby-state.md) | Machine à états de la salle | brouillon |
| [Navigation](diagrams/navigation-flow.md) | Parcours entre les écrans | à jour |
| [Protocole](protocol.md) | Commandes et événements | brouillon |
| Architecture C4 | Contexte et conteneurs | à faire, après les ADR 0004 et 0005 |
| Stratégie de tests | Types de tests et outillage | à faire, au début du J1 |
| Maquettes | Écrans du jeu | à faire |

## Décisions

| ADR | Titre | Statut |
|-----|-------|--------|
| [0001](adr/0001-enregistrer-les-decisions-d-architecture.md) | Enregistrer les décisions d'architecture | Accepté |
| [0002](adr/0002-organiser-le-code-en-monorepo.md) | Organiser le code en monorepo | Accepté |
| [0003](adr/0003-choix-de-la-stack.md) | Choix de la stack | Accepté |
| [0004](adr/0004-hebergement.md) | Hébergement | Proposé |
| 0005 | Authentification (e-mail et Google) | à rédiger |
| 0006 | Vocal et vidéo en WebRTC | à rédiger |

Nouveau ADR : partir de [template.md](adr/template.md).

## États

- **à faire** : le document n'existe pas encore.
- **brouillon** : le document existe mais contient des questions ouvertes.
- **à jour** : le document reflète l'état du projet.
