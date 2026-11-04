# 0012 - Framework web et rendu de l'horloge

- Statut : Accepté
- Date : 2026-11-04

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

| Critère                   | Seuil                                                                                                 |
| ------------------------- | ----------------------------------------------------------------------------------------------------- |
| Budget JavaScript initial | 150 Ko compressés (gzip) pour le JavaScript chargé au premier affichage. Calcul ci-dessous.           |
| TypeScript                | Les composants et leurs propriétés sont vérifiés en mode `strict` par un outil officiel du framework. |
| Tests de composants       | Une bibliothèque maintenue permet de tester les composants sous Vitest.                               |
| Navigateurs               | NF-CMP-01 est respectée sans polyfill.                                                                |

Conditions de mesure du premier affichage : profil mobile de Lighthouse (latence de 150 ms, débit d'environ 1,6 Mbit/s, processeur ralenti 4 fois).

Calcul du budget, sur les 3 secondes de NF-PERF-02 :

| Étape                                                          | Durée    |
| -------------------------------------------------------------- | -------- |
| Connexion : DNS, TCP et TLS 1.3, un aller-retour chacun        | 450 ms   |
| Requête et réception du HTML                                   | 200 ms   |
| Requête du JavaScript, découvert dans le HTML                  | 150 ms   |
| Analyse, exécution et premier rendu, processeur ralenti        | 700 ms   |
| **Reste pour télécharger les ressources du premier affichage** | 1 500 ms |

À 1,6 Mbit/s, soit environ 200 Ko par seconde, 1,5 s permettent de télécharger environ 300 Ko. La moitié revient au JavaScript, l'autre moitié au CSS, aux polices et aux images du premier écran. La lenteur du démarrage d'une connexion TCP n'est pas comptée : la marge prise sur l'exécution la couvre.

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

Poids mesuré le 2026-11-04 : build de production, avec Vite 8.3, de l'application de démonstration générée par `create-vite` pour chaque framework (un compteur et deux images). Ce chiffre donne le coût de départ du framework, pas celui de l'écran de jeu.

| Framework | Version | JavaScript (gzip) |
| --------- | ------- | ----------------- |
| React     | 19.3    | 69,3 Ko           |
| Vue       | 3.5     | 25,8 Ko           |
| Svelte    | 5.57    | 12,4 Ko           |

#### React

Bibliothèque de composants écrits en JSX (TSX avec TypeScript). Chaque mise à jour de l'état relance la fonction du composant, et React applique au DOM les différences.

- TypeScript : les fichiers TSX sont vérifiés par `tsc`, sans outil supplémentaire.
- Tests : React Testing Library, sous Vitest avec un DOM simulé.
- État externe : le hook `useSyncExternalStore`, intégré depuis React 18, sert exactement à s'abonner à une source extérieure comme la passerelle de l'issue #34.
- Animation : rien d'intégré pour animer l'apparition ou la disparition d'un élément. Il faut passer par CSS, la Web Animations API ou une bibliothèque.
- Traduction : react-i18next, react-intl.
- Points d'attention : la bibliothèque n'impose aucune organisation, et beaucoup de choix restent à faire soi-même. Les règles des hooks (ordre des appels, dépendances des effets) sont la principale source d'erreurs au début.
- React Native reprend le même modèle de composants et les mêmes hooks.

#### Vue

Composants monofichiers `.vue` qui réunissent le template HTML, le script et le style. La réactivité repose sur des références (`ref`, `computed`) que Vue suit automatiquement.

- TypeScript : `vue-tsc`, l'outil officiel, vérifie aussi les templates.
- Tests : Vue Test Utils (officiel) ou Testing Library pour Vue, sous Vitest.
- État externe : une `shallowRef` mise à jour dans le rappel d'abonnement, avec un désabonnement dans `onUnmounted`, le tout rangé dans une fonction réutilisable (un « composable »).
- Animation : composants intégrés `Transition` et `TransitionGroup`, qui posent des classes CSS à l'entrée et à la sortie des éléments.
- Traduction : vue-i18n.
- Points d'attention : deux façons d'écrire un composant coexistent (Options API et Composition API), et la documentation comme les tutoriels mélangent les deux.

#### Svelte

Compilateur : les composants sont transformés au build en JavaScript qui modifie le DOM directement, sans DOM virtuel. Depuis Svelte 5, la réactivité s'écrit avec des « runes » (`$state`, `$derived`, `$effect`).

- TypeScript : `svelte-check`, l'outil officiel, vérifie aussi les templates.
- Tests : Testing Library pour Svelte, sous Vitest.
- État externe : tout objet qui a une méthode `subscribe` renvoyant une fonction de désabonnement se lit dans un composant avec le préfixe `$`. `createSubscriber` (`svelte/reactivity`) couvre les autres sources.
- Animation : transitions intégrées (`svelte/transition`), `animate:flip` pour les réordonnancements, `Tween` et `Spring` (`svelte/motion`) pour animer une valeur, et `prefersReducedMotion`, qui suit la préférence système.
- Traduction : pas de bibliothèque officielle. Les plus utilisées viennent de la communauté (svelte-i18n, Paraglide).
- Points d'attention : Svelte 5, sorti en octobre 2024, a changé la syntaxe. Une partie des tutoriels et des réponses en ligne décrit encore Svelte 4. Le code généré grossit avec chaque composant : l'écart de poids avec les autres se réduit à mesure que l'application grandit.

#### Notes sur documentation

Les critères qui dépendent du prototype (apprentissage, animation, poids, tests) reçoivent ici une note provisoire, revue après le prototype pour les deux finalistes.

Demande sur le marché : le relevé local prévu (offres à Nantes, Bordeaux et Toulon) n'a pas été fait. L'indicateur retenu à sa place est l'[enquête Stack Overflow 2026](https://survey.stackoverflow.co/2026/technology/data/web-framework), question « Web frameworks and technologies », tous répondants (10 281 réponses) : React 41,5 %, Vue 17,2 %, Svelte 7,8 %. C'est un indicateur mondial d'usage, pas un décompte d'offres d'emploi.

| Critère                | Poids | React | Vue | Svelte | Justification                                                                                           |
| ---------------------- | ----- | ----- | --- | ------ | ------------------------------------------------------------------------------------------------------- |
| Demande sur le marché  | 3     | 3     | 2   | 1      | Enquête Stack Overflow 2026 ; React Native reprend le modèle de React.                                  |
| Courbe d'apprentissage | 3     | 2     | 2   | 2      | Rien ne les départage sur documentation : chacun a son piège (hooks, deux API, tutoriels Svelte 4).     |
| Animation de l'horloge | 2     | 1     | 2   | 3      | Outils intégrés : aucun en React, `Transition` en Vue, transitions et `prefersReducedMotion` en Svelte. |
| Poids au-delà du seuil | 2     | 2     | 3   | 3      | 69,3 Ko, 25,8 Ko et 12,4 Ko pour un budget de 150 Ko.                                                   |
| État externe           | 1     | 3     | 2   | 3      | `useSyncExternalStore` et le contrat de store sont faits pour ça ; Vue demande un abonnement à la main. |
| Écosystème             | 1     | 3     | 3   | 2      | Pas de bibliothèque de traduction officielle ni dominante pour Svelte.                                  |
| Tests de composants    | 1     | 3     | 3   | 2      | Testing Library pour les trois ; Vue Test Utils est officiel ; Svelte 5 change encore souvent.          |
| **Score**              |       | 30    | 30  | 28     |                                                                                                         |

Finalistes retenus pour le prototype : React et Vue. Ils arrivent à égalité. Svelte a le meilleur poids et les meilleurs outils d'animation, mais ces deux points comptent moins que le marché, où il est loin derrière.

#### Prototypes

Une horloge de 6 sections en SVG et une aiguille qui tourne d'une section à la suivante, écrite dans chacun des deux finalistes, sur la branche `spike/clock-prototypes` (dossier `spikes/`). Les deux prototypes partagent le même code hors composants : un store qui imite la passerelle de l'issue #34 (`subscribe`, `getSnapshot`), la géométrie des sections, et une fonction `animate` qui passe par la Web Animations API et ramène la durée à 0 si les mouvements doivent être réduits. Chacun a deux tests de composants : six sections trouvées par leur rôle, et l'aiguille qui suit le store.

| Mesure, le 2026-11-04      | React 19.3                        | Vue 3.5                                      |
| -------------------------- | --------------------------------- | -------------------------------------------- |
| JavaScript du build (gzip) | 69,4 Ko                           | 25,7 Ko                                      |
| Abonnement au store        | une ligne, `useSyncExternalStore` | une `shallowRef`, un rappel et `onUnmounted` |
| Animation de l'aiguille    | une `ref` et un `useEffect`       | une `ref` et un `watch`                      |
| Test d'une mise à jour     | `act()` autour du changement      | `await nextTick()` après le changement       |
| Vérification des types     | `tsc`                             | `vue-tsc`                                    |

Deux constats valent pour les deux frameworks. jsdom, utilisé par les tests de composants, n'a pas de Web Animations API : la fonction `animate` doit le détecter, et les animations elles-mêmes se vérifient dans Playwright. Avec la Web Animations API, animer l'aiguille demande le même effort dans les deux frameworks : leurs outils d'animation intégrés ne servent pas pour une rotation pilotée par l'état.

Notes revues après le prototype :

| Critère                | Poids | React | Vue | Changement                                                                            |
| ---------------------- | ----- | ----- | --- | ------------------------------------------------------------------------------------- |
| Demande sur le marché  | 3     | 3     | 2   | —                                                                                     |
| Courbe d'apprentissage | 3     | 2     | 2   | Prototypes de taille comparable ; à confirmer par le développeur (voir Conséquences). |
| Animation de l'horloge | 2     | 2     | 2   | React passe de 1 à 2 : la Web Animations API suffit, sans bibliothèque.               |
| Poids au-delà du seuil | 2     | 2     | 3   | Confirmé par le build.                                                                |
| État externe           | 1     | 3     | 2   | Confirmé par le prototype.                                                            |
| Écosystème             | 1     | 3     | 3   | —                                                                                     |
| Tests de composants    | 1     | 3     | 3   | Confirmé : un test lisible dans les deux cas.                                         |
| **Score**              |       | 32    | 30  |                                                                                       |

### Rendu de l'horloge

Une horloge compte une vingtaine d'éléments qui bougent au plus : 6 sections, une aiguille, 12 cartes. Ce n'est pas le volume pour lequel un rendu sur carte graphique fait la différence.

#### SVG dans le DOM

Chaque section, carte et icône est un élément du DOM, positionné dans un repère commun (`viewBox`).

- Accessibilité : chaque élément peut porter un rôle, un `aria-label` et un `<title>` (texte au survol), et recevoir le focus.
- Assets PNG : affichés avec `<image>` ; le `viewBox` gère la mise à l'échelle.
- Interaction : événements habituels du navigateur sur chaque section.
- Tests : les éléments se trouvent par rôle ou par texte dans un test de composant.
- Poids : aucun ajout.
- Intégration : chaque section ou carte peut être un composant du framework.

#### Canvas 2D

L'horloge est dessinée par du code dans une seule image (`<canvas>`), redessinée à chaque changement.

- Accessibilité : un lecteur d'écran ne voit qu'une image. Il faudrait reproduire l'horloge dans des éléments DOM cachés, c'est-à-dire la maintenir deux fois.
- Assets PNG : `drawImage`, en gérant soi-même la densité de pixels de l'écran pour rester net.
- Interaction : il faut calculer à la main quelle section se trouve sous le pointeur, à partir de son angle.
- Tests : rien à interroger dans un test de composant ; seule une comparaison d'images avec Playwright vérifie l'affichage.
- Poids : aucun ajout.
- Intégration : un seul composant enveloppe le canvas, et le dessin s'écrit hors du framework.

#### Bibliothèque de rendu (PixiJS)

Moteur de rendu 2D en WebGL ou WebGPU, avec retour au Canvas 2D. Il gère une scène d'objets, leurs événements et leurs animations.

- Accessibilité : même limite que le Canvas 2D. PixiJS propose un module d'accessibilité qui superpose des éléments DOM aux objets de la scène.
- Assets PNG : chargés comme textures, avec gestion de la densité de pixels.
- Interaction : événements sur chaque objet de la scène.
- Tests : comme pour le Canvas 2D.
- Poids : PixiJS 8.22, mesuré le 2026-11-04 avec un cercle dessiné : environ 153 Ko compressés au total, répartis en morceaux chargés selon le moteur de rendu disponible.
- Intégration : la scène vit hors du framework, qui ne fait que l'héberger.

### Animation

#### CSS (transitions et animations)

- Réduction des mouvements : la media query `prefers-reduced-motion` et une classe posée sur la page par le réglage du jeu peuvent ramener toutes les durées à zéro, à condition que les durées passent par des variables CSS.
- Enchaînement : par des délais calculés à l'avance ou en écoutant `transitionend`. Une séquence de six révélations devient vite difficile à suivre.
- Interruption : changer la classe d'un élément interrompt son animation.
- Poids : aucun ajout.

#### Web Animations API

`element.animate()` lance une animation depuis le code et renvoie un objet qui la contrôle.

- Réduction des mouvements : rien d'automatique. Toutes les animations doivent passer par une fonction commune qui lit le réglage.
- Enchaînement : chaque animation expose une promesse `finished`, qu'on peut attendre avant de lancer la suivante.
- Interruption : `cancel()` arrête une animation, `finish()` la termine immédiatement, ce qui sert aussi à tout passer d'un coup.
- Poids : aucun ajout. L'API est disponible dans les quatre navigateurs de NF-CMP-01.

#### Bibliothèque d'animation

Motion (motion.dev) existe en version React et en version sans framework. Vue et Svelte ont aussi leurs outils intégrés, décrits plus haut.

- Réduction des mouvements : en React, `MotionConfig` avec `reducedMotion="user"` suit la préférence système pour toutes les animations.
- Enchaînement : séquences déclarées en une fois.
- Interruption : chaque animation renvoie un contrôle pour l'arrêter ou la terminer.
- Poids : Motion 14.9, fonction `animate` seule, mesurée le 2026-11-04 : 24,9 Ko compressés.

### Outil de build

Le client est un site statique (ADR 0004), sans rendu côté serveur.

- **Vite** : modèles officiels pour React, Vue et Svelte (`create-vite`). Vitest réutilise sa configuration, ce qui évite une deuxième chaîne de compilation pour les tests de composants.
- **Frameworks complets** (Next.js, Nuxt, SvelteKit) : ils ajoutent le routage et le rendu côté serveur. Le rendu serveur n'est pas utile ici, et le routage du J2 se limite à quelques écrans. Nuxt et SvelteKit reposent eux-mêmes sur Vite.
- **webpack ou Rsbuild** : plus de configuration, sans lien avec Vitest.

## Décision

- **Framework : React**, avec TypeScript en mode `strict`. Score de 32 contre 30 pour Vue, après prototype. L'écart vient de la demande sur le marché et de l'abonnement à un état externe ; Vue reste devant sur le poids.
- **Rendu de l'horloge : SVG dans le DOM.** C'est la seule technique qui répond aux questions d'accessibilité, d'interaction et de tests sans travail en double, et elle n'ajoute rien au poids. Le volume d'éléments animés ne justifie pas un rendu sur carte graphique.
- **Animation : Web Animations API**, derrière une fonction commune qui applique la réduction des mouvements. Elle répond aux questions d'enchaînement (promesse `finished`) et d'interruption (`finish`, `cancel`) sans rien ajouter au poids. Les CSS restent utilisées pour les changements d'état sans mouvement (couleur au survol, section interdite).
- **Outil de build : Vite**, avec son modèle React. Vitest réutilise sa configuration, et le rendu côté serveur des frameworks complets n'a pas d'usage pour un site statique.

## Conséquences

- `apps/web` est créé avec Vite et React (issue #31). Les tests de composants utilisent Vitest, React Testing Library et jsdom.
- La passerelle de l'issue #34 expose `subscribe` et `getSnapshot`, la forme attendue par `useSyncExternalStore`. `getSnapshot` doit renvoyer le même objet tant que l'état ne change pas, et un nouvel objet à chaque changement : un nouvel objet à chaque appel ferait redessiner l'écran en boucle.
- Toutes les animations passent par un seul module, qui lit la préférence système et le réglage du jeu (NF-ACC-02). Aucun composant n'appelle `element.animate` directement. Une règle ESLint `no-restricted-syntax` pourra l'imposer.
- Ce module tolère l'absence de la Web Animations API, absente de jsdom. Les enchaînements d'animations, la Résolution en tête, se testent dans Playwright.
- En développement, `StrictMode` monte chaque composant deux fois : chaque effet qui lance une animation doit la terminer dans sa fonction de nettoyage, comme dans le prototype.
- Les assets PNG s'affichent dans le SVG avec `<image>`. Chaque section et chaque icône de règle porte un rôle et un `aria-label` (issue #35).
- React pèse 69 Ko des 150 Ko du budget JavaScript. Un contrôle de taille du build dans la CI (par exemple size-limit) permettrait de voir le budget se remplir composant après composant. À décider dans l'issue #31.
- La bibliothèque de traduction (react-i18next ou react-intl) se choisit dans l'issue #31.
- La courbe d'apprentissage a été notée sur des prototypes qui n'ont pas été écrits par le développeur du projet. Si les premiers composants de l'issue #35 se révèlent nettement plus difficiles que prévu, ce point justifie de revoir la décision tant que peu de code existe.
- Le relevé local des offres d'emploi n'a pas été fait : l'indicateur de marché est mondial.
- La branche `spike/clock-prototypes` n'est jamais fusionnée. Elle reste comme trace des mesures.
