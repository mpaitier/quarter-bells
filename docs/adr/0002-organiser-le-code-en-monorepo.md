# 0002 - Organiser le code en monorepo

- Statut : Accepté
- Date : 2026-10-14

## Contexte

Le projet comprend un serveur, un client web et, plus tard, un client mobile. Ces trois applications doivent :

- parler exactement le même protocole de messages ;
- appliquer les mêmes règles de jeu, le serveur pour valider les actions et les clients pour guider le joueur (signaler une section interdite).

Le projet est développé par une seule personne.

## Options envisagées

### Option A : un dépôt par application

Trois dépôts indépendants (serveur, web, mobile).

- Avantages : chaque dépôt reste petit et simple ; chaque application a son propre cycle de version.
- Inconvénients : le protocole et le moteur de règles sont dupliqués ou publiés comme paquets externes ; une modification du protocole demande des pull requests coordonnées dans plusieurs dépôts ; risque de divergence silencieuse entre les implémentations.

### Option B : un seul dépôt (monorepo)

Un dépôt unique séparant les applications exécutables (`apps/`) et les paquets partagés (`packages/`).

- Avantages : le protocole et les règles existent en un seul exemplaire ; un changement de protocole et ses adaptations côté serveur et client tiennent dans une seule pull request ; la documentation et les décisions sont centralisées.
- Inconvénients : la CI doit détecter quelles parties sont touchées pour ne pas tout relancer ; les règles de dépendance entre dossiers doivent être tenues avec discipline ; le partage de code n'a d'intérêt que si les applications utilisent le même langage.

## Décision

Le code est organisé en monorepo :

```
apps/      server, web, mobile
packages/  rules, protocol
docs/      adr, diagrams, requirements
```

Règles de dépendance :

- `packages/rules` ne dépend de rien ;
- `packages/protocol` peut dépendre de `packages/rules` pour réutiliser les types du domaine ;
- chaque application peut dépendre des paquets, jamais d'une autre application ;
- aucun cycle de dépendance n'est autorisé.

## Conséquences

- Le choix de la stack (ADR à venir) devra tenir compte du partage de `rules` et `protocol` entre serveur et clients. Une stack hétérogène réduirait fortement l'intérêt de cette décision.
- La CI filtrera ses tâches selon les dossiers modifiés. Une modification de `packages/` déclenche les vérifications de toutes les applications qui en dépendent.
- Un outil de gestion de workspaces adapté à la stack sera nécessaire pour lier les paquets locaux.
- Le respect des règles de dépendance devra idéalement être vérifié automatiquement, et pas seulement par relecture.
