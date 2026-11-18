import js from "@eslint/js";
import prettier from "eslint-config-prettier/flat";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

const PURE_RULES_MESSAGE =
  "packages/rules est un paquet pur (NF-QUA-04) : aucun import hors du paquet.";
const PURE_GAME_MESSAGE =
  "packages/game est un paquet pur (NF-QUA-04) : imports relatifs et API publique de @quarter-bells/rules uniquement (ADR 0015).";
const PURE_PROTOCOL_MESSAGE =
  "packages/protocol est un paquet pur (NF-QUA-04) : imports relatifs et API publique de @quarter-bells/rules et @quarter-bells/game uniquement (ADR 0017).";
const DETERMINISM_MESSAGE =
  "Les paquets purs (rules, game, protocol) ne lisent ni l'heure système ni un hasard non maîtrisé : injecter une horloge ou une graine.";
const PUBLIC_API_MESSAGE =
  "apps/web n'importe que l'API publique d'un paquet (son index.ts) : @quarter-bells/<paquet>, sans sous-chemin.";
const HARDCODED_TEXT_MESSAGE =
  "Aucun texte affiché en dur (NF-I18N-01) : ajouter le message dans apps/web/src/i18n/messages/fr.json et l'afficher avec react-intl.";
const WEB_DEPENDENCIES_MESSAGE =
  "apps/web ne dépend que de packages/rules, packages/protocol et, pour l'adaptateur local seulement, packages/game (voir apps/web/README.md).";
const LOCAL_ADAPTER_ONLY_MESSAGE =
  "Seul l'adaptateur local (apps/web/src/gateway/local/) fait tourner le moteur de partie. L'écran lit la vue avec usePlayerView et envoie des commandes avec useSendCommand (ADR 0017).";
const SCREEN_STATE_MESSAGE =
  "L'écran ne lit jamais l'état complet d'une épreuve : il reçoit une PlayerView de @quarter-bells/protocol (ADR 0017). Les fonctions pures de rules restent permises, appelées sur la vue.";

// Imports de apps/web vérifiés partout, code de production comme tests.
const WEB_IMPORT_PATTERNS = [
  // @quarter-bells/rules/src/cards/card : contourne index.ts.
  { regex: "^@quarter-bells/[^/]+/", message: PUBLIC_API_MESSAGE },
  // ../../../packages/rules/src/... : même contournement, en relatif.
  {
    regex: "^\\.\\.?/(.*/)?(packages|apps)/",
    message: PUBLIC_API_MESSAGE,
  },
  // Les autres applications ne sont pas des dépendances.
  {
    regex: "^@quarter-bells/(server|mobile|web)$",
    message: WEB_DEPENDENCIES_MESSAGE,
  },
];

// Ce qui, dans @quarter-bells/rules, décrit ou fait avancer l'état complet
// d'une épreuve. Interdit au code de l'écran, types compris : il passe par la
// vue d'un joueur.
const RULES_STATE_IMPORT = {
  name: "@quarter-bells/rules",
  importNames: [
    "Trial",
    "PlacingTrial",
    "ResolvedTrial",
    "Seat",
    "TrialPlacement",
    "TrialSetup",
    "TrialAction",
    "TrialResult",
    "PlaceCardAction",
    "createTrial",
    "applyTrialAction",
    "currentPlayer",
  ],
  message: SCREEN_STATE_MESSAGE,
};

