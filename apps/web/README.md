# web

Client web, prioritaire. Affiche l'état reçu du serveur, envoie les intentions du joueur et joue les animations.

Ce client ne décide jamais du résultat d'une action : il peut prévisualiser une règle pour l'interface (lueur rouge sur une section interdite), mais seul le serveur valide.

## Dépendances autorisées

- `packages/protocol`
- `packages/rules`, pour ses fonctions pures appelées sur la vue (poses permises, bougies disponibles), jamais pour lire l'état complet d'une épreuve
- `packages/game`, uniquement dans l'adaptateur local `src/gateway/local/`

Aucune dépendance vers `apps/server` ni `apps/mobile`.

Un paquet s'importe uniquement par son API publique, `@quarter-bells/<paquet>`, qui correspond à son `index.ts`. ESLint refuse les sous-chemins (`@quarter-bells/rules/src/...`), les chemins relatifs vers un autre dossier du monorepo et les imports des autres applications.

## Horloge

`src/clock/clock-face.tsx` dessine une horloge à partir de sa définition, de la section de départ et des cartes posées (issue #35). Le composant ne reçoit que des données : il ne connaît ni la passerelle ni le moteur. Tout est dans un seul SVG (ADR 0012). Chaque section est un groupe nommé d'après son heure (« Section de 2 h »), et chaque icône de règle porte sa phrase complète en nom accessible et en texte au survol.

La géométrie (angles, positions des icônes et des cartes) est dans `src/clock/clock-geometry.ts`, en fonctions pures testées. Le repère est un viewBox de 120 × 120 unités.

En attendant l'écran de jeu, l'atelier (`src/workbench/`) affiche n'importe quelle horloge du jeu, avec une section de départ au choix et des cartes d'exemple : c'est là que se fait la vérification visuelle des 4 horloges du chapitre 1.

### Assets à dessiner

Les icônes, le cadran et l'aiguille actuels sont provisoires. Les dessins à la main les remplaceront dans `RuleIcon`, `FamilyGlyph` et `ClockFace`, avec une `<image>` à la même place et à la même taille. Les PNG ont un fond transparent et sont dessinés à 16 px par unité du viewBox. Ça couvre le double de la taille d'affichage sur un écran de 1080 px de haut, où l'horloge occupe 75 % de la hauteur.

| Asset              | Taille dans le viewBox                              | Toile du PNG              |
| ------------------ | --------------------------------------------------- | ------------------------- |
| Cadran             | cercle de 68 unités de diamètre, centré             | 1088 × 1088 px            |
| Aiguille           | 27 unités du centre à la pointe, dessinée vers 12 h | 64 × 432 px, pivot en bas |
| Icône de règle     | 10 × 6,5 unités                                     | 160 × 104 px              |
| Symbole de famille | 3,2 à 4 unités de côté                              | 64 × 64 px                |

Le cadran doit respecter la géométrie du code : section 0 centrée sur 12 h, séparations à ±30° autour de chaque centre, soit à 11 h, 1 h, 3 h, 5 h, 7 h et 9 h.

## Passerelle de jeu

L'écran ne parle à la partie que par le port `GameGateway` (`src/gateway/game-gateway.ts`, [ADR 0017](../../docs/adr/0017-brancher-l-ecran-sur-une-passerelle-de-jeu.md)) : il envoie des commandes et reçoit la vue de son joueur.

- Au J2, `createLocalGameSession(setup)` fait tourner la partie dans le navigateur. `gatewayFor(joueur)` donne la passerelle de chaque joueur.
- Au J3, un adaptateur WebSocket implémentera le même port.

Le composant racine choisit l'adaptateur et le passe à `GameGatewayProvider`. En dessous, les composants n'utilisent que les hooks de `src/gateway/use-game-gateway.ts` :

| Hook                             | Rôle                                              |
| -------------------------------- | ------------------------------------------------- |
| `usePlayerView()`                | la vue du joueur, `undefined` avant la première   |
| `useSendCommand()`               | envoie une commande ; la réponse arrive plus tard |
| `useCommandRejected(onRejected)` | appelé à chaque refus, pour guider le joueur      |

Une commande ne reçoit jamais de réponse pendant `send`, même en local. ESLint refuse `@quarter-bells/game` hors de `src/gateway/local/` et les types de l'état complet d'une épreuve (`Trial`, `Seat`...) dans tout le client.

## Stack

React, TypeScript en mode `strict`, rendu de l'horloge en SVG et build par Vite ([ADR 0012](../../docs/adr/0012-framework-web-et-rendu-de-l-horloge.md)).

## Traductions

Aucun texte affiché n'est écrit en dur (NF-I18N-01). Les textes passent par react-intl ([ADR 0014](../../docs/adr/0014-bibliotheque-de-traduction.md)).

- Les messages vivent dans `src/i18n/messages/`, un fichier JSON par langue. Le catalogue français `fr.json` fait référence : ses clés sont les seuls identifiants acceptés par TypeScript.
- Un identifiant se nomme par écran puis par élément : `app.title`.
- Un message avec pluriel ou variable s'écrit en syntaxe ICU : `{count, plural, one {# carte} other {# cartes}}`.
- Dans un composant : `<FormattedMessage id="app.title" />`, ou `useIntl().formatMessage({ id: "app.title" })` pour un attribut comme `aria-label`.
- Dans un test : `renderWithTranslations(<Composant />)` à la place de `render`.

ESLint refuse le texte écrit en dur dans les composants de `src/` : texte entre deux balises, chaîne entre accolades, et attributs comme `aria-label`, `alt` ou `title`.

## Commandes

Depuis la racine du dépôt :

| Commande                                       | Rôle                                                                                  |
| ---------------------------------------------- | ------------------------------------------------------------------------------------- |
| `pnpm --filter web dev`                        | serveur de développement, rechargement à chaud                                        |
| `pnpm --filter web build`                      | site statique dans `apps/web/dist/`                                                   |
| `pnpm --filter web preview`                    | sert le contenu de `dist/` pour vérifier le build en local                            |
| `pnpm --filter web typecheck`                  | vérification des types                                                                |
| `pnpm test:watch --project @quarter-bells/web` | tests de composants de `test/`, en mode surveillance                                  |
| `pnpm test:e2e`                                | test de fumée Playwright sur le build de production, dans Chromium, Firefox et WebKit |

## Tests de bout en bout

Les tests Playwright sont dans `e2e/`, avec leur configuration. Ils visent le build de production, servi sur le port 4173 : la commande construit le site avant de lancer les navigateurs.

Avant le premier lancement, installer les navigateurs une fois par machine, puis à chaque mise à jour de `@playwright/test` :

```
pnpm --filter web exec playwright install chromium firefox webkit
```

Ils ne font pas partie de `pnpm check`, trop lents pour une vérification avant chaque commit. La CI les lance à chaque PR, dans un job séparé qui tourne en parallèle des autres vérifications, dans l'image officielle `mcr.microsoft.com/playwright`, qui contient déjà les navigateurs et leurs dépendances système. Le numéro de version de l'image doit rester identique à celui de `@playwright/test` : mettre à jour le paquet oblige à changer l'image dans `.github/workflows/ci.yml`, sinon le job échoue en indiquant l'image attendue.

Quand un test échoue en CI, le rapport HTML est publié comme artefact `playwright-report` du workflow. Après une nouvelle tentative, il contient une trace (DOM, réseau, console) à ouvrir avec `pnpm --filter web exec playwright show-trace <fichier>`.
