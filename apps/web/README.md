# web

Client web, prioritaire. Affiche l'état reçu du serveur, envoie les intentions du joueur et joue les animations.

Ce client ne décide jamais du résultat d'une action : il peut prévisualiser une règle pour l'interface (lueur rouge sur une section interdite), mais seul le serveur valide.

## Dépendances autorisées

- `packages/rules`
- `packages/protocol`

Aucune dépendance vers `apps/server` ni `apps/mobile`.

Un paquet s'importe uniquement par son API publique, `@quarter-bells/<paquet>`, qui correspond à son `index.ts`. ESLint refuse les sous-chemins (`@quarter-bells/rules/src/...`), les chemins relatifs vers un autre dossier du monorepo et les imports des autres applications.

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

Ils ne font pas partie de `pnpm check`, trop lents pour une vérification avant chaque commit. La CI les lance à chaque PR, après les autres vérifications.

Quand un test échoue en CI, le rapport HTML est publié comme artefact `playwright-report` du workflow. Après une nouvelle tentative, il contient une trace (DOM, réseau, console) à ouvrir avec `pnpm --filter web exec playwright show-trace <fichier>`.
