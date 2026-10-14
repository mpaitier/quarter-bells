# Quarter Bells

Jeu coopératif en ligne pour 2 à 4 joueurs. Autour d'une horloge, l'équipe pose ses cartes face cachée sans pouvoir se parler, en respectant des règles qui changent à chaque épreuve.

> Projet personnel, non commercial, inspiré d'un jeu de société existant. Il ne reprend ni les visuels, ni les textes, ni le nom du jeu original.

## État du projet

Phase de conception. Aucun code applicatif pour l'instant.

## Organisation du dépôt

```
apps/
  server/     serveur de jeu faisant autorité
  web/        client web (prioritaire)
  mobile/     client mobile (plus tard)
packages/
  rules/      moteur de règles, sans dépendance
  protocol/   messages échangés entre serveur et clients
docs/
  adr/        décisions d'architecture
  diagrams/   diagrammes (Mermaid)
  requirements.md
```

Chaque dossier de `apps/` et `packages/` contient un README qui précise son rôle et ses dépendances autorisées.

## Documentation

- [Décisions d'architecture](docs/adr/)
- [Diagrammes](docs/diagrams/)
- [Exigences](docs/requirements.md)
- [Contribuer](CONTRIBUTING.md)

## Lancer le projet

À venir. TEST
