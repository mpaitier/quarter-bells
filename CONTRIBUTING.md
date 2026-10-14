# Contribuer à Quarter Bells

## Branches

`main` contient toujours une version stable. On n'y pousse jamais directement : tout passe par une pull request.

Chaque travail se fait sur une branche courte, créée depuis `main` et nommée selon le type de changement :

```
feat/pose-de-carte
fix/calcul-somme-quartier
docs/adr-choix-stack
```

Une branche ne vit que le temps d'une fonctionnalité. Elle est supprimée après la fusion.

## Messages de commit

Le projet suit la convention [Conventional Commits](https://www.conventionalcommits.org/fr/v1.0.0/).

```
<type>(<scope>): <description à l'impératif>
```

Types autorisés :

| Type | Usage |
|------|-------|
| `feat` | nouvelle fonctionnalité |
| `fix` | correction de bug |
| `docs` | documentation uniquement |
| `refactor` | changement de code sans effet sur le comportement |
| `test` | ajout ou correction de tests |
| `chore` | maintenance, dépendances, configuration |
| `ci` | pipeline d'intégration continue |
| `style` | formatage sans changement de logique |
| `perf` | amélioration de performance |

Le scope correspond au dossier concerné : `server`, `web`, `mobile`, `rules`, `protocol`, `docs`. Il est facultatif quand le changement touche tout le repo.

Exemples :

```
feat(rules): ajouter la contrainte de nombre de cartes par quartier
fix(server): ignorer une commande reçue deux fois
docs(adr): consigner le choix du monorepo
```

Un changement incompatible avec les versions précédentes se signale par un `!` après le type (`feat(protocol)!: ...`) et une ligne `BREAKING CHANGE:` dans le corps du commit.

## Pull requests

- Le titre de la PR suit le même format qu'un commit.
- La PR est fusionnée en « squash and merge » : son titre devient le commit unique sur `main`.
- Le modèle de PR liste les vérifications à faire avant la fusion.

## Décisions d'architecture

Toute décision structurante (choix de techno, de pattern, changement de protocole) fait l'objet d'un ADR dans `docs/adr/`, en partant de `docs/adr/template.md`.