export default defineConfig([
  globalIgnores(["**/node_modules/", "**/dist/", "**/coverage/", ".vitest/"]),

  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Un switch sur une union (le kind d'une règle, par exemple) doit traiter
  // chaque cas. Sans cette règle, TypeScript accepte qu'un case manque dès que
  // la fonction peut renvoyer undefined : le kind oublié passerait en silence.
  // Réservée aux fichiers TypeScript : elle a besoin des types.
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/switch-exhaustiveness-check": "error",
    },
  },

  // Les fichiers JavaScript (cette config) n'appartiennent à aucun projet TypeScript.
  {
    files: ["**/*.js"],
    extends: [tseslint.configs.disableTypeChecked],
  },

  // packages/rules, code de production : uniquement des imports relatifs.
  {
    files: ["packages/rules/src/**/*.ts"],
    ignores: ["**/*.test.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { regex: "^(?!typebox(/|$))[^.]", message: PURE_RULES_MESSAGE },
          ],
        },
      ],
    },
  },

  // packages/game, code de production : imports relatifs, et rules par son
  // API publique (pas de sous-chemin comme @quarter-bells/rules/src/...).
  {
    files: ["packages/game/src/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^(?!@quarter-bells/rules$)[^.]",
              message: PURE_GAME_MESSAGE,
            },
            // ../../rules/src/... : contourne l'API publique en relatif.
            { regex: "(^|/)rules/src/", message: PURE_GAME_MESSAGE },
          ],
        },
      ],
    },
  },

  // packages/protocol, code de production : imports relatifs, et rules et
  // game par leur API publique.
  {
    files: ["packages/protocol/src/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^(?!@quarter-bells/(rules|game)$)[^.]",
              message: PURE_PROTOCOL_MESSAGE,
            },
            {
              regex: "(^|/)(rules|game)/src/",
              message: PURE_PROTOCOL_MESSAGE,
            },
          ],
        },
      ],
    },
  },

  // Paquets purs, code de production : ni heure système ni hasard sans graine.
  {
    files: [
      "packages/rules/src/**/*.ts",
      "packages/game/src/**/*.ts",
      "packages/protocol/src/**/*.ts",
    ],
    ignores: ["**/*.test.ts"],
    rules: {
      "no-restricted-properties": [
        "error",
        { object: "Math", property: "random", message: DETERMINISM_MESSAGE },
        { object: "Date", property: "now", message: DETERMINISM_MESSAGE },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "NewExpression[callee.name='Date']",
          message: DETERMINISM_MESSAGE,
        },
      ],
    },
  },

  // packages/rules, tests : imports relatifs et vitest uniquement.
  {
    files: ["packages/rules/src/**/*.test.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { regex: "^(?!\\.|vitest$)", message: PURE_RULES_MESSAGE },
          ],
        },
      ],
    },
  },

  // apps/web : règles de React.
  // - react-hooks vérifie l'ordre des appels de hooks et les dépendances des
  //   effets, la principale source d'erreurs en React (ADR 0012).
  // - react-refresh vérifie qu'un fichier de composants n'exporte que des
  //   composants (ou des constantes), sans quoi le rechargement à chaud de Vite
  //   recharge toute la page au lieu du seul composant modifié.
  {
    files: ["apps/web/**/*.{ts,tsx}"],
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
  },

  // apps/web : uniquement l'API publique des paquets autorisés. L'écran ne
  // connaît que la passerelle et la vue d'un joueur (ADR 0017) : ni le moteur
  // de partie, ni l'état complet d'une épreuve.
  //
  // Les trois blocs suivants configurent la même règle : pour un fichier, ESLint
  // ne garde que le dernier bloc qui le concerne. Chacun reprend donc
  // WEB_IMPORT_PATTERNS.
  {
    files: ["apps/web/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@quarter-bells/game",
              message: LOCAL_ADAPTER_ONLY_MESSAGE,
            },
            RULES_STATE_IMPORT,
          ],
          patterns: WEB_IMPORT_PATTERNS,
        },
      ],
    },
  },

  // L'adaptateur local fait tourner le moteur de partie : c'est son rôle.
  {
    files: ["apps/web/src/gateway/local/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        { paths: [RULES_STATE_IMPORT], patterns: WEB_IMPORT_PATTERNS },
      ],
    },
  },

  // Les tests construisent des parties et des vues pour nourrir la passerelle.
  {
    files: ["apps/web/test/**/*.{ts,tsx}", "apps/web/e2e/**/*.ts"],
    rules: {
      "no-restricted-imports": ["error", { patterns: WEB_IMPORT_PATTERNS }],
    },
  },

  // apps/web : aucun texte affiché écrit en dur dans les composants (NF-I18N-01).
  // Les sélecteurs repèrent le texte entre deux balises, une chaîne placée
  // entre accolades, et les attributs lus par l'utilisateur ou un lecteur
  // d'écran. Un attribut vide reste permis : alt="" marque une image
  // décorative, que le lecteur d'écran doit ignorer. Un texte qui doit vraiment rester en dur (rare) se justifie par
  // un commentaire eslint-disable-next-line.
  {
    files: ["apps/web/src/**/*.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        { selector: "JSXText[value=/\\S/]", message: HARDCODED_TEXT_MESSAGE },
        {
          selector: "JSXExpressionContainer > Literal[value=/\\S/]",
          message: HARDCODED_TEXT_MESSAGE,
        },
        {
          selector: "JSXExpressionContainer > TemplateLiteral",
          message: HARDCODED_TEXT_MESSAGE,
        },
        {
          selector:
            "JSXAttribute[name.name=/^(aria-label|aria-description|aria-placeholder|aria-valuetext|title|alt|placeholder|label)$/] > Literal[value=/\\S/]",
          message: HARDCODED_TEXT_MESSAGE,
        },
      ],
    },
  },

  // Toujours en dernier : désactive les règles qui feraient doublon avec Prettier.
  prettier,
]);
