# 0001 - Enregistrer les décisions d'architecture

- Statut : Accepté
- Date : 2026-10-14

## Contexte

Le projet va demander de nombreux choix techniques (stack, hébergement, base de données, protocole). Sans trace écrite, les raisons de ces choix se perdent et deviennent difficiles à remettre en question de façon argumentée.

## Décision

Chaque décision d'architecture structurante est consignée dans un Architecture Decision Record, au format décrit par Michael Nygard, dans le dossier `docs/adr/`.

Les fichiers sont numérotés dans l'ordre chronologique (`0001`, `0002`...) et partent du modèle `template.md`. Un ADR accepté n'est plus modifié : une décision qui change donne lieu à un nouvel ADR, et l'ancien passe au statut « Remplacé par NNNN ».

## Conséquences

- Toute pull request introduisant une décision structurante inclut l'ADR correspondant.
- L'historique des raisonnements reste consultable, y compris pour les options écartées.
- La rédaction prend un peu de temps à chaque décision.
