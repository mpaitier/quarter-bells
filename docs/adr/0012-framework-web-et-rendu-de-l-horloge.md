# 0012 - Framework web et rendu de l'horloge

- Statut : Proposé
- Date : 2026-11-03

## Contexte

Le J2 construit l'écran de jeu dans `apps/web` (issue #30). Avant la première ligne de code, quatre choix sont à faire : le framework, la technique de rendu de l'horloge, la méthode d'animation et l'outil de build.

Contraintes :

- **Premier affichage en moins de 3 secondes sur une connexion 4G** (NF-PERF-02). Le client est un site statique hébergé sur Cloudflare Pages (ADR 0004), sans rendu côté serveur.
- **Les deux dernières versions de Chrome, Firefox, Safari et Edge** (NF-CMP-01).
- **Des animations réductibles** qui respectent la préférence système de réduction des mouvements (NF-ACC-02), et des familles de cartes reconnaissables sans la couleur (NF-ACC-01).
- **Aucun texte en dur** (NF-I18N-01) : le framework doit s'accorder avec une bibliothèque de traduction.
- **Un écran qui ne dépend que de l'état reçu** (critère de sortie du J2). L'état vient d'une passerelle (issue #34) à laquelle l'écran s'abonne. Le framework doit savoir afficher un état qui vit hors de ses composants.
- **Des icônes de règles lisibles par un lecteur d'écran** (issue #35).
- **Des assets dessinés à la main, en PNG** à fond transparent (issues #31 et #35) : cadran, aiguille, icônes des règles, fond de table.
- **Des tests de composants sous Vitest** ([stratégie de tests](../testing.md)), et Playwright pour les tests de bout en bout.
- **Un seul développeur qui découvre TypeScript.**
- **Le projet sert de vitrine** pour une recherche d'emploi.

## Critères

Les critères et leurs poids sont fixés avant la comparaison, pour que la grille ne soit pas ajustée après coup en faveur d'un candidat.

### Critères éliminatoires

Un candidat qui ne passe pas l'un de ces critères est écarté, quelle que soit sa note.

| Critère                   | Seuil                                                                                                                            |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Budget JavaScript initial | **À calculer** : poids compressé maximal du JavaScript chargé au premier affichage pour tenir 3 s dans les conditions de mesure. |
| TypeScript                | Les composants et leurs propriétés sont vérifiés en mode `strict` par un outil officiel du framework.                            |
| Tests de composants       | Une bibliothèque maintenue permet de tester les composants sous Vitest.                                                          |
| Navigateurs               | NF-CMP-01 est respectée sans polyfill.                                                                                           |

Conditions de mesure du premier affichage : profil mobile de Lighthouse (latence de 150 ms, débit d'environ 1,6 Mbit/s, processeur ralenti 4 fois).

### Critères pondérés

Chaque candidat reçoit une note de 1 (faible) à 3 (fort) par critère. Le score est la somme des notes multipliées par les poids.

| Critère                | Poids | Ce qui est évalué                                                                                 | Mesure                                                                           |
| ---------------------- | ----- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Demande sur le marché  | 3     | Place du framework dans les offres d'emploi visées.                                               | Nombre d'offres à Nantes, Bordeaux et Toulon, sur un même site, à une même date. |
| Courbe d'apprentissage | 3     | Temps pour écrire un composant typé, avec un état et un test, sans connaître le framework.        | Prototype de l'horloge.                                                          |
| Animation de l'horloge | 2     | Facilité pour animer l'aiguille et les sections, et pour couper les animations d'un seul réglage. | Prototype de l'horloge.                                                          |
| Poids au-delà du seuil | 2     | Marge laissée sous le budget JavaScript initial.                                                  | Build de production du prototype.                                                |
| État externe           | 1     | Facilité pour afficher un état qui vit hors des composants et s'y abonner.                        | Documentation, prototype.                                                        |
| Écosystème             | 1     | Bibliothèques de traduction et d'accessibilité maintenues.                                        | Documentation.                                                                   |
| Tests de composants    | 1     | Facilité pour rendre un composant, simuler une action du joueur et vérifier le résultat.          | Un test du prototype.                                                            |

### Critères pour le rendu de l'horloge

Le rendu ne se note pas sur une grille : chaque technique est confrontée aux questions suivantes, et la décision dit lesquelles ont pesé.

- **Accessibilité** : une icône de règle peut-elle porter un texte lu par un lecteur d'écran et un texte au survol, sans dupliquer l'horloge dans le DOM (issue #35) ?
- **Assets PNG** : le cadran, l'aiguille et les icônes dessinés en PNG s'affichent-ils nets, au double de leur taille ?
- **Interaction** : une section peut-elle être survolée, cliquée et signalée comme interdite (F-JEU-08) avec les événements habituels du navigateur ?
- **Tests** : peut-on vérifier ce qui est affiché (une section, une carte posée) dans un test de composant ou un test Playwright ?
- **Poids** : combien la technique ajoute-t-elle au budget JavaScript initial ?
- **Intégration** : les éléments de l'horloge peuvent-ils être des composants du framework retenu ?

### Critères pour l'animation

Mêmes principes que pour le rendu.

- **Réduction des mouvements** : un seul réglage coupe ou réduit toutes les animations, qu'il vienne de la préférence système ou des paramètres du jeu (NF-ACC-02).
- **Enchaînement** : la Résolution révèle les sections une à une ; peut-on enchaîner des animations, attendre la fin de l'une avant de lancer la suivante, et tout passer d'un coup ?
- **Interruption** : une animation en cours peut-elle être arrêtée proprement si un nouvel état arrive, par exemple à la reconnexion ?
- **Poids** : combien la méthode ajoute-t-elle au budget JavaScript initial ?

## Options envisagées

L'évaluation se fait en deux temps : une comparaison sur documentation pour retenir deux frameworks, puis un prototype jetable de l'horloge dans chacun d'eux (6 sections, une aiguille qui tourne). Les prototypes vivent sur la branche `spike/clock-prototypes`, qui ne sera jamais fusionnée.

### Framework

#### React

À compléter.

#### Vue

À compléter.

#### Svelte

À compléter.

### Rendu de l'horloge

#### SVG dans le DOM

À compléter.

#### Canvas 2D

À compléter.

#### Bibliothèque de rendu (PixiJS)

À compléter.

### Animation

#### CSS (transitions et animations)

À compléter.

#### Web Animations API

À compléter.

#### Bibliothèque d'animation

À compléter.

### Outil de build

À compléter. Vite est l'option par défaut et doit être justifié.

## Décision

À compléter après les prototypes.

## Conséquences

À compléter après les prototypes.
